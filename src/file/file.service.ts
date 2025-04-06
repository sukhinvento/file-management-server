import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument, StorageType } from './schemas/file.schema';
import { ProcessedData, ProcessedDataDocument } from './schemas/processed-data.schema';
import { S3StorageService } from './storage/s3-storage.service';
import { LocalStorageService } from './storage/local-storage.service';
import { StorageService } from './storage/storage.interface';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { Multer } from 'multer';

interface FieldValidationRules {
  required?: boolean;
  type?: 'number' | 'date' | 'boolean' | 'string';
}

interface Metadata {
  [key: string]: FieldValidationRules;
}

@Injectable()
export class FileService {
  private storageServices: Record<StorageType, StorageService>;

  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(ProcessedData.name) private processedDataModel: Model<ProcessedDataDocument>,
    private readonly s3StorageService: S3StorageService,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.storageServices = {
      s3: this.s3StorageService,
      local: this.localStorageService,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    metadata: Metadata,
    userId: string,
    clientId: string,
    storageType: StorageType = 's3',
  ) {
    // Validate file type
    if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.mimetype)) {
      throw new Error('Invalid file type. Only CSV and Excel files are allowed.');
    }

    const storageService = this.storageServices[storageType];
    if (!storageService) {
      throw new Error(`Invalid storage type: ${storageType}`);
    }

    // Upload to storage
    const path = `${clientId}/${Date.now()}/${file.originalname}`;
    const fileName = await storageService.uploadFile(file, path);

    // Save file metadata to MongoDB
    const savedFile = await this.fileModel.create({
      filename: fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: fileName,
      clientId,
      userId,
      metadata,
      storageType,
    });

    return savedFile;
  }

  async downloadFile(fileId: string, userId: string, clientId: string) {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.clientId !== clientId) {
      throw new ForbiddenException('Access denied');
    }

    const storageService = this.storageServices[file.storageType];
    const fileBuffer = await storageService.getFile(file.path);
    
    return {
      buffer: fileBuffer,
      filename: file.originalName,
      mimeType: file.mimeType,
    };
  }

  async processFile(fileId: string, userId: string, clientId: string) {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.clientId !== clientId) {
      throw new ForbiddenException('Access denied');
    }

    const storageService = this.storageServices[file.storageType];
    const fileBuffer = await storageService.getFile(file.path);
    let data: any[];

    if (file.mimeType === 'text/csv') {
      data = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
      });
    } else {
      const workbook = XLSX.read(fileBuffer);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    // Process and validate data
    const processedData = await Promise.all(
      data.map(async (row, index) => {
        const errors = this.validateRow(row, file.metadata as Metadata);
        return this.processedDataModel.create({
          fileId,
          clientId,
          rowIndex: index,
          data: row,
          errors,
          audit: {
            createdBy: userId,
            updatedBy: userId,
            lastUpdated: new Date(),
            changeHistory: [],
          },
        });
      }),
    );

    file.isProcessed = true;
    await file.save();

    return processedData;
  }

  private validateRow(row: any, metadata: Metadata): string[] {
    const errors: string[] = [];
    for (const [field, rules] of Object.entries(metadata)) {
      if (rules.required && !row[field]) {
        errors.push(`Field ${field} is required`);
      }
      if (row[field] && rules.type) {
        switch (rules.type) {
          case 'number':
            if (isNaN(Number(row[field]))) {
              errors.push(`Field ${field} must be a number`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(row[field]))) {
              errors.push(`Field ${field} must be a valid date`);
            }
            break;
          case 'boolean':
            if (!['true', 'false', true, false].includes(row[field])) {
              errors.push(`Field ${field} must be a boolean`);
            }
            break;
        }
      }
    }
    return errors;
  }

  async getProcessedData(
    fileId: string,
    page: number,
    limit: number,
    userId: string,
    clientId: string,
  ) {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.clientId !== clientId) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.processedDataModel
        .find({ fileId })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.processedDataModel.countDocuments({ fileId }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateField(
    fileId: string,
    recordId: string,
    fieldName: string,
    value: any,
    userId: string,
    clientId: string,
  ) {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.clientId !== clientId) {
      throw new ForbiddenException('Access denied');
    }

    const record = await this.processedDataModel.findById(recordId);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    const oldValue = record.data[fieldName];
    record.data[fieldName] = value;
    record.audit.changeHistory.push({
      field: fieldName,
      oldValue,
      newValue: value,
      changedBy: userId,
      changedAt: new Date(),
    });
    record.audit.updatedBy = userId;
    record.audit.lastUpdated = new Date();

    await record.save();
    return record;
  }
} 
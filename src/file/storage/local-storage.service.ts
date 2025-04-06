import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly uploadDir = 'uploads';

  constructor() {
    // Ensure upload directory exists
    fs.mkdir(this.uploadDir, { recursive: true }).catch(console.error);
  }

  async uploadFile(file: Express.Multer.File, filePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      const dirPath = path.dirname(fullPath);
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, file.buffer);
      
      return filePath;
    } catch (error) {
      throw new Error(`Failed to upload file to local storage: ${error.message}`);
    }
  }

  async getFile(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new Error(`Failed to get file from local storage: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      throw new Error(`Failed to delete file from local storage: ${error.message}`);
    }
  }
} 
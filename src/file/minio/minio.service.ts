import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: MinioClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.minioClient = new MinioClient({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
      port: this.configService.get<number>('MINIO_PORT'),
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });
  }

  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    try {
      const bucket = this.configService.get<string>('MINIO_BUCKET');
      const fileName = `${path}/${file.originalname}`;

      await this.minioClient.putObject(
        bucket,
        fileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      return fileName;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFile(path: string): Promise<Buffer> {
    try {
      const bucket = this.configService.get<string>('MINIO_BUCKET');
      const stream = await this.minioClient.getObject(bucket, path);
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (error) => reject(error));
      });
    } catch (error) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const bucket = this.configService.get<string>('MINIO_BUCKET');
      await this.minioClient.removeObject(bucket, path);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
} 
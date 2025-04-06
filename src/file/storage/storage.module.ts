import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [S3StorageService, LocalStorageService],
  exports: [S3StorageService, LocalStorageService],
})
export class StorageModule {} 
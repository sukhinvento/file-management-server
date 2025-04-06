import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { ProcessedData, ProcessedDataSchema } from './schemas/processed-data.schema';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: ProcessedData.name, schema: ProcessedDataSchema },
    ]),
    StorageModule,
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {} 
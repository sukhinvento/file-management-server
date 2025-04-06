import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StorageType = 's3' | 'local';

export type FileDocument = File & Document;

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: false })
  isProcessed: boolean;

  @Prop({ type: String, enum: ['s3', 'local'], default: 's3' })
  storageType: StorageType;

  @Prop()
  processingError?: string;
}

export const FileSchema = SchemaFactory.createForClass(File); 
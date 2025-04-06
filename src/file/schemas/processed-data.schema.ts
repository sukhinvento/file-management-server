import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedDataDocument = ProcessedData & Document;

@Schema({ timestamps: true })
export class ProcessedData {
  @Prop({ required: true, ref: 'File' })
  fileId: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  rowIndex: number;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ type: [String], default: [] })
  errors: string[];

  @Prop({ type: Object })
  audit: {
    createdBy: string;
    updatedBy: string;
    lastUpdated: Date;
    changeHistory: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      changedBy: string;
      changedAt: Date;
    }>;
  };
}

export const ProcessedDataSchema = SchemaFactory.createForClass(ProcessedData); 
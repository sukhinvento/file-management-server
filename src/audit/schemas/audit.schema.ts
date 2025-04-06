import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  resourceType: string;

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop({ required: true })
  environment: string;

  @Prop()
  error?: string;
}

export const AuditSchema = SchemaFactory.createForClass(Audit); 
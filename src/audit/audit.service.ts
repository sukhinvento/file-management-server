import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from './schemas/audit.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(Audit.name) private auditModel: Model<AuditDocument>,
    private readonly configService: ConfigService,
  ) {}

  async log(
    action: string,
    userId: string,
    clientId: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
    error?: string,
  ) {
    return this.auditModel.create({
      action,
      userId,
      clientId,
      resourceType,
      resourceId,
      details,
      environment: this.configService.get('NODE_ENV'),
      error,
    });
  }

  async getAuditLogs(
    userId?: string,
    clientId?: string,
    resourceType?: string,
    resourceId?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const query: any = {};
    if (userId) query.userId = userId;
    if (clientId) query.clientId = clientId;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 
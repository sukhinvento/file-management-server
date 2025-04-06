import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Patch,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { StorageType } from './schemas/file.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User } from '../auth/decorators/user.decorator';
import { Client } from '../auth/decorators/client.decorator';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        metadata: {
          type: 'string',
          description: 'JSON string containing file metadata',
        },
        userId: {
          type: 'string',
        },
        clientId: {
          type: 'string',
        },
        storageType: {
          type: 'string',
          enum: ['s3', 'local'],
          default: 's3',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata: string,
    @Body('userId') userId: string,
    @Body('clientId') clientId: string,
    @Body('storageType') storageType: StorageType = 's3',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let parsedMetadata;
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      throw new BadRequestException('Invalid metadata format');
    }

    return this.fileService.uploadFile(file, parsedMetadata, userId, clientId, storageType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Download a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'clientId', required: true })
  async downloadFile(
    @Param('id') fileId: string,
    @Query('userId') userId: string,
    @Query('clientId') clientId: string,
  ) {
    return this.fileService.downloadFile(fileId, userId, clientId);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
        },
        clientId: {
          type: 'string',
        },
      },
      required: ['userId', 'clientId'],
    },
  })
  async processFile(
    @Param('id') fileId: string,
    @Body('userId') userId: string,
    @Body('clientId') clientId: string,
  ) {
    return this.fileService.processFile(fileId, userId, clientId);
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Get processed data' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'page', required: false, type: 'number', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', default: 10 })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'clientId', required: true })
  async getProcessedData(
    @Param('id') fileId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('userId') userId: string,
    @Query('clientId') clientId: string,
  ) {
    return this.fileService.getProcessedData(fileId, page, limit, userId, clientId);
  }

  @Patch(':fileId/record/:recordId/field/:fieldName')
  @ApiOperation({ summary: 'Update a field in a record' })
  async updateField(
    @Param('fileId') fileId: string,
    @Param('recordId') recordId: string,
    @Param('fieldName') fieldName: string,
    @Body('value') value: any,
    @User() userId: string,
    @Client() clientId: string,
  ) {
    return this.fileService.updateField(
      fileId,
      recordId,
      fieldName,
      value,
      userId,
      clientId,
    );
  }
} 
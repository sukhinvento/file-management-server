export interface StorageService {
  uploadFile(file: Express.Multer.File, path: string): Promise<string>;
  getFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<void>;
} 
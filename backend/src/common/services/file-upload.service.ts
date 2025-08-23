import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedExtensions: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 100 * 1024 * 1024); // 100MB default
    this.allowedExtensions = this.configService.get<string[]>('ALLOWED_EXTENSIONS', [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.mp4', '.webm', '.ogg', '.avi', '.mov',
      '.mp3', '.wav', '.ogg', '.m4a',
      '.zip', '.rar', '.7z', '.tar', '.gz'
    ]);

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  async uploadFile(file: Express.Multer.File, courseId: number, userId: number): Promise<{
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    hash: string;
    uploadedAt: Date;
  }> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate secure filename
      const secureFileName = this.generateSecureFileName(file.originalname);
      
      // Create course-specific directory
      const courseDir = join(this.uploadDir, 'courses', courseId.toString());
      this.ensureDirectoryExists(courseDir);

      // Create user-specific subdirectory
      const userDir = join(courseDir, userId.toString());
      this.ensureDirectoryExists(userDir);

      // Generate file path
      const filePath = join(userDir, secureFileName);
      
      // Calculate file hash for integrity
      const fileHash = await this.calculateFileHash(file.buffer);

      // Write file to disk
      await this.writeFileToDisk(file.buffer, filePath);

      // Scan file for viruses (in production, integrate with antivirus service)
      await this.scanFileForViruses(filePath);

      return {
        fileName: secureFileName,
        originalName: file.originalname,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        hash: fileHash,
        uploadedAt: new Date(),
      };
    } catch (error) {
      throw new InternalServerErrorException(`File upload failed: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(filePath);
    } catch (error) {
      // Log error but don't throw to avoid exposing internal paths
      console.error('File deletion failed:', error);
    }
  }

  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    modifiedAt: Date;
    hash: string;
  }> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const hash = await this.calculateFileHash(buffer);

      return {
        exists: true,
        size: stats.size,
        modifiedAt: stats.mtime,
        hash: hash,
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        modifiedAt: new Date(),
        hash: '',
      };
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`
      );
    }

    const extension = extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `File extension '${extension}' is not allowed`
      );
    }

    // Check for null bytes in filename
    if (file.originalname.includes('\0')) {
      throw new BadRequestException('Invalid filename');
    }
  }

  private generateSecureFileName(originalName: string): string {
    const extension = extname(originalName);
    const baseName = basename(originalName, extension);
    
    // Generate UUID for uniqueness
    const uuid = uuidv4();
    
    // Sanitize base name (remove special characters)
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Combine: sanitized_name_uuid.extension
    return `${sanitizedName}_${uuid}${extension}`;
  }

  private async calculateFileHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async writeFileToDisk(buffer: Buffer, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.write(buffer);
      writeStream.end();
      
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (error) => reject(error));
    });
  }

  private async scanFileForViruses(filePath: string): Promise<void> {
    // In production, integrate with antivirus service like ClamAV
    // For now, we'll do basic checks
    
    // Check file size (very large files might be suspicious)
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    
    if (stats.size > 500 * 1024 * 1024) { // 500MB
      console.warn(`Large file detected: ${filePath} (${stats.size} bytes)`);
    }

    // Check for suspicious patterns in file content
    const buffer = await fs.readFile(filePath);
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000)); // First 1KB
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        // Log suspicious content but don't block (false positives possible)
        console.warn(`Suspicious content detected in file: ${filePath}`);
        break;
      }
    }
  }

  private ensureUploadDirectory(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

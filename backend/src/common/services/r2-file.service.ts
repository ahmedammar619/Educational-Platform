import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname, basename } from 'path';
import * as crypto from 'crypto';

@Injectable()
export class R2FileService {
  private readonly logger = new Logger(R2FileService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly publicUrlBase: string;
  private readonly maxFileSize: number;
  private readonly allowedExtensions: string[];

  constructor(private readonly configService: ConfigService) {
    // R2 Configuration
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'baraem');
    this.region = this.configService.get<string>('R2_REGION', 'weur');
    this.endpoint = this.configService.get<string>('R2_ENDPOINT', 'https://9f7f3b84be13f9cfee5aa178acad1d08.r2.cloudflarestorage.com');
    this.publicUrlBase = this.configService.get<string>('R2_PUBLIC_URL', `${this.endpoint}/${this.bucketName}`);

    // File restrictions
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 100 * 1024 * 1024); // 100MB default
    this.allowedExtensions = this.configService.get<string[]>('ALLOWED_EXTENSIONS', [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.mp4', '.webm', '.ogg', '.avi', '.mov',
      '.mp3', '.wav', '.ogg', '.m4a',
      '.zip', '.rar', '.7z', '.tar', '.gz'
    ]);

    // Initialize S3 Client for R2
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log(`R2FileService initialized with bucket: ${this.bucketName}`);
  }

  async uploadFile(file: Express.Multer.File, courseId: string, userId: string, folderId?: string): Promise<{
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    hash: string;
    uploadedAt: Date;
  }> {
    try {
      this.logger.log(`Starting file upload: ${file.originalname} for course ${courseId}`);

      // Validate file
      this.validateFile(file);

      // Generate secure filename and path
      const secureFileName = this.generateSecureFileName(file.originalname);
      const filePath = this.generateFilePath(courseId, userId, secureFileName, folderId);
      
      // Calculate file hash for integrity
      const fileHash = this.calculateFileHash(file.buffer);

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          originalName: file.originalname,
          courseId: courseId,
          userId: userId,
          folderId: folderId || '',
          hash: fileHash,
        },
      });

      await this.s3Client.send(uploadCommand);

      const fileUrl = `${this.publicUrlBase}/${filePath}`;

      this.logger.log(`File uploaded successfully: ${fileUrl}`);

      return {
        fileName: secureFileName,
        originalName: file.originalname,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        hash: fileHash,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`File upload failed: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Extract the key from the full URL if necessary
      const key = filePath.includes(this.publicUrlBase) 
        ? filePath.replace(`${this.publicUrlBase}/`, '')
        : filePath;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`File deletion failed: ${error.message}`);
    }
  }

  async getSignedDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const key = filePath.includes(this.publicUrlBase) 
        ? filePath.replace(`${this.publicUrlBase}/`, '')
        : filePath;

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to generate download URL: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    const fileExtension = extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(`File type ${fileExtension} is not allowed`);
    }

    // Additional security checks
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }
  }

  private generateSecureFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = extname(originalName);
    const baseName = basename(originalName, ext);
    
    // Sanitize filename
    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    return `${sanitizedBaseName}-${timestamp}-${random}${ext}`;
  }

  private generateFilePath(courseId: string, userId: string, fileName: string, folderId?: string): string {
    if (folderId) {
      return `courses/${courseId}/folders/${folderId}/users/${userId}/${fileName}`;
    }
    return `courses/${courseId}/users/${userId}/${fileName}`;
  }

  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list objects to verify connection
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: 'health-check-test',
      });

      // This will throw an error if the bucket doesn't exist or credentials are invalid
      await this.s3Client.send(command).catch(() => {
        // Expected to fail for non-existent file, but connection should work
      });

      return true;
    } catch (error) {
      this.logger.error(`R2 health check failed: ${error.message}`);
      return false;
    }
  }
}

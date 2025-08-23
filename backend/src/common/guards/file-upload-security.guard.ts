import { Injectable, CanActivate, ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class FileUploadSecurityGuard implements CanActivate {
  // Allowed file types for different categories
  private readonly allowedFileTypes = {
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    images: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    videos: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
    ],
    audio: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm',
    ],
    archives: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar',
    ],
  };

  // Maximum file sizes (in bytes)
  private readonly maxFileSizes = {
    documents: 50 * 1024 * 1024,    // 50MB
    images: 10 * 1024 * 1024,       // 10MB
    videos: 500 * 1024 * 1024,      // 500MB
    audio: 100 * 1024 * 1024,       // 100MB
    archives: 200 * 1024 * 1024,    // 200MB
  };

  // Dangerous file extensions to block
  private readonly blockedExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.msi', '.dll', '.sys', '.drv', '.ocx', '.cpl', '.hta', '.reg', '.ps1',
    '.sh', '.py', '.php', '.asp', '.aspx', '.jsp', '.pl', '.rb', '.cgi'
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const files = request.files || request.file;

    if (!files) {
      return true; // No files to validate
    }

    // Handle single file or array of files
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      this.validateFile(file);
    }

    return true;
  }

  private validateFile(file: any): void {
    // Validate file object structure
    if (!file || !file.mimetype || !file.size || !file.originalname) {
      throw new BadRequestException('Invalid file structure');
    }

    // Check file size
    this.validateFileSize(file);

    // Check file type
    this.validateFileType(file);

    // Check file extension
    this.validateFileExtension(file);

    // Check for suspicious content patterns
    this.validateFileContent(file);
  }

  private validateFileSize(file: any): void {
    const fileCategory = this.getFileCategory(file.mimetype);
    const maxSize = this.maxFileSizes[fileCategory];

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`
      );
    }
  }

  private validateFileType(file: any): void {
    const fileCategory = this.getFileCategory(file.mimetype);
    
    if (!fileCategory) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed`
      );
    }
  }

  private validateFileExtension(file: any): void {
    const extension = this.getFileExtension(file.originalname);
    
    if (this.blockedExtensions.includes(extension.toLowerCase())) {
      throw new ForbiddenException(
        `File extension '${extension}' is not allowed for security reasons`
      );
    }
  }

  private validateFileContent(file: any): void {
    // Check for suspicious patterns in filename
    const suspiciousPatterns = [
      /\.\.\//,           // Directory traversal
      /[<>:"|?*]/,        // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
      /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar)$/i, // Executable extensions
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.originalname)) {
        throw new ForbiddenException(
          'Filename contains suspicious patterns'
        );
      }
    }

    // Check for null bytes (potential security risk)
    if (file.originalname.includes('\0')) {
      throw new ForbiddenException(
        'Filename contains null bytes'
      );
    }
  }

  private getFileCategory(mimetype: string): string | null {
    for (const [category, types] of Object.entries(this.allowedFileTypes)) {
      if (types.includes(mimetype)) {
        return category;
      }
    }
    return null;
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface FileStats {
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

@Injectable()
export class FileManagementService {
  private readonly uploadsBasePath = './uploads';

  async createThumbnail(filePath: string, sizes: string[] = ['small', 'medium', 'large']): Promise<string[]> {
    // Implementation for creating thumbnails
    // This would typically use a library like sharp for image processing
    // For now, we'll return the original path for each size
    return sizes.map(size => `${filePath}_${size}`);
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    // Implementation for moving files between directories
    // This would use fs.rename or fs.copyFile + fs.unlink
    console.log(`Moving file from ${sourcePath} to ${destinationPath}`);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  async createBackup(courseId: string): Promise<string> {
    // Implementation for creating course backups
    const timestamp = Date.now();
    const backupPath = join(this.uploadsBasePath, 'backups', new Date().getFullYear().toString(), 
      (new Date().getMonth() + 1).toString().padStart(2, '0'), 
      new Date().getDate().toString().padStart(2, '0'), 
      `course_${courseId}_${timestamp}.zip`);
    
    console.log(`Creating backup at ${backupPath}`);
    return backupPath;
  }

  async cleanupTempFiles(): Promise<void> {
    // Implementation for cleaning up temporary files
    const tempPath = join(this.uploadsBasePath, 'temp');
    console.log(`Cleaning up temporary files in ${tempPath}`);
  }

  async getFileStats(filePath: string): Promise<FileStats> {
    const stats = statSync(filePath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  }

  createUploadPath(req: any, file: Express.Multer.File): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    let basePath = this.uploadsBasePath;
    
    // Determine upload type and create appropriate path
    if (req.route?.path?.includes('posts')) {
      basePath = join(basePath, 'courses', req.params.courseId, 'posts', req.params.postId || 'temp', 'attachments');
    } else if (req.route?.path?.includes('assignments')) {
      if (req.route?.path?.includes('submit')) {
        basePath = join(basePath, 'courses', req.params.courseId, 'assignments', req.params.assignmentId, 'submissions', req.user.id);
      } else {
        basePath = join(basePath, 'courses', req.params.courseId, 'assignments', req.params.assignmentId);
      }
    } else if (req.route?.path?.includes('profile')) {
      basePath = join(basePath, 'profile-pictures', req.user.id);
    } else if (req.route?.path?.includes('materials')) {
      if (req.body.folderId) {
        basePath = join(basePath, 'courses', req.params.courseId, 'materials', 'folders', req.body.folderId);
      } else {
        basePath = join(basePath, 'courses', req.params.courseId, 'materials', 'root');
      }
    } else {
      basePath = join(basePath, 'temp', req.sessionID || 'temp');
    }
    
    const fullPath = join(basePath, year, month);
    
    // Create directory if it doesn't exist
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
    
    return fullPath;
  }

  generateFileName(req: any, file: Express.Multer.File): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = extname(file.originalname);
    const nameWithoutExt = originalName.replace(extension, '');
    
    return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
  }

  isAllowedFileType(req: any, file: Express.Multer.File): boolean {
    // Define allowed file types by upload context
    const allowedMimeTypes = {
      posts: [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'application/pdf', 
        'text/plain', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      assignments: [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain'
      ],
      materials: [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'application/pdf', 
        'text/plain', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ],
      profile: [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'image/webp'
      ]
    };
    
    let context = 'materials'; // default
    if (req.route?.path?.includes('posts')) context = 'posts';
    else if (req.route?.path?.includes('assignments')) context = 'assignments';
    else if (req.route?.path?.includes('profile')) context = 'profile';
    
    return allowedMimeTypes[context].includes(file.mimetype);
  }
}

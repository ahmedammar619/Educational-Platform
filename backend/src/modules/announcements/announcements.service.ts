import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { AnnouncementPost } from './entities/announcement-post.entity';
import { AnnouncementPostAttachment } from './entities/announcement-post-attachment.entity';
import { CreateAnnouncementPostDto } from './dto/create-announcement-post.dto';
import { UpdateAnnouncementPostDto } from './dto/update-announcement-post.dto';
import { R2FileService } from '../../common/services/r2-file.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(AnnouncementPost)
    private announcementPostRepository: Repository<AnnouncementPost>,
    @InjectRepository(AnnouncementPostAttachment)
    private announcementPostAttachmentRepository: Repository<AnnouncementPostAttachment>,
    private readonly r2FileService: R2FileService,
  ) {}

  async createPost(
    createPostDto: CreateAnnouncementPostDto,
    authorId: string,
    file?: Express.Multer.File,
  ): Promise<AnnouncementPost> {
    console.log('Service - Creating announcement post:', { createPostDto, authorId, file: file?.originalname });

    const post = this.announcementPostRepository.create({
      ...createPostDto,
      authorId,
    });

    const savedPost = await this.announcementPostRepository.save(post);
    console.log('Service - Post created:', savedPost.id);

    // Handle file attachment if provided
    if (file) {
      await this.handleFileAttachment(savedPost.id, file);
    }

    // Return post with relations
    return this.announcementPostRepository.findOne({
      where: { id: savedPost.id },
      relations: ['author', 'attachments'],
    });
  }

  async getPosts(): Promise<AnnouncementPost[]> {
    console.log('Service - Getting all announcement posts');
    
    const posts = await this.announcementPostRepository.find({
      relations: ['author', 'attachments'],
      order: { createdAt: 'ASC' },
    });

    console.log('Service - Found posts:', posts.length);
    return posts;
  }

  async getPostById(postId: string): Promise<AnnouncementPost> {
    console.log('Service - Getting post by ID:', postId);

    const post = await this.announcementPostRepository.findOne({
      where: { id: postId },
      relations: ['author', 'attachments'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async updatePost(
    postId: string,
    updatePostDto: UpdateAnnouncementPostDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<AnnouncementPost> {
    console.log('Service - Updating post:', { postId, updatePostDto, userId, file: file?.originalname });

    const post = await this.getPostById(postId);

    // Check if user is admin (only admins can update announcement posts)
    if (post.author.role !== 'admin' && post.authorId !== userId) {
      throw new ForbiddenException('Only admins can update announcement posts');
    }

    // Update post fields
    Object.assign(post, updatePostDto);
    const updatedPost = await this.announcementPostRepository.save(post);

    // Handle new file attachment if provided
    if (file) {
      await this.handleFileAttachment(postId, file);
    }

    // Return updated post with relations
    return this.announcementPostRepository.findOne({
      where: { id: postId },
      relations: ['author', 'attachments'],
    });
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    console.log('Service - Deleting post:', { postId, userId });

    const post = await this.getPostById(postId);

    // Check if user is admin (only admins can delete announcement posts)
    if (post.author.role !== 'admin' && post.authorId !== userId) {
      throw new ForbiddenException('Only admins can delete announcement posts');
    }

    // Delete associated files and attachment records
    if (post.attachments && post.attachments.length > 0) {
      for (const attachment of post.attachments) {
        // Delete file from disk
        await this.deleteAttachmentFile(attachment.id);
        // Delete attachment record from database
        await this.announcementPostAttachmentRepository.remove(attachment);
      }
    }

    await this.announcementPostRepository.remove(post);
    console.log('Service - Post deleted successfully');
  }

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    console.log('Service - Deleting attachment:', { attachmentId, userId });

    const attachment = await this.announcementPostAttachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['post', 'post.author'],
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if user is admin (only admins can delete attachments)
    if (attachment.post.author.role !== 'admin' && attachment.post.authorId !== userId) {
      throw new ForbiddenException('Only admins can delete attachments');
    }

    await this.deleteAttachmentFile(attachmentId);
    await this.announcementPostAttachmentRepository.remove(attachment);
    console.log('Service - Attachment deleted successfully');
  }

  async downloadAttachment(attachmentId: string): Promise<{ filePath: string; fileName: string }> {
    console.log('Service - Downloading attachment:', attachmentId);

    const attachment = await this.announcementPostAttachmentRepository.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    console.log('Service - Attachment found:', {
      id: attachment.id,
      fileName: attachment.fileName,
      filePath: attachment.filePath,
    });

    // Check if this is an R2 URL (new format) or legacy local path
    if (attachment.filePath.startsWith('http')) {
      // This is an R2 URL, return it directly
      console.log('Service - R2 URL detected, returning:', attachment.filePath);
      return {
        filePath: attachment.filePath,
        fileName: attachment.fileName,
      };
    } else {
      // Legacy local file handling
      const fullPath = path.join(process.cwd(), 'uploads', attachment.filePath);
      
      console.log('Service - Constructed full path:', fullPath);
      console.log('Service - File exists:', fs.existsSync(fullPath));
      
      if (!fs.existsSync(fullPath)) {
        // Try alternative path construction for backward compatibility
        const altPath = path.join(process.cwd(), attachment.filePath);
        console.log('Service - Trying alternative path:', altPath);
        console.log('Service - Alternative path exists:', fs.existsSync(altPath));
        
        if (fs.existsSync(altPath)) {
          return {
            filePath: altPath,
            fileName: attachment.fileName,
          };
        }
        
        throw new NotFoundException('File not found on disk');
      }

      return {
        filePath: fullPath,
        fileName: attachment.fileName,
      };
    }
  }

  async previewAttachment(attachmentId: string): Promise<{ filePath: string; fileName: string }> {
    return this.downloadAttachment(attachmentId);
  }

  private async handleFileAttachment(postId: string, file: Express.Multer.File): Promise<void> {
    console.log('Service - Handling file attachment:', { postId, fileName: file.originalname });

    try {
      // Upload to R2 using the announcements course ID
      const uploadResult = await this.r2FileService.uploadFile(
        file,
        'announcements', // courseId for announcements
        postId, // userId (using postId as userId for announcements)
        undefined // folderId
      );

      console.log('Service - File uploaded to R2:', uploadResult.fileUrl);

      // Save attachment record to database with R2 URL
      const attachment = this.announcementPostAttachmentRepository.create({
        postId,
        fileName: file.originalname,
        filePath: uploadResult.fileUrl, // Store R2 URL
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      await this.announcementPostAttachmentRepository.save(attachment);
      console.log('Service - File attachment saved:', attachment.id);
    } catch (error) {
      console.error('Service - Error uploading file to R2:', error);
      throw error;
    }
  }

  private async deleteAttachmentFile(attachmentId: string): Promise<void> {
    const attachment = await this.announcementPostAttachmentRepository.findOne({
      where: { id: attachmentId },
    });

    if (attachment) {
      // Check if this is an R2 URL (new format) or legacy local path
      if (attachment.filePath.startsWith('http')) {
        // This is an R2 URL, delete from R2
        try {
          await this.r2FileService.deleteFile(attachment.filePath);
          console.log('Service - File deleted from R2:', attachment.filePath);
        } catch (error) {
          console.error('Service - Error deleting file from R2:', error);
        }
      } else {
        // Legacy local file handling
        const fullPath = path.join(process.cwd(), 'uploads', attachment.filePath);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('Service - File deleted from disk:', fullPath);
        } else {
          // Try alternative path construction for backward compatibility
          const altPath = path.join(process.cwd(), attachment.filePath);
          if (fs.existsSync(altPath)) {
            fs.unlinkSync(altPath);
            console.log('Service - File deleted from disk (alt path):', altPath);
          }
        }
      }
    }
  }
}

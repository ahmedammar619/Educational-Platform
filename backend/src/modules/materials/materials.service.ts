import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { unlink, mkdir, writeFile } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { R2FileService } from '../../common/services/r2-file.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Post } from './entities/post.entity';
import { PostAttachment } from './entities/post-attachment.entity';
import { Folder } from './entities/folder.entity';
import { File } from './entities/file.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Attendance } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { ZoomMeeting } from '../zoom/entities/zoom-meeting.entity';
import { CreatePostDto } from './dto/posts/create-post.dto';
import { UpdatePostDto } from './dto/posts/update-post.dto';
import { CreateFolderDto } from './dto/files/create-folder.dto';
import { CreateAssignmentDto } from './dto/assignments/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/assignments/update-assignment.dto';
import { GradeAssignmentDto } from './dto/assignments/grade-assignment.dto';
import { MarkAttendanceDto } from './dto/attendance/mark-attendance.dto';
import { BulkAttendanceDto } from './dto/attendance/bulk-attendance.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostAttachment)
    private readonly postAttachmentRepository: Repository<PostAttachment>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ZoomMeeting)
    private readonly zoomMeetingRepository: Repository<ZoomMeeting>,
    private readonly r2FileService: R2FileService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // Posts
  async createPost(courseId: string, createPostDto: CreatePostDto, authorId: string, file?: Express.Multer.File): Promise<Post> {
    console.log('Creating post with:', { courseId, createPostDto, authorId, file: file?.originalname });
    console.log('AuthorId type:', typeof authorId, 'Value:', authorId);
    
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      console.log('Course not found:', courseId);
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    console.log('Course found:', course.name);

    const post = this.postRepository.create({
      ...createPostDto,
      courseId,
      authorId: authorId
    });
    console.log('Post created:', post);

    try {
      const savedPost = await this.postRepository.save(post);
      console.log('Post saved successfully:', savedPost.id);
      
      // Get author information for notifications
      const author = await this.userRepository.findOne({ where: { id: authorId } });
      
      // Send notifications to students about the new post
      try {
        const students = await this.getStudentsInCourse(courseId);
        if (students.length > 0 && author) {
          const studentIds = students.map(student => student.id);
          await this.notificationsService.createNewPostNotification(
            studentIds,
            savedPost.subject,
            `${author.firstName} ${author.lastName}`,
            course.name,
            {
              postId: savedPost.id,
              courseId: courseId,
              authorId: authorId
            }
          );
          console.log('✅ New post notifications sent to', students.length, 'students');
        }
      } catch (error) {
        console.error('❌ Failed to send new post notifications:', error);
      }
      
      // Handle file attachment if provided
      if (file) {
        console.log('Creating post attachment for file:', file.originalname);
        
        try {
          // Check if R2 is available (has credentials)
          const hasR2Credentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
          
          if (hasR2Credentials) {
            // Upload file to R2
            console.log('☁️ Service - Uploading post attachment to R2...');
            const uploadResult = await this.r2FileService.uploadFile(file, courseId, authorId, undefined);
            
            console.log('✅ Service - R2 upload successful:', {
              fileName: uploadResult.fileName,
              fileUrl: uploadResult.fileUrl,
              fileSize: uploadResult.fileSize
            });

            // Create attachment record with R2 URL
            const attachment = this.postAttachmentRepository.create({
              postId: savedPost.id,
              fileName: uploadResult.fileName,
              filePath: uploadResult.fileUrl, // Store R2 URL instead of local path
              fileSize: uploadResult.fileSize,
              mimeType: uploadResult.mimeType
            });
            
            console.log('Creating attachment record:', attachment);
            const savedAttachment = await this.postAttachmentRepository.save(attachment);
            console.log('Post attachment created successfully:', savedAttachment);
          } else {
            // Fall back to local storage
            console.log('📁 Service - R2 not available, using local storage...');
            
            // Get course information for folder structure
            const courseInfo = await this.courseRepository.findOne({ 
              where: { id: courseId },
              relations: ['class']
            });
            
            // Generate unique filename using your old project pattern
            const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext);
            const fileName = `${baseName}-${unique}${ext}`;
            
            // Create organized folder structure: uploads/Grade/Course/posts/
            const gradeName = courseInfo?.class?.name || 'Default-Grade';
            const courseName = courseInfo?.name || 'Default-Course';
            const uploadsDir = path.join(process.cwd(), 'uploads', gradeName, courseName, 'posts');
            
            // Ensure directory exists
            const fs = require('fs');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const filePath = path.join(uploadsDir, fileName);
            
            // Write file to disk
            fs.writeFileSync(filePath, file.buffer);
            
            console.log('File saved to:', filePath);
            
            // Create attachment record - store relative path from uploads folder
            const relativePath = path.join(gradeName, courseName, 'posts', fileName);
            const attachment = this.postAttachmentRepository.create({
              postId: savedPost.id,
              fileName: fileName, // Store only filename
              filePath: relativePath, // Store relative path from uploads folder
              fileSize: file.size,
              mimeType: file.mimetype
            });
            
            console.log('Creating attachment record:', attachment);
            const savedAttachment = await this.postAttachmentRepository.save(attachment);
            console.log('Post attachment created successfully:', savedAttachment);
          }
        } catch (error) {
          console.error('❌ Service - Post attachment upload failed:', error);
          throw new BadRequestException(`Failed to upload post attachment: ${error.message}`);
        }
      }
      
      return savedPost;
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  }

  async getCoursePosts(courseId: string): Promise<Post[]> {
    // Optimized query with proper relations to avoid N+1 queries
    const posts = await this.postRepository.find({
      where: { courseId },
      relations: ['attachments', 'author'], // Load author relation directly
      order: { createdAt: 'ASC' }
    });

    return posts;
  }

  async updatePost(postId: string, updatePostDto: UpdatePostDto, file?: Express.Multer.File): Promise<Post> {
    // Use a database transaction to ensure consistency
    return await this.postRepository.manager.transaction(async (transactionalEntityManager) => {
      try {
        console.log('Service - Updating post in transaction:', { postId, updatePostDto, file: file?.originalname });
        
        const post = await transactionalEntityManager.findOne(Post, { 
          where: { id: postId },
          relations: ['attachments', 'course', 'author']
        });
        if (!post) {
          throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        // Update basic post fields (only update fields that are provided)
        if (updatePostDto.subject !== undefined) {
          post.subject = updatePostDto.subject;
        }
        if (updatePostDto.description !== undefined) {
          post.description = updatePostDto.description;
        }
        if (updatePostDto.attachmentFileNames !== undefined) {
          // Handle attachment file names if needed
          console.log('Service - Attachment file names provided:', updatePostDto.attachmentFileNames);
        }

        // Handle file upload if provided (same logic as createPost)
        if (file) {
          try {
            console.log('Service - Processing file upload for post update:', {
              originalname: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              bufferLength: file.buffer?.length
            });
            
            // Validate file
            if (!file.buffer) {
              throw new Error('File buffer is empty or undefined');
            }
            
            // Check if R2 is available (has credentials)
            const hasR2Credentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
            
            if (hasR2Credentials) {
              // Upload file to R2
              console.log('☁️ Service - Uploading post attachment to R2...');
              const uploadResult = await this.r2FileService.uploadFile(file, post.courseId, post.authorId, undefined);
              
              console.log('✅ Service - R2 upload successful:', {
                fileName: uploadResult.fileName,
                fileUrl: uploadResult.fileUrl,
                fileSize: uploadResult.fileSize
              });

              // Create attachment record with R2 URL
              const attachmentData = {
                postId: postId, // Use the postId parameter directly instead of post.id
                fileName: uploadResult.fileName,
                filePath: uploadResult.fileUrl, // Store R2 URL instead of local path
                fileSize: uploadResult.fileSize,
                mimeType: uploadResult.mimeType,
                uploadedAt: new Date()
              };
              
              console.log('Service - Attachment data prepared:', {
                postId: attachmentData.postId,
                fileName: attachmentData.fileName,
                filePath: attachmentData.filePath
              });

              const savedAttachment = await transactionalEntityManager.save(PostAttachment, attachmentData);
              console.log('Service - Attachment created for post update:', {
                id: savedAttachment.id,
                postId: savedAttachment.postId,
                fileName: savedAttachment.fileName,
                filePath: savedAttachment.filePath
              });
            } else {
              // Fall back to local storage
              console.log('📁 Service - R2 not available, using local storage...');
              
              // Get course information for folder structure
              const course = await this.courseRepository.findOne({
                where: { id: post.courseId },
                relations: ['class']
              });

              if (!course) {
                throw new NotFoundException(`Course with ID ${post.courseId} not found`);
              }

              // Create organized folder structure (same as createPost)
              const className = course.class?.name || 'Unknown-Class';
              const courseName = course.name || 'Unknown-Course';
              const uploadDir = path.join(process.cwd(), 'uploads', className, courseName, 'posts');
              
              console.log('Service - Upload directory:', uploadDir);
              
              // Ensure directory exists
              await mkdir(uploadDir, { recursive: true });

              // Generate unique filename (same as createPost)
              const timestamp = Date.now();
              const randomString = Math.random().toString(36).substring(2, 8);
              const fileExtension = path.extname(file.originalname);
              const baseName = path.basename(file.originalname, fileExtension);
              const uniqueFileName = `${baseName}-${timestamp}-${randomString}${fileExtension}`;
              
              const filePath = path.join(uploadDir, uniqueFileName);
              
              console.log('Service - Saving file to:', filePath);
              
              // Save file to disk
              await writeFile(filePath, file.buffer);
              console.log(`File saved to: ${filePath}`);

              // Create attachment record (same as createPost)
              console.log('Service - Creating attachment with postId:', {
                postId: postId,
                postIdType: typeof postId,
                postIdLength: postId?.length,
                postIdFromPost: post.id,
                postIdFromPostType: typeof post.id
              });
              
              // Create a new attachment object directly (not using repository.create)
              const attachmentData = {
                postId: postId, // Use the postId parameter directly instead of post.id
                fileName: uniqueFileName,
                filePath: path.join(className, courseName, 'posts', uniqueFileName), // Store relative path
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date()
              };
              
              console.log('Service - Attachment data prepared:', {
                postId: attachmentData.postId,
                fileName: attachmentData.fileName,
                filePath: attachmentData.filePath
              });

              const savedAttachment = await transactionalEntityManager.save(PostAttachment, attachmentData);
              console.log('Service - Attachment created for post update:', {
                id: savedAttachment.id,
                postId: savedAttachment.postId,
                fileName: savedAttachment.fileName,
                filePath: savedAttachment.filePath
              });
            }
          } catch (fileError) {
            console.error('Service - Error processing file upload:', fileError);
            throw new Error(`Failed to process file upload: ${fileError.message}`);
          }
        }

        // Save the updated post (only update the fields that changed)
        console.log('Service - About to save updated post:', {
          id: post.id,
          subject: post.subject,
          description: post.description,
          courseId: post.courseId,
          authorId: post.authorId,
          hasFileUpload: !!file
        });
      
        try {
          // Use update instead of save to avoid entity conflicts
          await transactionalEntityManager.update(Post, { id: postId }, {
            subject: post.subject,
            description: post.description,
            updatedAt: new Date()
          });
          console.log('Service - Post updated successfully');
        } catch (saveError) {
          console.error('Service - Error updating post:', saveError);
          throw new Error(`Failed to update post: ${saveError.message}`);
        }
      
        // Return the updated post with all relations (same as createPost)
        console.log('Service - Fetching updated post with relations...');
        let finalPost;
        try {
          finalPost = await transactionalEntityManager.findOne(Post, {
            where: { id: postId },
            relations: ['attachments', 'author', 'course']
          });
          
          if (!finalPost) {
            throw new Error(`Failed to fetch updated post with ID ${postId}`);
          }
          
          console.log('Service - Post fetched successfully with relations');
        } catch (fetchError) {
          console.error('Service - Error fetching post with relations:', fetchError);
          throw new Error(`Failed to fetch updated post: ${fetchError.message}`);
        }
        
        console.log('Service - Final post fetched:', {
          id: finalPost.id,
          attachmentsCount: finalPost.attachments?.length || 0,
          hasAuthor: !!finalPost.author,
          hasCourse: !!finalPost.course,
          attachments: finalPost.attachments?.map(att => ({
            id: att.id,
            fileName: att.fileName,
            filePath: att.filePath
          })) || []
        });
        
        return finalPost;
      } catch (error) {
        console.error('Service - Error in updatePost transaction:', error);
        throw error;
      }
    });
  }

  async deletePost(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({ 
      where: { id: postId },
      relations: ['attachments']
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Delete associated attachments first
    if (post.attachments && post.attachments.length > 0) {
      console.log(`Deleting ${post.attachments.length} attachments for post ${postId}`);
      
      // Delete physical files from filesystem or R2
      for (const attachment of post.attachments) {
        try {
          if (attachment.filePath) {
            // Check if this is an R2 URL (new format) or legacy local path
            if (attachment.filePath.startsWith('http')) {
              // This is an R2 URL, delete from R2
              console.log('🗑️ Deleting attachment from R2:', attachment.filePath);
              await this.r2FileService.deleteFile(attachment.filePath);
              console.log('✅ R2 attachment deleted successfully:', attachment.filePath);
            } else {
              // Legacy local file handling
              const filePath = path.join(process.cwd(), 'uploads', attachment.filePath);
              await unlink(filePath);
              console.log(`Deleted file: ${filePath}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to delete file ${attachment.filePath}:`, error.message);
          // Continue with database deletion even if file deletion fails
        }
      }
      
      // Delete attachment records from database
      await this.postAttachmentRepository.delete({ postId: postId });
    }

    // Delete the post
    await this.postRepository.delete(postId);
    console.log(`Post ${postId} deleted successfully`);
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    console.log('Service - Deleting attachment:', attachmentId);
    
    const attachment = await this.postAttachmentRepository.findOne({
      where: { id: attachmentId }
    });
    
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    // Delete physical file from R2 or local filesystem
    try {
      if (attachment.filePath) {
        // Check if this is an R2 URL (new format) or legacy local path
        if (attachment.filePath.startsWith('http')) {
          // This is an R2 URL, delete from R2
          console.log('🗑️ Deleting attachment from R2:', attachment.filePath);
          await this.r2FileService.deleteFile(attachment.filePath);
          console.log('✅ R2 attachment deleted successfully:', attachment.filePath);
        } else {
          // Legacy local file handling
          const filePath = path.join(process.cwd(), 'uploads', attachment.filePath);
          await unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to delete file ${attachment.filePath}:`, error.message);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment record from database
    await this.postAttachmentRepository.delete(attachmentId);
    console.log(`Attachment ${attachmentId} deleted successfully`);
  }

  // Files and Folders
  async createFolder(courseId: string, createFolderDto: CreateFolderDto, userId: string): Promise<Folder> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if parent folder exists and belongs to the same course
    if (createFolderDto.parentFolderId) {
      const parentFolder = await this.folderRepository.findOne({
        where: { id: createFolderDto.parentFolderId, courseId }
      });
      if (!parentFolder) {
        throw new BadRequestException('Parent folder not found or does not belong to this course');
      }
    }

    // Check if a folder with the same name already exists in the same course and parent folder
    const existingFolder = await this.folderRepository.findOne({
      where: {
        name: createFolderDto.name,
        courseId,
        parentFolderId: createFolderDto.parentFolderId || null
      }
    });

    if (existingFolder) {
      throw new BadRequestException(`A folder with the name "${createFolderDto.name}" already exists in this location`);
    }

    const folder = this.folderRepository.create({
      ...createFolderDto,
      courseId,
      createdBy: userId
    });

    return await this.folderRepository.save(folder);
  }

  async updateFolder(folderId: string, updateData: { name: string }, userId: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator']
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`);
    }

    // Check if user has permission to edit this folder (only creator or admin)
    if (folder.createdBy !== userId) {
      // You might want to add admin role check here
      throw new BadRequestException('You do not have permission to edit this folder');
    }

    // Check if a folder with the same name already exists in the same course and parent folder
    const existingFolder = await this.folderRepository.findOne({
      where: {
        name: updateData.name,
        courseId: folder.courseId,
        parentFolderId: folder.parentFolderId
      }
    });

    // If found a folder with same name, make sure it's not the current folder
    if (existingFolder && existingFolder.id !== folderId) {
      throw new BadRequestException(`A folder with the name "${updateData.name}" already exists in this location`);
    }

    // Update the folder name
    folder.name = updateData.name;
    folder.updatedAt = new Date();

    return await this.folderRepository.save(folder);
  }

  async uploadFile(courseId: string, file: Express.Multer.File, folderId?: string, userId?: string): Promise<File> {
    console.log('📁 Service - Starting R2 file upload:', {
      courseId,
      fileName: file?.originalname,
      fileSize: file?.size,
      folderId,
      userId,
      hasFile: !!file
    });

    const course = await this.courseRepository.findOne({ 
      where: { id: courseId },
      relations: ['class']
    });
    if (!course) {
      console.log('❌ Service - Course not found:', courseId);
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    console.log('✅ Service - Course found:', course.name);

    // Check if folder exists and belongs to the same course
    if (folderId) {
      console.log('🔍 Service - Checking folder existence:', { folderId, courseId });
      const folder = await this.folderRepository.findOne({
        where: { id: folderId, courseId }
      });
      if (!folder) {
        console.log('❌ Service - Folder not found:', { folderId, courseId });
        throw new BadRequestException('Folder not found or does not belong to this course');
      }
      console.log('✅ Service - Folder found:', { name: folder.name, id: folder.id, courseId: folder.courseId });
    } else {
      console.log('📁 Service - No folderId provided, uploading to root level');
    }

    try {
      // Check if R2 is available (has credentials)
      const hasR2Credentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
      
      if (hasR2Credentials) {
        // Upload file to R2
        console.log('☁️ Service - Uploading to R2...');
        const uploadResult = await this.r2FileService.uploadFile(file, courseId, userId, folderId);
        
        console.log('✅ Service - R2 upload successful:', {
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.fileUrl,
          fileSize: uploadResult.fileSize
        });

        // Create file entity with R2 URL
        const fileEntity = this.fileRepository.create({
          fileName: uploadResult.fileName,
          filePath: uploadResult.fileUrl, // Store R2 URL instead of local path
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          courseId,
          folderId,
          uploadedBy: userId
        });

        const savedFile = await this.fileRepository.save(fileEntity);
        console.log('✅ Service - File saved successfully:', savedFile.id);
        return savedFile;
      } else {
        // Fall back to local storage
        console.log('📁 Service - R2 not available, using local storage...');
        
        // Generate unique filename using the same pattern as before
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const fileName = `${baseName}-${unique}${ext}`;
        
        // Create organized folder structure: uploads/Grade/Course/files/
        const gradeName = course?.class?.name || 'Default-Grade';
        const courseName = course?.name || 'Default-Course';
        const uploadsDir = path.join(process.cwd(), 'uploads', gradeName, courseName, 'files');
        
        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
          console.log('📁 Service - Created directory:', uploadsDir);
        }
        
        const filePath = path.join(uploadsDir, fileName);
        
        // Write file to disk
        fs.writeFileSync(filePath, file.buffer);
        console.log('📁 Service - File saved to:', filePath);
        
        // Create relative path from uploads folder
        const relativePath = path.join(gradeName, courseName, 'files', fileName);

        const fileEntity = this.fileRepository.create({
          fileName: fileName,
          filePath: relativePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          courseId,
          folderId,
          uploadedBy: userId
        });

        const savedFile = await this.fileRepository.save(fileEntity);
        console.log('✅ Service - File saved successfully:', savedFile.id);
        return savedFile;
      }
    } catch (error) {
      console.error('❌ Service - File upload failed:', error);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async getCourseFolders(courseId: string): Promise<Folder[]> {
    console.log('🔍 Service - Getting folders for course:', courseId);

    // First, get all folders for the course
    const allFolders = await this.folderRepository.find({
      where: { courseId },
      relations: ['creator', 'subFolders', 'files'],
      order: { createdAt: 'ASC' }
    });

    console.log('🔍 Service - Found all folders:', allFolders.map(f => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId,
      subFoldersCount: f.subFolders?.length || 0
    })));

    // Get only root folders (parentFolderId is null)
    const rootFolders = allFolders.filter(folder => folder.parentFolderId === null);

    console.log('🔍 Service - Root folders:', rootFolders.map(f => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId
    })));

    // For each root folder, manually populate its subFolders with the correct nested structure
    const foldersWithNestedSubFolders = rootFolders.map(rootFolder => {
      const populateSubFolders = (folder: Folder): Folder => {
        const subFolders = allFolders.filter(f => f.parentFolderId === folder.id);
        return {
          ...folder,
          subFolders: subFolders.map(subFolder => populateSubFolders(subFolder))
        };
      };

      return populateSubFolders(rootFolder);
    });

    console.log('🔍 Service - Final nested structure:', foldersWithNestedSubFolders.map(f => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId,
      subFoldersCount: f.subFolders?.length || 0
    })));

    return foldersWithNestedSubFolders;
  }

  async getAllFolders(courseId?: string, parentFolderId?: string): Promise<Folder[]> {
    const whereCondition: any = {};
    
    if (courseId) {
      whereCondition.courseId = courseId;
    }
    
    if (parentFolderId) {
      whereCondition.parentFolderId = parentFolderId;
    } else if (parentFolderId === null) {
      whereCondition.parentFolderId = null; // Get root folders only
    }

    console.log('🔍 Service - Getting all folders with condition:', whereCondition);

    const folders = await this.folderRepository.find({
      where: whereCondition,
      relations: ['creator', 'subFolders', 'files', 'course'],
      order: { createdAt: 'ASC' }
    });

    console.log('🔍 Service - Found all folders:', folders.map(f => ({
      id: f.id,
      name: f.name,
      courseId: f.courseId,
      parentFolderId: f.parentFolderId,
      subFoldersCount: f.subFolders?.length || 0
    })));

    // If we're getting root folders (parentFolderId is null), filter out subfolders
    if (parentFolderId === null) {
      const rootFolderIds = new Set(folders.map(f => f.id));
      const filteredFolders = folders.filter(folder => {
        // Keep root folders (parentFolderId is null)
        if (folder.parentFolderId === null) {
          return true;
        }
        // Filter out subfolders that are already included in parent folders' subFolders
        return !rootFolderIds.has(folder.parentFolderId);
      });

      console.log('🔍 Service - Filtered all folders for root:', filteredFolders.map(f => ({
        id: f.id,
        name: f.name,
        courseId: f.courseId,
        parentFolderId: f.parentFolderId
      })));

      return filteredFolders;
    }

    return folders;
  }

  async getCourseFiles(courseId: string, folderId?: string): Promise<File[]> {
    const whereCondition: any = { courseId };
    
    if (folderId !== undefined && folderId !== null) {
      // If folderId is provided and not null/undefined, get files for that specific folder
      whereCondition.folderId = folderId;
    } else {
      // If no folderId or folderId is null/undefined, get only root-level files (folderId: null)
      whereCondition.folderId = IsNull();
    }

    console.log('🔍 Service - Getting files with condition:', {
      courseId,
      folderId,
      folderIdType: typeof folderId,
      whereCondition
    });

    const files = await this.fileRepository.find({
      where: whereCondition,
      relations: ['uploader', 'folder'],
      order: { uploadedAt: 'DESC' }
    });

    console.log('🔍 Service - Found files:', {
      count: files.length,
      files: files.map(f => ({ id: f.id, fileName: f.fileName, folderId: f.folderId }))
    });

    return files;
  }

  async getCourseFilesAndFolders(courseId: string, folderId?: string): Promise<{ files: File[], folders: Folder[] }> {
    const [files, folders] = await Promise.all([
      this.getCourseFiles(courseId, folderId),
      this.getFoldersInFolder(courseId, folderId)
    ]);

    return { files, folders };
  }

  async getFoldersInFolder(courseId: string, parentFolderId?: string): Promise<Folder[]> {
    const whereCondition: any = { courseId };
    
    if (parentFolderId) {
      whereCondition.parentFolderId = parentFolderId;
    } else {
      whereCondition.parentFolderId = null; // Get root folders only
    }

    // Removed excessive logging for performance

    // Optimized query - only load essential relations
    const folders = await this.folderRepository.find({
      where: whereCondition,
      relations: ['creator'], // Only load creator, not subFolders and files
      order: { createdAt: 'ASC' }
    });

    // If we're at root level (parentFolderId is null), filter out any folders that have a parent
    // This ensures only true root folders are returned
    if (!parentFolderId) {
      const rootFolders = folders.filter(folder => folder.parentFolderId === null);
      return rootFolders;
    }

    return folders;
  }

  async getFileById(fileId: string): Promise<File | null> {
    return await this.fileRepository.findOne({ 
      where: { id: fileId },
      relations: ['uploader', 'folder']
    });
  }

  async getAllCourseFiles(courseId: string): Promise<File[]> {
    console.log('🔍 Service - Getting all files for course:', courseId);

    const files = await this.fileRepository.find({
      where: { courseId },
      relations: ['uploader', 'folder'],
      order: { uploadedAt: 'DESC' }
    });

    console.log('🔍 Service - Found files:', files.map(f => ({
      id: f.id,
      fileName: f.fileName,
      folderId: f.folderId,
      folderName: f.folder?.name || 'root'
    })));

    return files;
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    try {
      // Check if this is an R2 URL (new format) or legacy local path
      if (file.filePath.startsWith('http')) {
        // This is an R2 URL, delete from R2
        console.log('🗑️ Deleting file from R2:', file.filePath);
        await this.r2FileService.deleteFile(file.filePath);
        console.log('✅ R2 file deleted successfully:', file.filePath);
      } else {
        // Legacy local file handling
        const fullFilePath = path.join(process.cwd(), 'uploads', file.filePath);
        console.log('🗑️ Deleting physical file:', fullFilePath);
        
        // Check if file exists before trying to delete
        if (fs.existsSync(fullFilePath)) {
          await fs.promises.unlink(fullFilePath);
          console.log('✅ Physical file deleted successfully:', fullFilePath);
        } else {
          console.warn('⚠️ Physical file not found, but continuing with database deletion:', fullFilePath);
        }
      }
    } catch (fileError) {
      console.error('❌ Error deleting file:', fileError);
      // Don't throw error here - we still want to delete from database
      // The file might have been manually deleted or moved
    }

    // Delete the file record from database
    await this.fileRepository.delete(fileId);
    console.log('✅ File record deleted from database:', fileId);
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['files', 'subFolders']
    });
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`);
    }

    console.log('🗑️ Deleting folder:', folder.name, 'with', folder.files?.length || 0, 'files and', folder.subFolders?.length || 0, 'subfolders');

    // Recursively delete all files in this folder (including physical files)
    if (folder.files && folder.files.length > 0) {
      console.log('🗑️ Deleting', folder.files.length, 'files from folder:', folder.name);
      for (const file of folder.files) {
        try {
          // Check if this is an R2 URL (new format) or legacy local path
          if (file.filePath.startsWith('http')) {
            // This is an R2 URL, delete from R2
            console.log('🗑️ Deleting file from R2:', file.filePath);
            await this.r2FileService.deleteFile(file.filePath);
            console.log('✅ R2 file deleted successfully:', file.filePath);
          } else {
            // Legacy local file handling
            const fullFilePath = path.join(process.cwd(), 'uploads', file.filePath);
            console.log('🗑️ Deleting physical file:', fullFilePath);
            
            if (fs.existsSync(fullFilePath)) {
              await fs.promises.unlink(fullFilePath);
              console.log('✅ Physical file deleted successfully:', fullFilePath);
            } else {
              console.warn('⚠️ Physical file not found:', fullFilePath);
            }
          }
        } catch (fileError) {
          console.error('❌ Error deleting file:', fileError);
          // Continue with database deletion even if file deletion fails
        }
        
        // Delete the file record from database
        await this.fileRepository.delete(file.id);
        console.log('✅ File record deleted from database:', file.id);
      }
    }

    // Recursively delete all subfolders
    if (folder.subFolders && folder.subFolders.length > 0) {
      console.log('🗑️ Deleting', folder.subFolders.length, 'subfolders from folder:', folder.name);
      for (const subfolder of folder.subFolders) {
        await this.deleteFolder(subfolder.id);
      }
    }

    // Finally, delete the folder itself
    await this.folderRepository.delete(folderId);
    console.log('✅ Folder deleted from database:', folderId);
  }

  // Assignments
  async createAssignment(courseId: string, createAssignmentDto: CreateAssignmentDto, userId: string): Promise<Assignment> {
    // Load course with class relation
    const course = await this.courseRepository.findOne({ 
      where: { id: courseId },
      relations: ['class']
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Get student list from the classes.students field (comma-separated string)
    const classData = await this.courseRepository.manager.query(`
      SELECT c.id, c.name, c.students 
      FROM classes c
      WHERE c.id = $1
    `, [course.classId]);

    // Enhanced debugging for class data
    console.log('Raw class data:', classData);

    // Get student IDs from the classes.students field
    let studentIds: string[] = [];
    if (classData.length > 0 && classData[0].students) {
      const studentsString = classData[0].students;
      studentIds = studentsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
      
      // Remove duplicates to prevent duplicate notifications
      studentIds = [...new Set(studentIds)];
    }

    console.log('Found student IDs from classes.students field:', studentIds);

    console.log('Course found:', { courseId, courseName: course.name, classId: course.class?.id });
    console.log('Parsed student IDs:', studentIds);

    const assignment = this.assignmentRepository.create({
      ...createAssignmentDto,
      courseId,
      createdBy: userId
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Send notifications to all students in the class
    if (studentIds && studentIds.length > 0) {
      console.log('Found', studentIds.length, 'students to notify');;
      try {
        await this.notificationsService.createAssignmentPublishedNotification(
          studentIds,
          savedAssignment.name, // Use 'name' instead of 'title'
          course.name,
          {
            assignmentId: savedAssignment.id,
            courseId: course.id,
            dueDate: savedAssignment.dueDate
          }
        );
        console.log('✅ Assignment published notifications sent successfully');
      } catch (error) {
        console.error('❌ Failed to send assignment published notifications:', error);
      }
    } else {
      console.log('⚠️ No students found in class or class not found:', {
        hasClass: !!course.class,
        hasStudents: false, // Students are now tracked in course.students array
        studentsCount: 0
      });
    }

    return savedAssignment;
  }

  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { courseId },
      relations: ['creator', 'submissions', 'submissions.student'],
      order: { dueDate: 'ASC' }
    });
  }
  
  async updateAssignment(assignmentId: string, updateAssignmentDto: UpdateAssignmentDto, userId: string): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({ 
      where: { id: assignmentId },
      relations: ['creator', 'submissions']
    });
    
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }
    
    // Update assignment properties
    Object.assign(assignment, updateAssignmentDto);
    
    // Save the updated assignment
    return await this.assignmentRepository.save(assignment);
  }

  async deleteAssignment(assignmentId: string, userId: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({ 
      where: { id: assignmentId },
      relations: ['creator', 'submissions']
    });
    
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    console.log('🗑️ Deleting assignment:', { assignmentId, assignmentName: assignment.name });

    // Delete associated submission files first
    if (assignment.submissions && assignment.submissions.length > 0) {
      for (const submission of assignment.submissions) {
        if (submission.filePath) {
          try {
            await this.r2FileService.deleteFile(submission.filePath);
            console.log('✅ Deleted submission file:', submission.filePath);
          } catch (error) {
            console.error('❌ Failed to delete submission file:', submission.filePath, error);
          }
        }
      }
    }

    // Delete the assignment (this will cascade delete submissions due to foreign key constraints)
    await this.assignmentRepository.remove(assignment);
    
    console.log('✅ Assignment deleted successfully');
  }

  async submitAssignment(assignmentId: string, file: Express.Multer.File, studentId: string): Promise<AssignmentSubmission> {
    const assignment = await this.assignmentRepository.findOne({ 
      where: { id: assignmentId },
      relations: ['course', 'course.class', 'course.teacher', 'creator']
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Check if student has already submitted
    const existingSubmission = await this.assignmentSubmissionRepository.findOne({
      where: { assignmentId, studentId }
    });

    // If there's an existing submission, we'll update it instead of creating a new one
    let isUpdate = false;
    let oldFilePath = null;
    
    if (existingSubmission) {
      isUpdate = true;
      oldFilePath = existingSubmission.filePath;
    }

    // Check if R2 is available (has credentials)
    const hasR2Credentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
    
    let fileName: string;
    let filePath: string;
    
    if (hasR2Credentials) {
      // Upload file to R2
      console.log('☁️ Service - Uploading assignment submission to R2...');
      const uploadResult = await this.r2FileService.uploadFile(file, assignment.courseId, studentId, undefined);
      
      console.log('✅ Service - R2 upload successful:', {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize
      });

      fileName = uploadResult.fileName;
      filePath = uploadResult.fileUrl; // Store R2 URL instead of local path
    } else {
      // Fall back to local storage
      console.log('📁 Service - R2 not available, using local storage...');
      
      // Generate unique filename using your old project pattern
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      fileName = `${baseName}-${unique}${ext}`;
      
      // Create organized folder structure: uploads/Grade/Course/assignments/
      const gradeName = assignment.course?.class?.name || 'Default-Grade';
      const courseName = assignment.course?.name || 'Default-Course';
      const uploadsDir = path.join(process.cwd(), 'uploads', gradeName, courseName, 'assignments');
      
      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const localFilePath = path.join(uploadsDir, fileName);
      
      // Write file to disk
      fs.writeFileSync(localFilePath, file.buffer);
      
      // Create relative path from uploads folder
      filePath = path.join(gradeName, courseName, 'assignments', fileName);
    }

    let submission;
    
    if (isUpdate && existingSubmission) {
      // Update existing submission
      existingSubmission.fileName = fileName;
      existingSubmission.filePath = filePath;
      existingSubmission.fileSize = file.size;
      existingSubmission.mimeType = file.mimetype;
      existingSubmission.submittedAt = new Date(); // Update submission time
      existingSubmission.grade = null; // Clear previous grade
      existingSubmission.feedback = null; // Clear previous feedback
      existingSubmission.gradedBy = null;
      existingSubmission.gradedAt = null;
      
      submission = existingSubmission;
      
      // Delete old file if it exists and is different
      if (oldFilePath && oldFilePath !== filePath) {
        try {
          // Check if this is an R2 URL (new format) or legacy local path
          if (oldFilePath.startsWith('http')) {
            // This is an R2 URL, delete from R2
            console.log('🗑️ Deleting old submission file from R2:', oldFilePath);
            await this.r2FileService.deleteFile(oldFilePath);
            console.log('✅ Old R2 submission file deleted successfully:', oldFilePath);
          } else {
            // Legacy local file handling
            const oldFileAbsolutePath = path.join(process.cwd(), 'uploads', oldFilePath);
            if (fs.existsSync(oldFileAbsolutePath)) {
              fs.unlinkSync(oldFileAbsolutePath);
            }
          }
        } catch (error) {
          console.warn(`Failed to delete old file: ${oldFilePath}`, error);
        }
      }
    } else {
      // Create new submission
      submission = this.assignmentSubmissionRepository.create({
        assignmentId,
        studentId,
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype
      });
    }

    const savedSubmission = await this.assignmentSubmissionRepository.save(submission);

    // Send notification to teacher about assignment submission
    if (assignment.course && assignment.course.teacherId && !isUpdate) { // Only notify for new submissions, not updates
      try {
        const student = await this.userRepository.findOne({ where: { id: studentId } });
        if (student) {
          await this.notificationsService.createAssignmentSubmittedNotification(
            assignment.course.teacherId, // Always send to the course teacher, not assignment creator
            `${student.firstName} ${student.lastName}`,
            assignment.name, // Use 'name' instead of 'title'
            assignment.course.name,
            {
              assignmentId: assignment.id,
              submissionId: savedSubmission.id,
              studentId: studentId
            }
          );
        }
      } catch (error) {
        console.error('Failed to send assignment submitted notification:', error);
      }
    }

    return savedSubmission;
  }

  async gradeAssignment(submissionId: string, gradeDto: GradeAssignmentDto, graderId: string): Promise<AssignmentSubmission> {
    const submission = await this.assignmentSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'assignment.course', 'student']
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    submission.grade = gradeDto.grade;
    submission.feedback = gradeDto.feedback;
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();

    const savedSubmission = await this.assignmentSubmissionRepository.save(submission);

    // Send notification to student about graded assignment
    if (submission.student) {
      try {
        await this.notificationsService.createAssignmentGradedNotification(
          submission.student.id,
          submission.assignment.name, // Use 'name' instead of 'title'
          submission.grade,
          submission.assignment.course.name,
          {
            assignmentId: submission.assignment.id,
            submissionId: submission.id,
            feedback: submission.feedback
          }
        );
      } catch (error) {
        console.error('Failed to send assignment graded notification:', error);
      }
    }

    return savedSubmission;
  }

  async getAssignmentSubmission(submissionId: string): Promise<AssignmentSubmission> {
    const submission = await this.assignmentSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'student']
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    return submission;
  }

  // Attendance
  async markAttendance(courseId: string, attendanceDto: MarkAttendanceDto, markerId: string): Promise<Attendance> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        courseId,
        studentId: attendanceDto.studentId,
        date: new Date(attendanceDto.date)
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = attendanceDto.status;
      existingAttendance.notes = attendanceDto.notes;
      existingAttendance.markedBy = markerId;
      existingAttendance.markedAt = new Date();
      const savedAttendance = await this.attendanceRepository.save(existingAttendance);
      
      // Send notification if student is marked absent
      if (attendanceDto.status === 'absent') {
        await this.sendAbsentNotification(savedAttendance, course);
      }
      
      return savedAttendance;
    }

    const attendance = this.attendanceRepository.create({
      ...attendanceDto,
      courseId,
      markedBy: markerId,
      date: new Date(attendanceDto.date)
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    
    // Send notification if student is marked absent
    if (attendanceDto.status === 'absent') {
      await this.sendAbsentNotification(savedAttendance, course);
    }
    
    return savedAttendance;
  }

  // Bulk Attendance - New method for handling multiple students at once
  async markBulkAttendance(courseId: string, bulkAttendanceDto: BulkAttendanceDto, markerId: string): Promise<Attendance[]> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const attendanceRecords: Attendance[] = [];
    // Ensure proper date handling - convert string to Date object
    const attendanceDate = new Date(bulkAttendanceDto.date);
    console.log('📅 Date conversion:', {
      originalDate: bulkAttendanceDto.date,
      convertedDate: attendanceDate,
      isValid: !isNaN(attendanceDate.getTime())
    });

    // Validate date
    if (isNaN(attendanceDate.getTime())) {
      throw new BadRequestException(`Invalid date format: ${bulkAttendanceDto.date}`);
    }

    console.log('💾 markBulkAttendance called with:', {
      courseId,
      date: bulkAttendanceDto.date,
      attendanceDate: attendanceDate.toISOString(),
      meetingId: bulkAttendanceDto.meetingId,
      studentsCount: bulkAttendanceDto.students.length,
      markerId
    });

    // Process each student's attendance
    for (const studentAttendance of bulkAttendanceDto.students) {
      try {
        // Validate student data
        if (!studentAttendance.id || !studentAttendance.name || !studentAttendance.status) {
          console.error(`❌ Invalid student data:`, studentAttendance);
          throw new BadRequestException(`Invalid student data for student: ${JSON.stringify(studentAttendance)}`);
        }

        // Check if attendance already exists for this student and meeting
        // Note: We don't include date in the query since the unique constraint is on courseId, studentId, meetingId
        const existingAttendance = await this.attendanceRepository.findOne({
          where: {
            courseId,
            studentId: studentAttendance.id,
            meetingId: bulkAttendanceDto.meetingId
          }
        });

        console.log(`👤 Processing student ${studentAttendance.id} (${studentAttendance.name}): ${studentAttendance.status}`);
        console.log(`🔍 Existing attendance found:`, !!existingAttendance);

        if (existingAttendance) {
          console.log(`🔄 Updating existing attendance for student ${studentAttendance.id}`);
          // Update existing attendance
          existingAttendance.status = studentAttendance.status;
          existingAttendance.day = bulkAttendanceDto.day;
          existingAttendance.time = bulkAttendanceDto.time;
          existingAttendance.markedBy = markerId;
          existingAttendance.markedAt = new Date();
          const savedRecord = await this.attendanceRepository.save(existingAttendance);
          attendanceRecords.push(savedRecord);
          console.log(`✅ Updated attendance record:`, {
            id: savedRecord.id,
            studentId: savedRecord.studentId,
            status: savedRecord.status,
            date: savedRecord.date,
            meetingId: savedRecord.meetingId
          });
        } else {
          console.log(`➕ Creating new attendance record for student ${studentAttendance.id}`);
          // Create new attendance record
          const attendance = this.attendanceRepository.create({
            courseId,
            studentId: studentAttendance.id,
            date: attendanceDate,
            day: bulkAttendanceDto.day,
            time: bulkAttendanceDto.time,
            meetingId: bulkAttendanceDto.meetingId,
            status: studentAttendance.status,
            markedBy: markerId,
            markedAt: new Date()
          });
          const savedRecord = await this.attendanceRepository.save(attendance);
          attendanceRecords.push(savedRecord);
          console.log(`✅ Created attendance record:`, {
            id: savedRecord.id,
            studentId: savedRecord.studentId,
            status: savedRecord.status,
            date: savedRecord.date,
            meetingId: savedRecord.meetingId
          });
        }
      } catch (error) {
        console.error(`❌ Error processing student ${studentAttendance.id}:`, error);
        // Continue with other students even if one fails
        throw new BadRequestException(`Failed to process attendance for student ${studentAttendance.name}: ${error.message}`);
      }
    }

    return attendanceRecords;
  }

  async getCourseAttendance(courseId: string, date?: string): Promise<any[]> {
    try {
      console.log('🔍 Getting course attendance for course:', courseId);
      
      // First, get all meetings for this course (excluding cancelled meetings)
      const meetings = await this.zoomMeetingRepository.find({
        where: { 
          courseId,
          status: Not('cancelled') // Exclude cancelled meetings
        },
        order: { createdAt: 'DESC' }
      });
      
      console.log('📅 Found meetings for course:', meetings.length, meetings.map(m => ({ id: m.id, title: m.title, date: m.date })));
      
      if (meetings.length === 0) {
        console.log('ℹ️ No meetings found for course:', courseId);
        return [];
      }
      
      const result = [];
      
      // Process each meeting
      for (const meeting of meetings) {
        try {
          console.log(`➡️ Processing meeting: ${meeting.title} (ID: ${meeting.id})`);
          
          // Get attendance records for this specific meeting
          const attendanceRecords = await this.attendanceRepository.find({
            where: { 
              courseId, 
              meetingId: meeting.id 
            },
            relations: ['student', 'marker'],
            order: { date: 'DESC' }
          });
          
          console.log(`📊 Found ${attendanceRecords.length} attendance records for meeting ${meeting.id}`);
          console.log(`🔍 Query details:`, {
            courseId,
            meetingId: meeting.id,
            meetingTitle: meeting.title
          });
          
          // Log each found record
          attendanceRecords.forEach((record, index) => {
            console.log(`📋 Record ${index + 1}:`, {
              id: record.id,
              studentId: record.studentId,
              status: record.status,
              date: record.date,
              meetingId: record.meetingId,
              markedAt: record.markedAt
            });
          });
          
          // Get all students for this course
          const students = await this.getCourseStudents(courseId);
          console.log(`👥 Found ${students.length} students for course ${courseId}`);
          
          // Create attendance data for this meeting
          const meetingAttendance = {
            id: meeting.id,
            meetingId: meeting.id,
            meetingName: meeting.title,
            date: meeting.date,
            day: meeting.date ? new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long' }) : null,
            time: meeting.time && meeting.period ? `${meeting.time} ${meeting.period}` : null,
            students: []
          };
          
          // Process each student
          for (const student of students) {
            // Find existing attendance record for this student and meeting
            const existingRecord = attendanceRecords.find(record => record.studentId === student.id);
            
            if (existingRecord) {
              // Student has an attendance record
              meetingAttendance.students.push({
                id: student.id,
                name: student.fullName || `${student.firstName} ${student.lastName}`,
                status: existingRecord.status,
                markedAt: existingRecord.markedAt,
                markedBy: existingRecord.markedBy,
                notes: existingRecord.notes
              });
              console.log(`✅ Student ${student.fullName || `${student.firstName} ${student.lastName}`} has attendance record: ${existingRecord.status}`);
            } else {
              // Student doesn't have an attendance record - mark as absent
              meetingAttendance.students.push({
                id: student.id,
                name: student.fullName || `${student.firstName} ${student.lastName}`,
                status: 'absent',
                markedAt: null,
                markedBy: null,
                notes: null
              });
              console.log(`⚠️ Student ${student.fullName || `${student.firstName} ${student.lastName}`} has no attendance record - marking as absent`);
            }
          }
          
          result.push(meetingAttendance);
          console.log(`✅ Processed meeting ${meeting.title} with ${meetingAttendance.students.length} students`);
          
        } catch (error) {
          console.error(`❌ Error processing meeting ${meeting.id}:`, error);
          // Continue with other meetings even if one fails
        }
      }
      
      console.log('📊 Returning attendance data for course:', courseId, 'Total meetings:', result.length);
      return result;
      
    } catch (error) {
      console.error('❌ Error in getCourseAttendance:', error);
      throw error;
    }
  }

  async getStudentAttendance(courseId: string, studentId: string): Promise<Attendance[]> {
    return await this.attendanceRepository.find({
      where: { courseId, studentId },
      relations: ['marker'],
      order: { date: 'DESC' }
    });
  }

  async getAttendanceByMeeting(courseId: string, meetingId: string): Promise<any> {
    try {
      console.log('Getting attendance for meeting:', { courseId, meetingId });

      // Verify course exists
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      // Get the meeting information first
      const meeting = await this.zoomMeetingRepository.findOne({
        where: { id: meetingId, courseId },
        relations: ['createdBy', 'course']
      });

      if (!meeting) {
        throw new NotFoundException(`Meeting with ID ${meetingId} not found for course ${courseId}`);
      }

      // Get all attendance records for this meeting
      const attendanceRecords = await this.attendanceRepository.find({
        where: { 
          courseId, 
          meetingId 
        },
        relations: ['student', 'marker'],
        order: { date: 'DESC' }
      });

      console.log('Found attendance records for meeting:', attendanceRecords.length);

      // Get all students enrolled in this course
      const courseStudents = await this.getCourseStudents(courseId);
      console.log('Found course students:', courseStudents.length);

      // Create student attendance map from existing records
      const attendanceMap = new Map();
      attendanceRecords.forEach(record => {
        attendanceMap.set(record.studentId, {
          id: record.studentId,
          name: record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown Student',
          status: record.status,
          markedAt: record.markedAt,
          markedBy: record.markedBy,
          notes: record.notes
        });
      });

      // Create students array with all enrolled students
      const students = courseStudents.map(student => {
        const attendance = attendanceMap.get(student.id);
        if (attendance) {
          return attendance;
        } else {
          // Student not in attendance records, mark as absent
          return {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            status: 'absent',
            markedAt: null,
            markedBy: null,
            notes: null
          };
        }
      });

      // Format meeting date and time
      const meetingDate = meeting.date ? new Date(meeting.date) : null;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const actualDay = meetingDate ? dayNames[meetingDate.getDay()] : null;
      const actualTime = meeting.time && meeting.period ? `${meeting.time} ${meeting.period}` : null;

      const result = {
        id: meetingId,
        courseId,
        date: meetingDate,
        day: actualDay,
        time: actualTime,
        meetingId: meetingId, // Explicitly include meetingId in the main response
        meetingName: meeting.title || 'Unknown Meeting',
        meetingDescription: meeting.description,
        meetingStatus: meeting.status,
        joinCount: meeting.joinCount,
        invitationLink: meeting.invitationLink,
        createdBy: meeting.createdBy ? {
          id: meeting.createdBy.id,
          firstName: meeting.createdBy.firstName,
          lastName: meeting.createdBy.lastName,
          email: meeting.createdBy.email
        } : null,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
        students: students
      };

      console.log('Returning attendance for meeting:', {
        meetingId,
        meetingName: result.meetingName,
        studentsCount: result.students.length,
        meetingDate: result.date,
        meetingDay: result.day,
        meetingTime: result.time
      });

      return result;
    } catch (error) {
      console.error('Error in getAttendanceByMeeting:', error);
      throw error;
    }
  }

  // Helper method to get course students
  private async getCourseStudents(courseId: string): Promise<any[]> {
    console.log('🔍 Getting students for course in materials service:', courseId);
    
    try {
      // Get the course with class relation
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['class']
      });

      if (!course) {
        console.log('❌ Course not found:', courseId);
        throw new NotFoundException('Course not found');
      }

      console.log('✅ Course found:', course.name, 'Class ID:', course.classId);
      console.log('📚 Class relation:', course.class?.name);
      
      // First, let's check what's actually in the class table
      console.log('🔍 Checking class data directly...');
      const classData = await this.courseRepository.manager.query(`
        SELECT id, name, students FROM classes WHERE id = $1
      `, [course.classId]);
      
      console.log('📋 Class data from database:', classData);
      
      if (classData.length === 0) {
        console.log('❌ Class not found in database');
        return [];
      }
      
      const classStudents = classData[0].students;
      console.log('👥 Students in class (raw):', classStudents);
      console.log('👥 Students type:', typeof classStudents);
      
      let students: any[] = [];
      
      // Check if students field has data
      if (classStudents && classStudents !== '') {
        let studentIds: string[] = [];
        
        // Handle both array and comma-separated string formats
        if (Array.isArray(classStudents)) {
          studentIds = classStudents;
          console.log('✅ Found students array in class:', studentIds);
        } else if (typeof classStudents === 'string') {
          // Parse comma-separated string
          studentIds = classStudents.split(',').map(id => id.trim()).filter(id => id.length > 0);
          console.log('✅ Found students string in class, parsed to array:', studentIds);
        }
        
        if (studentIds.length > 0) {
          // Get students by their IDs
          students = await this.userRepository.find({
            where: { 
              id: In(studentIds),
              role: Role.Student 
            }
          });
          
          console.log('✅ Found students by IDs:', students.length);
          students.forEach(student => {
            console.log(`  - Student: ${student.fullName || `${student.firstName} ${student.lastName}`} (ID: ${student.id})`);
          });
        } else {
          console.log('❌ No valid student IDs found in class database field');
        }
      } else {
        console.log('❌ No students found in class database field');
        
        // For the specific class "level 1", use the hardcoded student IDs as fallback
        if (course.classId === 'c2e8935d-1a07-481d-834d-7581ce96ca74') {
          const hardcodedStudentIds = [
            '505cced4-1943-48e4-9e0c-f6ad77e3f3b3',
            '735eb5ed-41dd-472e-9d4a-01f869763658'
          ];
          
          console.log('🔧 Using hardcoded student IDs for level 1 class:', hardcodedStudentIds);
          
          students = await this.userRepository.find({
            where: { 
              id: In(hardcodedStudentIds),
              role: Role.Student 
            }
          });
          
          console.log('✅ Found students with hardcoded IDs:', students.length);
          students.forEach(student => {
            console.log(`  - Student: ${student.fullName || `${student.firstName} ${student.lastName}`} (ID: ${student.id})`);
          });
        }
      }
      
      console.log('🎯 Final students count:', students.length);
      console.log('🎯 Final students:', students.map(s => s.fullName || `${s.firstName} ${s.lastName}`));
      
      return students;
    } catch (error) {
      console.error('❌ Error getting course students:', error);
      return [];
    }
  }

  // File attachment methods
  async getAttachment(attachmentId: string): Promise<PostAttachment> {
    return await this.postAttachmentRepository.findOne({
      where: { id: attachmentId }
    });
  }

  // Debug method to check attachments for a post
  async debugPostAttachments(postId: string): Promise<void> {
    console.log('=== DEBUG: Checking attachments for post:', postId);
    
    // Check if attachments exist in database
    const attachments = await this.postAttachmentRepository.find({
      where: { postId: postId }
    });
    
    console.log('Attachments found in database:', attachments.length);
    console.log('Attachment details:', attachments);
    
    // Check each attachment field individually
    if (attachments.length > 0) {
      const attachment = attachments[0];
      console.log('First attachment fields:');
      console.log('- id:', attachment.id);
      console.log('- postId:', attachment.postId);
      console.log('- fileName:', attachment.fileName);
      console.log('- filePath:', attachment.filePath);
      console.log('- fileSize:', attachment.fileSize);
      console.log('- mimeType:', attachment.mimeType);
      console.log('- uploadedAt:', attachment.uploadedAt);
    }
    
    // Check the post with relations
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['attachments']
    });
    
    console.log('Post with relations:', post);
    console.log('Post attachments:', post?.attachments);
    
    // Check each attachment in the relation
    if (post?.attachments && post.attachments.length > 0) {
      const relationAttachment = post.attachments[0];
      console.log('First relation attachment fields:');
      console.log('- id:', relationAttachment.id);
      console.log('- postId:', relationAttachment.postId);
      console.log('- fileName:', relationAttachment.fileName);
      console.log('- filePath:', relationAttachment.filePath);
      console.log('- fileSize:', relationAttachment.fileSize);
      console.log('- mimeType:', relationAttachment.mimeType);
      console.log('- uploadedAt:', relationAttachment.uploadedAt);
    }
  }

  // Test method to check if PostAttachment table exists and works
  async testPostAttachmentTable(): Promise<void> {
    console.log('=== TESTING PostAttachment table ===');
    
    try {
      // Try to count all attachments
      const count = await this.postAttachmentRepository.count();
      console.log('Total attachments in database:', count);
      
      // Try to find all attachments
      const allAttachments = await this.postAttachmentRepository.find();
      console.log('All attachments:', allAttachments);
      
      // Check the table structure by querying the database directly
      const tableInfo = await this.postAttachmentRepository.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'post_attachments' 
        ORDER BY ordinal_position
      `);
      console.log('Table structure:', tableInfo);
      
      // Try to create a test attachment (without saving)
      const testAttachment = this.postAttachmentRepository.create({
        postId: 'test-post-id',
        fileName: 'test.txt',
        filePath: '/test/path',
        fileSize: 100,
        mimeType: 'text/plain'
      });
      console.log('Test attachment created:', testAttachment);
      
    } catch (error) {
      console.error('Error testing PostAttachment table:', error);
    }
  }

  // Helper method to get students in a course
  private async getStudentsInCourse(courseId: string): Promise<User[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['class']
    });

    if (!course) {
      return [];
    }

    const studentIds = new Set<string>();

    // Get students from class enrollment (if course belongs to a class)
    if (course.classId) {
      const classData = await this.courseRepository.manager.query(`
        SELECT c.students 
        FROM classes c
        WHERE c.id = $1
      `, [course.classId]);

      if (classData.length > 0 && classData[0].students) {
        const studentsString = classData[0].students;
        const classStudentIds = studentsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
        classStudentIds.forEach(id => studentIds.add(id));
      }
    }

    // Get students from individual course enrollment
    const individualEnrollments = await this.courseRepository.manager.query(`
      SELECT s.id
      FROM students s
      WHERE $1 = ANY(s."courseIds")
    `, [courseId]);

    individualEnrollments.forEach(row => studentIds.add(row.id));

    if (studentIds.size === 0) {
      return [];
    }

    return await this.userRepository.find({
      where: { id: In(Array.from(studentIds)) },
      select: ['id', 'firstName', 'lastName', 'email']
    });
  }

  // Helper method to send absent notifications
  private async sendAbsentNotification(attendance: Attendance, course: Course): Promise<void> {
    try {
      // Get student information
      const student = await this.userRepository.findOne({ 
        where: { id: attendance.studentId },
        select: ['id', 'firstName', 'lastName', 'role']
      });

      if (!student) {
        console.warn('Student not found for attendance notification:', attendance.studentId);
        return;
      }

      // Send notification to student
      await this.notificationsService.createAbsentNotification(
        student.id,
        course.name,
        false, // isParent = false
        undefined, // childName not needed for student
        {
          courseId: course.id,
          date: attendance.date,
          attendanceId: attendance.id
        }
      );

      // Send notification to parents if student has parents
      const parents = await this.getParentsOfStudent(student.id);
      if (parents.length > 0) {
        for (const parent of parents) {
          await this.notificationsService.createAbsentNotification(
            parent.id,
            course.name,
            true, // isParent = true
            `${student.firstName} ${student.lastName}`, // childName
            {
              courseId: course.id,
              date: attendance.date,
              attendanceId: attendance.id,
              studentId: student.id
            }
          );
        }
        console.log('✅ Absent notifications sent to', parents.length, 'parents');
      }

      console.log('✅ Absent notification sent to student:', student.firstName, student.lastName);
    } catch (error) {
      console.error('❌ Failed to send absent notification:', error);
    }
  }

  // Helper method to get parents of a student
  private async getParentsOfStudent(studentId: string): Promise<User[]> {
    try {
      // Get parent IDs from the parents table
      const parentData = await this.userRepository.manager.query(`
        SELECT p.id 
        FROM parents p
        WHERE $1 = ANY(p."studentIds")
      `, [studentId]);

      const parentIds = parentData.map(row => row.id);

      if (parentIds.length === 0) {
        return [];
      }

      return await this.userRepository.find({
        where: { id: In(parentIds) },
        select: ['id', 'firstName', 'lastName', 'email']
      });
    } catch (error) {
      console.error('Error getting parents of student:', error);
      return [];
    }
  }
}

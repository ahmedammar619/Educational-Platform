import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { unlink, mkdir, writeFile } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { Post } from './entities/post.entity';
import { PostAttachment } from './entities/post-attachment.entity';
import { Folder } from './entities/folder.entity';
import { File } from './entities/file.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Attendance } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/posts/create-post.dto';
import { UpdatePostDto } from './dto/posts/update-post.dto';
import { CreateFolderDto } from './dto/files/create-folder.dto';
import { CreateAssignmentDto } from './dto/assignments/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/assignments/update-assignment.dto';
import { GradeAssignmentDto } from './dto/assignments/grade-assignment.dto';
import { MarkAttendanceDto } from './dto/attendance/mark-attendance.dto';

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
      
      // Handle file attachment if provided
      if (file) {
        console.log('Creating post attachment for file:', file.originalname);
        
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
        
        // Verify the attachment was saved by querying the database directly
        const verifyAttachment = await this.postAttachmentRepository.findOne({
          where: { id: savedAttachment.id }
        });
        console.log('Verification - attachment in database:', verifyAttachment);
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
      
      // Delete physical files from filesystem
      for (const attachment of post.attachments) {
        try {
          if (attachment.filePath) {
            const filePath = path.join(process.cwd(), 'uploads', attachment.filePath);
            await unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
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

    // Delete physical file
    try {
      if (attachment.filePath) {
        const filePath = path.join(process.cwd(), 'uploads', attachment.filePath);
        await unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
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
    console.log('📁 Service - Starting file upload:', {
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
        // Let's also check if the folder exists at all
        const anyFolder = await this.folderRepository.findOne({
          where: { id: folderId }
        });
        console.log('🔍 Service - Folder exists in database:', !!anyFolder);
        if (anyFolder) {
          console.log('🔍 Service - Folder belongs to course:', anyFolder.courseId);
        }
        throw new BadRequestException('Folder not found or does not belong to this course');
      }
      console.log('✅ Service - Folder found:', { name: folder.name, id: folder.id, courseId: folder.courseId });
    } else {
      console.log('📁 Service - No folderId provided, uploading to root level');
    }

    // Generate unique filename using the same pattern as PostsTab
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const fileName = `${baseName}-${unique}${ext}`;
    
    console.log('📁 Service - Generated filename:', fileName);
    
    // Create organized folder structure: uploads/Grade/Course/files/ (same as PostsTab)
    const gradeName = course?.class?.name || 'Default-Grade';
    const courseName = course?.name || 'Default-Course';
    const uploadsDir = path.join(process.cwd(), 'uploads', gradeName, courseName, 'files');
    
    console.log('📁 Service - Upload directory:', uploadsDir);
    
    // Ensure directory exists (same logic as PostsTab)
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Service - Created directory:', uploadsDir);
    }
    
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file to disk (same as PostsTab)
    fs.writeFileSync(filePath, file.buffer);
    console.log('📁 Service - File saved to:', filePath);
    
    // Create relative path from uploads folder (same as PostsTab)
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

    console.log('📁 Service - Creating file entity:', {
      fileName: fileEntity.fileName,
      filePath: fileEntity.filePath,
      courseId: fileEntity.courseId,
      folderId: fileEntity.folderId,
      uploadedBy: fileEntity.uploadedBy
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    console.log('✅ Service - File saved successfully:', savedFile.id);
    
    // Verify the file was saved by querying the database directly (same as PostsTab)
    const verifyFile = await this.fileRepository.findOne({
      where: { id: savedFile.id }
    });
    console.log('📁 Service - Verification - file in database:', verifyFile);
    
    return savedFile;
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
      // Delete the physical file from the uploads folder
      const fullFilePath = path.join(process.cwd(), 'uploads', file.filePath);
      console.log('🗑️ Deleting physical file:', fullFilePath);
      
      // Check if file exists before trying to delete
      if (fs.existsSync(fullFilePath)) {
        await fs.promises.unlink(fullFilePath);
        console.log('✅ Physical file deleted successfully:', fullFilePath);
      } else {
        console.warn('⚠️ Physical file not found, but continuing with database deletion:', fullFilePath);
      }
    } catch (fileError) {
      console.error('❌ Error deleting physical file:', fileError);
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
          // Delete the physical file from the uploads folder
          const fullFilePath = path.join(process.cwd(), 'uploads', file.filePath);
          console.log('🗑️ Deleting physical file:', fullFilePath);
          
          if (fs.existsSync(fullFilePath)) {
            await fs.promises.unlink(fullFilePath);
            console.log('✅ Physical file deleted successfully:', fullFilePath);
          } else {
            console.warn('⚠️ Physical file not found:', fullFilePath);
          }
        } catch (fileError) {
          console.error('❌ Error deleting physical file:', fileError);
          // Continue with database deletion even if physical file deletion fails
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
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const assignment = this.assignmentRepository.create({
      ...createAssignmentDto,
      courseId,
      createdBy: userId
    });

    return await this.assignmentRepository.save(assignment);
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

  async submitAssignment(assignmentId: string, file: Express.Multer.File, studentId: string): Promise<AssignmentSubmission> {
    const assignment = await this.assignmentRepository.findOne({ 
      where: { id: assignmentId },
      relations: ['course', 'course.class']
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

    // Generate unique filename using your old project pattern
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const fileName = `${baseName}-${unique}${ext}`;
    
    // Create organized folder structure: uploads/Grade/Course/assignments/
    const gradeName = assignment.course?.class?.name || 'Default-Grade';
    const courseName = assignment.course?.name || 'Default-Course';
    const uploadsDir = path.join(process.cwd(), 'uploads', gradeName, courseName, 'assignments');
    
    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Create relative path from uploads folder
    const relativePath = path.join(gradeName, courseName, 'assignments', fileName);

    let submission;
    
    if (isUpdate && existingSubmission) {
      // Update existing submission
      existingSubmission.fileName = fileName;
      existingSubmission.filePath = relativePath;
      existingSubmission.fileSize = file.size;
      existingSubmission.mimeType = file.mimetype;
      existingSubmission.submittedAt = new Date(); // Update submission time
      existingSubmission.grade = null; // Clear previous grade
      existingSubmission.feedback = null; // Clear previous feedback
      existingSubmission.gradedBy = null;
      existingSubmission.gradedAt = null;
      
      submission = existingSubmission;
      
      // Delete old file if it exists and is different
      if (oldFilePath && oldFilePath !== relativePath) {
        const oldFileAbsolutePath = path.join(process.cwd(), 'uploads', oldFilePath);
        try {
          if (fs.existsSync(oldFileAbsolutePath)) {
            fs.unlinkSync(oldFileAbsolutePath);
          }
        } catch (error) {
          console.warn(`Failed to delete old file: ${oldFileAbsolutePath}`, error);
        }
      }
    } else {
      // Create new submission
      submission = this.assignmentSubmissionRepository.create({
        assignmentId,
        studentId,
        fileName: fileName,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.mimetype
      });
    }

    return await this.assignmentSubmissionRepository.save(submission);
  }

  async gradeAssignment(submissionId: string, gradeDto: GradeAssignmentDto, graderId: string): Promise<AssignmentSubmission> {
    const submission = await this.assignmentSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment']
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    submission.grade = gradeDto.grade;
    submission.feedback = gradeDto.feedback;
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();

    return await this.assignmentSubmissionRepository.save(submission);
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
      return await this.attendanceRepository.save(existingAttendance);
    }

    const attendance = this.attendanceRepository.create({
      ...attendanceDto,
      courseId,
      markedBy: markerId,
      date: new Date(attendanceDto.date)
    });

    return await this.attendanceRepository.save(attendance);
  }

  async getCourseAttendance(courseId: string, date?: string): Promise<Attendance[]> {
    const whereCondition: any = { courseId };
    if (date) {
      whereCondition.date = new Date(date);
    }

    return await this.attendanceRepository.find({
      where: whereCondition,
      relations: ['student', 'marker'],
      order: { date: 'DESC' }
    });
  }

  async getStudentAttendance(courseId: string, studentId: string): Promise<Attendance[]> {
    return await this.attendanceRepository.find({
      where: { courseId, studentId },
      relations: ['marker'],
      order: { date: 'DESC' }
    });
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
}

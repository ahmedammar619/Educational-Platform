import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
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
    console.log('Getting posts for course:', courseId);
    const posts = await this.postRepository.find({
      where: { courseId },
      relations: ['attachments'],
      order: { createdAt: 'DESC' }
    });
    console.log('Found posts:', posts.length);
    console.log('Posts with attachments:', posts.map(p => ({ id: p.id, attachmentsCount: p.attachments?.length, attachments: p.attachments })));
    
    // Debug: Check if attachments exist in database for each post
    for (const post of posts) {
      const directAttachments = await this.postAttachmentRepository.find({
        where: { postId: post.id }
      });
      console.log(`Direct query for post ${post.id}:`, directAttachments.length, 'attachments found');
      if (directAttachments.length > 0) {
        console.log('Direct attachment details:', directAttachments);
      }
    }
    
    // Manually load author data only for posts that have valid authorIds
    const postsWithAuthors = await Promise.all(posts.map(async (post) => {
      if (post.authorId) {
        try {
          const author = await this.userRepository.findOne({ 
            where: { id: post.authorId },
            select: ['id', 'email', 'firstName', 'lastName', 'role']
          });
          if (author) {
            post.author = author;
          }
        } catch (error) {
          console.warn(`Could not load author for post ${post.id}:`, error.message);
        }
      }
      return post;
    }));
    
    console.log('Posts with author data:', postsWithAuthors.map(p => ({ id: p.id, authorId: p.authorId, author: p.author })));
    return postsWithAuthors;
  }

  async updatePost(postId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    Object.assign(post, updatePostDto);
    return await this.postRepository.save(post);
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

    const folder = this.folderRepository.create({
      ...createFolderDto,
      courseId,
      createdBy: userId
    });

    return await this.folderRepository.save(folder);
  }

  async uploadFile(courseId: string, file: Express.Multer.File, folderId?: string, userId?: string): Promise<File> {
    const course = await this.courseRepository.findOne({ 
      where: { id: courseId },
      relations: ['class']
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if folder exists and belongs to the same course
    if (folderId) {
      const folder = await this.folderRepository.findOne({
        where: { id: folderId, courseId }
      });
      if (!folder) {
        throw new BadRequestException('Folder not found or does not belong to this course');
      }
    }

    // Generate unique filename using your old project pattern
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
    }
    
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
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

    return await this.fileRepository.save(fileEntity);
  }

  async getCourseFiles(courseId: string, folderId?: string): Promise<File[]> {
    const whereCondition: any = { courseId };
    if (folderId) {
      whereCondition.folderId = folderId;
    }

    return await this.fileRepository.find({
      where: whereCondition,
      relations: ['uploader', 'folder'],
      order: { uploadedAt: 'DESC' }
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    await this.fileRepository.delete(fileId);
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['files', 'subFolders']
    });
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`);
    }

    // Check if folder has files or subfolders
    if (folder.files && folder.files.length > 0) {
      throw new BadRequestException('Cannot delete folder with files. Please delete all files first.');
    }

    if (folder.subFolders && folder.subFolders.length > 0) {
      throw new BadRequestException('Cannot delete folder with subfolders. Please delete all subfolders first.');
    }

    await this.folderRepository.delete(folderId);
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
      relations: ['creator', 'submissions'],
      order: { dueDate: 'ASC' }
    });
  }

  async submitAssignment(assignmentId: string, file: Express.Multer.File, studentId: string): Promise<AssignmentSubmission> {
    const assignment = await this.assignmentRepository.findOne({ 
      where: { id: assignmentId },
      relations: ['course', 'course.class']
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Check if student is already submitted
    const existingSubmission = await this.assignmentSubmissionRepository.findOne({
      where: { assignmentId, studentId }
    });

    if (existingSubmission) {
      throw new BadRequestException('Assignment already submitted');
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

    const submission = this.assignmentSubmissionRepository.create({
      assignmentId,
      studentId,
      fileName: fileName,
      filePath: relativePath,
      fileSize: file.size,
      mimeType: file.mimetype
    });

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

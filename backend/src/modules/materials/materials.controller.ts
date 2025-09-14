import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import { MaterialsService } from './materials.service';
import { CreatePostDto } from './dto/posts/create-post.dto';
import { UpdatePostDto } from './dto/posts/update-post.dto';
import { PostResponseDto } from './dto/posts/post-response.dto';
import { CreateFolderDto } from './dto/files/create-folder.dto';
import { FileResponseDto } from './dto/files/file-response.dto';
import { CreateAssignmentDto } from './dto/assignments/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/assignments/update-assignment.dto';
import { GradeAssignmentDto } from './dto/assignments/grade-assignment.dto';
import { AssignmentResponseDto } from './dto/assignments/assignment-response.dto';
import { MarkAttendanceDto } from './dto/attendance/mark-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance/attendance-response.dto';
import { BulkAttendanceDto } from './dto/attendance/bulk-attendance.dto';
import { BulkAttendanceResponseDto } from './dto/attendance/bulk-attendance-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { plainToClass, plainToInstance } from 'class-transformer';

@ApiTags('Materials')
@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  // Posts
  @Post('courses/:courseId/posts')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Admin, Role.Teacher)
  async createPost(
    @Param('courseId') courseId: string,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ): Promise<PostResponseDto> {
    console.log('Controller - Creating post:', { courseId, createPostDto, userId: req.user?.sub, file: file?.originalname });
    console.log('Controller - req.user:', req.user);
    console.log('Controller - req.user.sub type:', typeof req.user?.sub, 'Value:', req.user?.sub);
    try {
      const post = await this.materialsService.createPost(courseId, createPostDto, req.user.sub, file);
      console.log('Controller - Post created successfully:', post.id);
      const response = {
        id: post.id,
        courseId: post.courseId,
        authorId: post.authorId,
        subject: post.subject,
        description: post.description,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        course: post.course,
        author: post.author ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          email: post.author.email,
          phone: post.author.phone,
          role: post.author.role
        } : undefined,
        attachments: post.attachments ? post.attachments.map(attachment => ({
          id: attachment.id,
          postId: attachment.postId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt
        })) : []
      };
      console.log('Controller - Response transformed:', response);
      return response;
    } catch (error) {
      console.error('Controller - Error creating post:', error);
      throw error;
    }
  }

  @Get('courses/:courseId/posts')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCoursePosts(@Param('courseId') courseId: string): Promise<PostResponseDto[]> {
    const posts = await this.materialsService.getCoursePosts(courseId);
    
    const transformedPosts = posts.map(post => {
      // Manual transformation to ensure nested objects are properly serialized
      const transformed = {
        id: post.id,
        courseId: post.courseId,
        authorId: post.authorId,
        subject: post.subject,
        description: post.description,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        course: post.course,
        author: post.author ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          email: post.author.email,
          phone: post.author.phone,
          role: post.author.role
        } : undefined,
        attachments: post.attachments ? post.attachments.map(attachment => ({
          id: attachment.id,
          postId: attachment.postId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt
        })) : []
      };
      console.log('Controller - Transformed post:', transformed);
      return transformed;
    });
    
    console.log('Controller - Final response:', transformedPosts);
    return transformedPosts;
  }

  @Patch('posts/:postId')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Admin, Role.Teacher)
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostResponseDto> {
    console.log('Controller - Updating post:', { 
      postId: postId,
      postIdType: typeof postId,
      postIdLength: postId?.length,
      updatePostDto: {
        subject: updatePostDto?.subject,
        description: updatePostDto?.description,
        attachmentFileNames: updatePostDto?.attachmentFileNames
      },
      file: file ? {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        bufferLength: file.buffer?.length
      } : null
    });
    try {
      const post = await this.materialsService.updatePost(postId, updatePostDto, file);
      console.log('Controller - Post updated successfully:', {
        id: post.id,
        attachmentsCount: post.attachments?.length || 0,
        hasAuthor: !!post.author,
        hasCourse: !!post.course
      });
      
      console.log('Controller - Starting response transformation...');
      const response = {
        id: post.id,
        courseId: post.courseId,
        authorId: post.authorId,
        subject: post.subject,
        description: post.description,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        course: post.course,
        author: post.author ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          email: post.author.email,
          phone: post.author.phone,
          role: post.author.role
        } : undefined,
        attachments: post.attachments ? post.attachments.map(attachment => ({
          id: attachment.id,
          postId: attachment.postId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt
        })) : []
      };
      console.log('Controller - Response transformed successfully:', {
        id: response.id,
        attachmentsCount: response.attachments.length,
        hasAuthor: !!response.author,
        hasCourse: !!response.course
      });
      return response;
    } catch (error) {
      console.error('Controller - Error updating post:', error);
      throw error;
    }
  }

  @Delete('posts/:postId')
  @Roles(Role.Admin, Role.Teacher)
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.materialsService.deletePost(postId);
  }

  // Files and Folders
  @Post('courses/:courseId/folders')
  @ApiOperation({ summary: 'Create a new folder in a course' })
  @ApiResponse({ status: 201, description: 'Folder created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.Admin, Role.Teacher)
  async createFolder(
    @Param('courseId') courseId: string,
    @Body() createFolderDto: CreateFolderDto,
    @Req() req,
  ): Promise<any> {
    return await this.materialsService.createFolder(courseId, createFolderDto, req.user.sub);
  }

  @Patch('folders/:folderId')
  @ApiOperation({ summary: 'Update folder name' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @Roles(Role.Admin, Role.Teacher)
  async updateFolder(
    @Param('folderId') folderId: string,
    @Body() updateData: { name: string },
    @Req() req,
  ): Promise<any> {
    return await this.materialsService.updateFolder(folderId, updateData, req.user.sub);
  }

  @Get('courses/:courseId/folders')
  @ApiOperation({ summary: 'Get all folders in a course' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCourseFolders(
    @Param('courseId') courseId: string,
  ): Promise<any[]> {
    console.log('🔍 Controller - Getting folders for course:', {
      courseId: courseId
    });
    
    const folders = await this.materialsService.getCourseFolders(courseId);
    
    console.log('🔍 Controller - Service returned folders:', folders.map(f => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId
    })));
    
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      courseId: folder.courseId,
      parentFolderId: folder.parentFolderId,
      createdBy: folder.createdBy,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      creator: folder.creator ? {
        id: folder.creator.id,
        firstName: folder.creator.firstName,
        lastName: folder.creator.lastName,
        email: folder.creator.email
      } : undefined,
      subFolders: folder.subFolders || [],
      files: folder.files || []
    }));
  }

  @Get('folders')
  @ApiOperation({ summary: 'Get all folders across all courses' })
  @ApiResponse({ status: 200, description: 'All folders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getAllFolders(
    @Query('courseId') courseId?: string,
    @Query('parentFolderId') parentFolderId?: string,
  ): Promise<any[]> {
    console.log('🔍 Controller - Getting all folders:', {
      courseId: courseId,
      parentFolderId: parentFolderId
    });
    
    const folders = await this.materialsService.getAllFolders(courseId, parentFolderId);
    
    console.log('🔍 Controller - Service returned all folders:', folders.map(f => ({
      id: f.id,
      name: f.name,
      courseId: f.courseId,
      parentFolderId: f.parentFolderId
    })));
    
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      courseId: folder.courseId,
      parentFolderId: folder.parentFolderId,
      createdBy: folder.createdBy,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      creator: folder.creator ? {
        id: folder.creator.id,
        firstName: folder.creator.firstName,
        lastName: folder.creator.lastName,
        email: folder.creator.email
      } : undefined,
      subFolders: folder.subFolders || [],
      files: folder.files || []
    }));
  }

  @Post('courses/:courseId/files')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Admin, Role.Teacher)
  async uploadFile(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
    @Req() req?,
  ): Promise<FileResponseDto> {
    console.log('📁 Controller - File upload request:', {
      courseId,
      fileName: file?.originalname,
      fileSize: file?.size,
      folderId,
      userId: req?.user?.sub,
      hasFile: !!file,
      bodyKeys: Object.keys(req.body || {}),
      bodyValues: req.body
    });
    
    const fileEntity = await this.materialsService.uploadFile(courseId, file, folderId, req?.user?.sub);
    console.log('📁 Controller - File uploaded successfully:', fileEntity.id);
    
    return plainToClass(FileResponseDto, fileEntity, { excludeExtraneousValues: true });
  }

  @Get('courses/:courseId/files')
  @ApiOperation({ summary: 'Get all files and folders in a course' })
  @ApiResponse({ status: 200, description: 'Files and folders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCourseFiles(
    @Param('courseId') courseId: string,
    @Query('folderId') folderId?: string,
  ): Promise<any> {
    const { files, folders } = await this.materialsService.getCourseFilesAndFolders(courseId, folderId);
    
    // Transform files to include necessary data for frontend
    const transformedFiles = files.map(file => ({
      id: file.id,
      courseId: file.courseId,
      folderId: file.folderId,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      type: 'file', // Add type identifier for frontend
      isFolder: false, // Add boolean flag for frontend compatibility
      uploader: file.uploader || {},
      folder: file.folder || null
    }));
    
    // Transform folders to include necessary data
    const transformedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      courseId: folder.courseId,
      parentFolderId: folder.parentFolderId,
      createdBy: folder.createdBy,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      type: 'folder', // Add type identifier for frontend
      isFolder: true, // Add boolean flag for frontend compatibility
      creator: folder.creator ? {
        id: folder.creator.id,
        firstName: folder.creator.firstName,
        lastName: folder.creator.lastName,
        email: folder.creator.email
      } : undefined,
      subFolders: folder.subFolders || [],
      files: folder.files || []
    }));
    
    // Combine files and folders into a single array
    return [...transformedFolders, ...transformedFiles];
  }

  @Get('courses/:courseId/files/all')
  @ApiOperation({ summary: 'Get all files in a course across all folders' })
  @ApiResponse({ status: 200, description: 'All files retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getAllCourseFiles(
    @Param('courseId') courseId: string,
  ): Promise<any[]> {
    console.log('🔍 Controller - Getting all files for course:', {
      courseId: courseId
    });
    
    const files = await this.materialsService.getAllCourseFiles(courseId);
    
    console.log('🔍 Controller - Service returned files:', files.map(f => ({
      id: f.id,
      fileName: f.fileName,
      folderId: f.folderId
    })));
    
    return files.map(file => ({
      id: file.id,
      courseId: file.courseId,
      folderId: file.folderId,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      uploader: file.uploader ? {
        id: file.uploader.id,
        firstName: file.uploader.firstName,
        lastName: file.uploader.lastName,
        email: file.uploader.email
      } : undefined,
      folder: file.folder ? {
        id: file.folder.id,
        name: file.folder.name,
        parentFolderId: file.folder.parentFolderId
      } : null
    }));
  }

  @Get('files/:fileId/download')
  @ApiOperation({ summary: 'Download or view a file' })
  @ApiResponse({ status: 200, description: 'File download/view successful' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async downloadFile(
    @Param('fileId') fileId: string,
    @Query('view') view: string,
    @Res() res: Response
  ): Promise<void> {
    const file = await this.materialsService.getFileById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check if this is an R2 URL (new format) or legacy local path
    if (file.filePath.startsWith('http')) {
      // This is an R2 URL, fetch and stream it through our backend to avoid CORS issues
      try {
        const response = await fetch(file.filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch file from R2: ${response.statusText}`);
        }
        
        // Set appropriate headers
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.fileSize);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // If view=true, open in browser; otherwise download
        if (view === 'true') {
          res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
        } else {
          res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        }
        
        // Stream the file content
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (fetchError) {
        console.error('Controller - Error fetching from R2:', fetchError);
        throw new Error('Failed to load file from storage');
      }
      return;
    } else {
      // Legacy local file handling
      const filePath = path.join(process.cwd(), 'uploads', file.filePath);
      
      // Check if file exists on disk
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found on disk');
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.fileSize);
      
      // If view=true, open in browser; otherwise download
      if (view === 'true') {
        res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      }

      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }

  @Delete('files/:fileId')
  @Roles(Role.Admin, Role.Teacher)
  async deleteFile(@Param('fileId') fileId: string): Promise<void> {
    await this.materialsService.deleteFile(fileId);
  }

  @Delete('folders/:folderId')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - folder contains files or subfolders' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @Roles(Role.Admin, Role.Teacher)
  async deleteFolder(@Param('folderId') folderId: string): Promise<void> {
    await this.materialsService.deleteFolder(folderId);
  }

  // Assignments
  @Post('courses/:courseId/assignments')
  @Roles(Role.Admin, Role.Teacher)
  async createAssignment(
    @Param('courseId') courseId: string,
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.materialsService.createAssignment(courseId, createAssignmentDto, req.user.sub);
    return plainToClass(AssignmentResponseDto, assignment, { excludeExtraneousValues: true });
  }

  @Get('courses/:courseId/assignments')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCourseAssignments(@Param('courseId') courseId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.materialsService.getCourseAssignments(courseId);
    return assignments.map(assignment => 
      plainToClass(AssignmentResponseDto, {
        ...assignment,
        submissionCount: assignment.submissions?.length || 0,
        submissions: assignment.submissions?.map(submission => ({
          ...submission,
          studentName: submission.student ? `${submission.student.firstName} ${submission.student.lastName}` : 'Unknown Student'
        }))
      }, { excludeExtraneousValues: true })
    );
  }
  
  @Patch('courses/assignments/:assignmentId')
  @Roles(Role.Admin, Role.Teacher)
  async updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @Req() req,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.materialsService.updateAssignment(assignmentId, updateAssignmentDto, req.user.sub);
    return plainToClass(AssignmentResponseDto, assignment, { excludeExtraneousValues: true });
  }

  @Delete('courses/assignments/:assignmentId')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Delete an assignment' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async deleteAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.materialsService.deleteAssignment(assignmentId, req.user.sub);
    return { message: 'Assignment deleted successfully' };
  }

  @Post('assignments/:assignmentId/submit')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Student)
  async submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ): Promise<any> {
    return await this.materialsService.submitAssignment(assignmentId, file, req.user.sub);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(Role.Admin, Role.Teacher)
  async gradeAssignment(
    @Param('submissionId') submissionId: string,
    @Body() gradeDto: GradeAssignmentDto,
    @Req() req,
  ): Promise<any> {
    return await this.materialsService.gradeAssignment(submissionId, gradeDto, req.user.sub);
  }

  @Get('submissions/:submissionId/download')
  @Roles(Role.Admin, Role.Teacher)
  async downloadSubmission(
    @Param('submissionId') submissionId: string,
    @Res() res: Response
  ): Promise<void> {
    const submission = await this.materialsService.getAssignmentSubmission(submissionId);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check if this is an R2 URL (new format) or legacy local path
    if (submission.filePath.startsWith('http')) {
      // This is an R2 URL, fetch and stream it through our backend to avoid CORS issues
      try {
        const response = await fetch(submission.filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch file from R2: ${response.statusText}`);
        }
        
        // Set appropriate headers for download
        res.setHeader('Content-Type', submission.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${submission.fileName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Stream the file content
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (fetchError) {
        console.error('Controller - Error fetching from R2:', fetchError);
        throw new Error('Failed to load file from storage');
      }
      return;
    } else {
      // Legacy local file handling
      const filePath = path.join(process.cwd(), 'uploads', submission.filePath);
      
      // Check if file exists on disk
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found on disk');
      }

      // Set appropriate headers for download
      res.setHeader('Content-Type', submission.mimeType);
      res.setHeader('Content-Length', submission.fileSize);
      res.setHeader('Content-Disposition', `attachment; filename="${submission.fileName}"`);

      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }

  // Bulk Attendance - Must come before single attendance route
  @Post('courses/:courseId/attendance/bulk')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Mark bulk attendance for multiple students' })
  @ApiResponse({ status: 201, description: 'Bulk attendance marked successfully', type: BulkAttendanceResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async markBulkAttendance(
    @Param('courseId') courseId: string,
    @Body() bulkAttendanceDto: BulkAttendanceDto,
    @Req() req,
  ): Promise<BulkAttendanceResponseDto> {
    console.log('=== BULK ATTENDANCE ENDPOINT HIT ===');
    console.log('Received bulk attendance data:', {
      courseId,
      bulkAttendanceDto: {
        date: bulkAttendanceDto.date,
        dateType: typeof bulkAttendanceDto.date,
        day: bulkAttendanceDto.day,
        dayType: typeof bulkAttendanceDto.day,
        time: bulkAttendanceDto.time,
        timeType: typeof bulkAttendanceDto.time,
        meetingId: bulkAttendanceDto.meetingId,
        students: bulkAttendanceDto.students,
        studentsType: typeof bulkAttendanceDto.students,
        studentsLength: bulkAttendanceDto.students?.length
      }
    });
    console.log('Raw bulkAttendanceDto object:', bulkAttendanceDto);
    
    const attendanceRecords = await this.materialsService.markBulkAttendance(courseId, bulkAttendanceDto, req.user.sub);
    
    // Transform the response to match the expected format
    const response = {
      id: `${courseId}-${bulkAttendanceDto.date}`,
      courseId,
      date: new Date(bulkAttendanceDto.date),
      day: bulkAttendanceDto.day,
      time: bulkAttendanceDto.time,
      markedBy: req.user.sub,
      markedAt: new Date(),
      students: bulkAttendanceDto.students
    };
    
    return plainToClass(BulkAttendanceResponseDto, response, { excludeExtraneousValues: true });
  }

  // Single Attendance - Must come after bulk route
  @Post('courses/:courseId/attendance')
  @Roles(Role.Admin, Role.Teacher)
  async markAttendance(
    @Param('courseId') courseId: string,
    @Body() attendanceDto: MarkAttendanceDto,
    @Req() req,
  ): Promise<AttendanceResponseDto> {
    console.log('=== SINGLE ATTENDANCE ENDPOINT HIT ===');
    console.log('Received single attendance data:', {
      courseId,
      attendanceDto: {
        studentId: attendanceDto.studentId,
        studentIdType: typeof attendanceDto.studentId,
        date: attendanceDto.date,
        dateType: typeof attendanceDto.date,
        status: attendanceDto.status,
        statusType: typeof attendanceDto.status
      }
    });
    console.log('Raw attendanceDto object:', attendanceDto);
    
    const attendance = await this.materialsService.markAttendance(courseId, attendanceDto, req.user.sub);
    return plainToClass(AttendanceResponseDto, attendance, { excludeExtraneousValues: true });
  }

  // Get Bulk Attendance - Retrieve attendance data in bulk format
  @Get('courses/:courseId/attendance/bulk')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get bulk attendance data for a course' })
  @ApiResponse({ status: 200, description: 'Bulk attendance data retrieved successfully', type: [BulkAttendanceResponseDto] })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getBulkAttendance(
    @Param('courseId') courseId: string,
    @Query('date') date?: string,
  ): Promise<BulkAttendanceResponseDto[]> {
    const attendance = await this.materialsService.getCourseAttendance(courseId, date);
    return attendance.map(record => 
      plainToClass(BulkAttendanceResponseDto, record, { excludeExtraneousValues: true })
    );
  }

  // Get Bulk Attendance by Meeting ID - Retrieve attendance data for a specific meeting
  @Get('courses/:courseId/attendance/bulk/meeting/:meetingId')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get bulk attendance data for a specific meeting' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk attendance data for the specified meeting retrieved successfully', 
    type: BulkAttendanceResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Course or meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getBulkAttendanceByMeeting(
    @Param('courseId') courseId: string,
    @Param('meetingId') meetingId: string,
  ): Promise<BulkAttendanceResponseDto> {
    const attendance = await this.materialsService.getAttendanceByMeeting(courseId, meetingId);
    return plainToClass(BulkAttendanceResponseDto, attendance, { excludeExtraneousValues: true });
  }

  @Get('courses/:courseId/attendance')
  @Roles(Role.Admin, Role.Teacher)
  async getCourseAttendance(
    @Param('courseId') courseId: string,
    @Body('date') date?: string,
  ): Promise<AttendanceResponseDto[]> {
    const attendance = await this.materialsService.getCourseAttendance(courseId, date);
    return attendance.map(record => 
      plainToClass(AttendanceResponseDto, record, { excludeExtraneousValues: true })
    );
  }

  @Get('courses/:courseId/students/:studentId/attendance')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getStudentAttendance(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ): Promise<AttendanceResponseDto[]> {
    const attendance = await this.materialsService.getStudentAttendance(courseId, studentId);
    return attendance.map(record => 
      plainToClass(AttendanceResponseDto, record, { excludeExtraneousValues: true })
    );
  }

  // File download endpoint
  @Get('attachments/:attachmentId/download')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Res() res: any,
  ): Promise<void> {
    const attachment = await this.materialsService.getAttachment(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if this is an R2 URL (new format) or legacy local path
    if (attachment.filePath.startsWith('http')) {
      // This is an R2 URL, fetch and stream it through our backend to avoid CORS issues
      try {
        const response = await fetch(attachment.filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch file from R2: ${response.statusText}`);
        }
        
        // Set appropriate headers for download
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Stream the file content
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (fetchError) {
        console.error('Controller - Error fetching from R2:', fetchError);
        throw new Error('Failed to load file from storage');
      }
      return;
    } else {
      // Legacy local file handling
      const filePath = require('path').join(process.cwd(), 'uploads', attachment.filePath);
      res.download(filePath, attachment.fileName);
    }
  }

  // File preview endpoint
  @Get('attachments/:attachmentId/preview')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async previewAttachment(
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response
  ): Promise<void> {
    const attachment = await this.materialsService.getAttachment(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if this is an R2 URL (new format) or legacy local path
    if (attachment.filePath.startsWith('http')) {
      // This is an R2 URL, fetch and stream it through our backend to avoid CORS issues
      try {
        const response = await fetch(attachment.filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch file from R2: ${response.statusText}`);
        }
        
        // Set appropriate headers for preview
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Stream the file content
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (fetchError) {
        console.error('Controller - Error fetching from R2:', fetchError);
        throw new Error('Failed to load file from storage');
      }
      return;
    } else {
      // Legacy local file handling
      const filePath = path.join(process.cwd(), 'uploads', attachment.filePath);
      
      // Check if file exists on disk
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found on disk');
      }

      // Set appropriate headers for preview
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Length', attachment.fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`);

      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }

  // Debug endpoint to check post attachments
  @Get('debug/posts/:postId/attachments')
  @Roles(Role.Admin, Role.Teacher)
  async debugPostAttachments(@Param('postId') postId: string): Promise<any> {
    await this.materialsService.debugPostAttachments(postId);
    return { message: 'Debug info logged to console' };
  }

  // Test endpoint to check PostAttachment table
  @Get('debug/test-attachment-table')
  @Roles(Role.Admin, Role.Teacher)
  async testPostAttachmentTable(): Promise<any> {
    await this.materialsService.testPostAttachmentTable();
    return { message: 'Test info logged to console' };
  }

  // Delete individual attachment
  @Delete('attachments/:attachmentId')
  @Roles(Role.Admin, Role.Teacher)
  async deleteAttachment(@Param('attachmentId') attachmentId: string): Promise<void> {
    await this.materialsService.deleteAttachment(attachmentId);
  }
}

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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
    console.log('Controller - Getting posts for course:', courseId);
    const posts = await this.materialsService.getCoursePosts(courseId);
    console.log('Controller - Raw posts from service:', posts);
    
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
    console.log('Controller - Updating post:', { postId, updatePostDto, file: file?.originalname });
    try {
      const post = await this.materialsService.updatePost(postId, updatePostDto, file);
      console.log('Controller - Post updated successfully:', post.id);
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
      console.error('Controller - Error updating post:', error);
      throw error;
    }
  }

  @Delete('posts/:postId')
  @Roles(Role.Admin, Role.Teacher)
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.materialsService.deletePost(postId);
  }

  // Files
  @Post('courses/:courseId/folders')
  @Roles(Role.Admin, Role.Teacher)
  async createFolder(
    @Param('courseId') courseId: string,
    @Body() createFolderDto: CreateFolderDto,
    @Req() req,
  ): Promise<any> {
    return await this.materialsService.createFolder(courseId, createFolderDto, req.user.sub);
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
    const fileEntity = await this.materialsService.uploadFile(courseId, file, folderId, req?.user?.sub);
    return plainToClass(FileResponseDto, fileEntity, { excludeExtraneousValues: true });
  }

  @Get('courses/:courseId/files')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCourseFiles(
    @Param('courseId') courseId: string,
    @Body('folderId') folderId?: string,
  ): Promise<FileResponseDto[]> {
    const files = await this.materialsService.getCourseFiles(courseId, folderId);
    return files.map(file => 
      plainToClass(FileResponseDto, file, { excludeExtraneousValues: true })
    );
  }

  @Delete('files/:fileId')
  @Roles(Role.Admin, Role.Teacher)
  async deleteFile(@Param('fileId') fileId: string): Promise<void> {
    await this.materialsService.deleteFile(fileId);
  }

  @Delete('folders/:folderId')
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
        submissionCount: assignment.submissions?.length || 0
      }, { excludeExtraneousValues: true })
    );
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

  // Attendance
  @Post('courses/:courseId/attendance')
  @Roles(Role.Admin, Role.Teacher)
  async markAttendance(
    @Param('courseId') courseId: string,
    @Body() attendanceDto: MarkAttendanceDto,
    @Req() req,
  ): Promise<AttendanceResponseDto> {
    const attendance = await this.materialsService.markAttendance(courseId, attendanceDto, req.user.sub);
    return plainToClass(AttendanceResponseDto, attendance, { excludeExtraneousValues: true });
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

    const filePath = require('path').join(process.cwd(), 'uploads', attachment.filePath);
    res.download(filePath, attachment.fileName);
  }

  // File preview endpoint
  @Get('attachments/:attachmentId/preview')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async previewAttachment(
    @Param('attachmentId') attachmentId: string,
    @Res() res: any,
  ): Promise<void> {
    const attachment = await this.materialsService.getAttachment(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = require('path').join(process.cwd(), 'uploads', attachment.filePath);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
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

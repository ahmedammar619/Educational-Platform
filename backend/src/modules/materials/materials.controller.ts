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
import { plainToClass } from 'class-transformer';

@ApiTags('Materials')
@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  // Posts
  @Post('courses/:courseId/posts')
  @Roles(Role.Admin, Role.Teacher)
  async createPost(
    @Param('courseId') courseId: string,
    @Body() createPostDto: CreatePostDto,
    @Req() req,
  ): Promise<PostResponseDto> {
    const post = await this.materialsService.createPost(courseId, createPostDto, req.user.id);
    return plainToClass(PostResponseDto, post, { excludeExtraneousValues: true });
  }

  @Get('courses/:courseId/posts')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCoursePosts(@Param('courseId') courseId: string): Promise<PostResponseDto[]> {
    const posts = await this.materialsService.getCoursePosts(courseId);
    return posts.map(post => 
      plainToClass(PostResponseDto, post, { excludeExtraneousValues: true })
    );
  }

  @Patch('posts/:postId')
  @Roles(Role.Admin, Role.Teacher)
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.materialsService.updatePost(postId, updatePostDto);
    return plainToClass(PostResponseDto, post, { excludeExtraneousValues: true });
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
    return await this.materialsService.createFolder(courseId, createFolderDto, req.user.id);
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
    const fileEntity = await this.materialsService.uploadFile(courseId, file, folderId, req?.user?.id);
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
    const assignment = await this.materialsService.createAssignment(courseId, createAssignmentDto, req.user.id);
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
    return await this.materialsService.submitAssignment(assignmentId, file, req.user.id);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(Role.Admin, Role.Teacher)
  async gradeAssignment(
    @Param('submissionId') submissionId: string,
    @Body() gradeDto: GradeAssignmentDto,
    @Req() req,
  ): Promise<any> {
    return await this.materialsService.gradeAssignment(submissionId, gradeDto, req.user.id);
  }

  // Attendance
  @Post('courses/:courseId/attendance')
  @Roles(Role.Admin, Role.Teacher)
  async markAttendance(
    @Param('courseId') courseId: string,
    @Body() attendanceDto: MarkAttendanceDto,
    @Req() req,
  ): Promise<AttendanceResponseDto> {
    const attendance = await this.materialsService.markAttendance(courseId, attendanceDto, req.user.id);
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
}

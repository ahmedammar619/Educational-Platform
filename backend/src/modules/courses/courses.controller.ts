import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { plainToClass } from 'class-transformer';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.Admin)
  async createCourse(@Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const course = await this.coursesService.createCourse(createCourseDto);
    return plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true });
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  async findAllCourses(): Promise<CourseResponseDto[]> {
    const courses = await this.coursesService.findAllCourses();
    return courses.map(course => 
      plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true })
    );
  }

  @Get('class/:classId')
  @Roles(Role.Admin, Role.Teacher)
  async findCoursesByClass(@Param('classId') classId: string): Promise<CourseResponseDto[]> {
    const courses = await this.coursesService.findCoursesByClass(classId);
    return courses.map(course => 
      plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true })
    );
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async findCourseById(@Param('id') id: string): Promise<CourseResponseDto> {
    const course = await this.coursesService.findCourseById(id);
    return plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.updateCourse(id, updateCourseDto);
    return plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteCourse(@Param('id') id: string): Promise<void> {
    await this.coursesService.deleteCourse(id);
  }

  @Post(':courseId/sessions')
  @Roles(Role.Admin, Role.Teacher)
  async addSession(
    @Param('courseId') courseId: string,
    @Body() sessionDto: CreateSessionDto,
  ) {
    return await this.coursesService.addSession(courseId, sessionDto);
  }

  @Patch('sessions/:sessionId')
  @Roles(Role.Admin, Role.Teacher)
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() sessionDto: UpdateSessionDto,
  ) {
    return await this.coursesService.updateSession(sessionId, sessionDto);
  }

  @Delete('sessions/:sessionId')
  @Roles(Role.Admin, Role.Teacher)
  async removeSession(@Param('sessionId') sessionId: string): Promise<void> {
    await this.coursesService.removeSession(sessionId);
  }
}

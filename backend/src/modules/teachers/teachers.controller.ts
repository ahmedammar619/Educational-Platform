// src/modules/teachers/teachers.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { 
  CreateTeacherDto, 
  UpdateTeacherDto, 
  TeacherResponseDto 
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Teachers')
@Controller('teachers')
@ApiBearerAuth('JWT-auth')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('classes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current teacher classes' })
  @ApiResponse({
    status: 200,
    description: 'Teacher classes retrieved successfully'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getCurrentTeacherClasses(@CurrentUser() user: any) {
    console.log('🚀 ENDPOINT HIT: /api/teachers/classes');
    console.log('👤 Current user from JWT:', user);
    console.log('👤 Teacher ID (user.sub):', user.sub);
    const classes = await this.teachersService.getTeacherClasses(user.sub);
    console.log('📤 Returning classes:', classes.length);
    console.log('📤 Classes data:', JSON.stringify(classes, null, 2));
    const response = { classes };
    console.log('📤 Full response:', JSON.stringify(response, null, 2));
    return response;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new teacher' })
  @ApiBody({ type: CreateTeacherDto })
  @ApiResponse({
    status: 201,
    description: 'Teacher created successfully',
    type: TeacherResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data'
  })
  async createTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    const teacher = await this.teachersService.createTeacher(createTeacherDto);
    return { message: 'Teacher created successfully', teacher };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiResponse({
    status: 200,
    description: 'Teachers retrieved successfully',
    type: [TeacherResponseDto]
  })
  async getAllTeachers() {
    const teachers = await this.teachersService.findAll();
    return { teachers };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher retrieved successfully',
    type: TeacherResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found'
  })
  async getTeacherById(@Param('id') id: string) {
    const teacher = await this.teachersService.findOne(id);
    return { teacher };
  }

  @Get(':id/profile')
  @Public()
  @ApiOperation({ summary: "Get teacher's profile" })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile retrieved successfully',
    type: TeacherResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found'
  })
  async getTeacherProfile(@Param('id') id: string) {
    const profile = await this.teachersService.getTeacherProfile(id);
    return { profile };
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiBody({ type: UpdateTeacherDto })
  @ApiResponse({
    status: 200,
    description: 'Teacher updated successfully',
    type: TeacherResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found'
  })
  async updateTeacher(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto
  ) {
    const teacher = await this.teachersService.updateTeacher(id, updateTeacherDto);
    return { message: 'Teacher updated successfully', teacher };
  }

  @Put(':id/profile')
  @Public()
  @ApiOperation({ summary: 'Update teacher profile' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiBody({ type: UpdateTeacherDto })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile updated successfully',
    type: TeacherResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found'
  })
  async updateTeacherProfile(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto
  ) {
    const profile = await this.teachersService.updateTeacher(id, updateTeacherDto);
    return { message: 'Teacher profile updated successfully', profile };
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: 204,
    description: 'Teacher deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found'
  })
  async deleteTeacher(@Param('id') id: string) {
    await this.teachersService.deleteTeacher(id);
    return { message: 'Teacher deleted successfully' };
  }

  @Get('classes/:classId/students')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get students in a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({
    status: 200,
    description: 'Class students retrieved successfully'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiResponse({
    status: 404,
    description: 'Class not found'
  })
  async getClassStudents(@Param('classId') classId: string) {
    console.log(`🚀 ENDPOINT HIT: /api/teachers/classes/${classId}/students`);
    const students = await this.teachersService.getClassStudents(classId);
    console.log(`📤 Returning ${students.length} students to frontend`);
    return { students };
  }

  @Get(':id/classes')
  @Public()
  @ApiOperation({ summary: 'Get teacher classes by ID' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher classes retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found'
  })
  async getTeacherClassesById(@Param('id') id: string) {
    const classes = await this.teachersService.getTeacherClasses(id);
    return { classes };
  }
}

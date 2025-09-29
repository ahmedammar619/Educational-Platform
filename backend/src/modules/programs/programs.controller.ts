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
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { ProgramResponseDto } from './dto/program-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Programs')
@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new program (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Program created successfully',
    type: ProgramResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  @ApiOperation({ summary: 'Get all programs (Admin, Teacher, and Parent)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all programs',
    type: [ProgramResponseDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin, Teacher, or Parent role required'
  })
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  @ApiOperation({ summary: 'Get a program by ID (Admin, Teacher, and Parent)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Program found',
    type: ProgramResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Program not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin, Teacher, or Parent role required'
  })
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a program (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Program updated successfully',
    type: ProgramResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Program not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a program (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Program deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Program not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }

  @Post(':id/enroll-students')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Enroll students in a program (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Students enrolled successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Program not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  enrollStudents(
    @Param('id') id: string,
    @Body() enrollStudentsDto: EnrollStudentsDto,
  ) {
    return this.programsService.enrollStudents(id, enrollStudentsDto);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Remove a student from a program (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Student removed successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Program or student not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.programsService.removeStudent(id, studentId);
  }
}

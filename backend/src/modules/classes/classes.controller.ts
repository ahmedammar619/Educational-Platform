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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { ClassResponseDto } from './dto/class-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { plainToClass } from 'class-transformer';

@ApiTags('Classes')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.Admin)
  async createClass(@Body() createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.createClass(createClassDto);
    return plainToClass(ClassResponseDto, classEntity, { excludeExtraneousValues: true });
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  async findAllClasses(): Promise<ClassResponseDto[]> {
    const classes = await this.classesService.findAllClasses();
    return classes.map(classEntity => 
      plainToClass(ClassResponseDto, {
        ...classEntity,
        studentCount: classEntity.students?.length || 0
      }, { excludeExtraneousValues: true })
    );
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher)
  async findClassById(@Param('id') id: string): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.findClassById(id);
    return plainToClass(ClassResponseDto, {
      ...classEntity,
      studentCount: classEntity.students?.length || 0
    }, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async updateClass(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
  ): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.updateClass(id, updateClassDto);
    return plainToClass(ClassResponseDto, classEntity, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteClass(@Param('id') id: string): Promise<void> {
    await this.classesService.deleteClass(id);
  }

  @Post(':id/enroll')
  @Roles(Role.Admin)
  async enrollStudents(
    @Param('id') classId: string,
    @Body() enrollDto: EnrollStudentsDto,
  ): Promise<void> {
    await this.classesService.enrollStudents(classId, enrollDto);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.Admin)
  async removeStudentFromClass(
    @Param('id') classId: string,
    @Param('studentId') studentId: string,
  ): Promise<void> {
    await this.classesService.removeStudentFromClass(classId, studentId);
  }
}

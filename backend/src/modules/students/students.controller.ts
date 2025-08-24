// src/modules/students/students.controller.ts
import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Student)
@ApiBearerAuth('JWT-auth')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  @ApiOperation({ summary: "Get student's profile" })
  @ApiResponse({
    status: 200,
    description: 'Student profile retrieved successfully',
  })
  async getProfile(@CurrentUser('id') studentId: string) {
    const profile = await this.studentsService.getStudentProfile(studentId);
    return { profile };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update student profile' })
  @ApiResponse({
    status: 200,
    description: 'Student profile updated successfully',
  })
  async updateProfile(
    @CurrentUser('id') studentId: string,
    @Body() updateData: { firstName?: string; lastName?: string; username?: string },
  ) {
    const profile = await this.studentsService.updateStudentProfile(studentId, updateData);
    return { profile };
  }
}

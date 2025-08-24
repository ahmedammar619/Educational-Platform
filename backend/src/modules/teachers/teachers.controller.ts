// src/modules/teachers/teachers.controller.ts
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
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Teacher)
@ApiBearerAuth('JWT-auth')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('profile')
  @ApiOperation({ summary: "Get teacher's profile" })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile retrieved successfully',
  })
  async getProfile(@CurrentUser('id') teacherId: string) {
    const profile = await this.teachersService.getTeacherProfile(teacherId);
    return { profile };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update teacher profile' })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile updated successfully',
  })
  async updateProfile(
    @CurrentUser('id') teacherId: string,
    @Body() updateData: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const profile = await this.teachersService.updateTeacherProfile(teacherId, updateData);
    return { profile };
  }
}

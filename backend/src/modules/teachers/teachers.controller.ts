// src/modules/teachers/teachers.controller.ts
import {
  Controller,
  Get,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('profile')
  @Public()
  @ApiOperation({ summary: "Get teacher's profile (Public - No Authorization Required)" })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile retrieved successfully',
  })
  async getProfile(@Param('teacherId') teacherId: string) {
    const profile = await this.teachersService.getTeacherProfile(teacherId);
    return { profile };
  }

  @Put('profile')
  @Public()
  @ApiOperation({ summary: 'Update teacher profile (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile updated successfully',
  })
  async updateProfile(
    @Param('teacherId') teacherId: string,
    @Body() updateData: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const profile = await this.teachersService.updateTeacherProfile(teacherId, updateData);
    return { profile };
  }
}

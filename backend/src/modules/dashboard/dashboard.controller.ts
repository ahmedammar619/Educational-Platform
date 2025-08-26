import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('teacher')
  @Public()
  @ApiOperation({ summary: 'Get teacher dashboard data (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'Teacher dashboard data retrieved successfully',
  })
  async getTeacherDashboard(@Query('userId') userId: string) {
    return this.dashboardService.getTeacherDashboard(userId);
  }

  @Get('admin')
  @Public()
  @ApiOperation({ summary: 'Get admin dashboard data (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard data retrieved successfully',
  })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('analytics')
  @Public()
  @ApiOperation({ summary: 'Get system analytics (Public - No Authorization Required)' })
  @ApiQuery({ name: 'period', required: false, description: 'Analytics period (week, month, year)' })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
  })
  async getAnalytics(@Query('period') period: string = 'month') {
    return this.dashboardService.getAnalytics(period);
  }

  @Get('parent')
  @Public()
  @ApiOperation({ summary: 'Get parent dashboard data (Public - No Authorization Required)' })
  @ApiQuery({ name: 'parentId', required: true, description: 'Parent user ID' })
  @ApiResponse({
    status: 200,
    description: 'Parent dashboard data retrieved successfully',
  })
  async getParentDashboard(@Query('parentId') parentId: string) {
    return this.dashboardService.getParentDashboard(parentId);
  }

  @Get('student')
  @Public()
  @ApiOperation({ summary: 'Get student dashboard data (Public - No Authorization Required)' })
  @ApiQuery({ name: 'studentId', required: true, description: 'Student user ID' })
  @ApiResponse({
    status: 200,
    description: 'Student dashboard data retrieved successfully',
  })
  async getStudentDashboard(@Query('studentId') studentId: string) {
    return this.dashboardService.getStudentDashboard(studentId);
  }
}

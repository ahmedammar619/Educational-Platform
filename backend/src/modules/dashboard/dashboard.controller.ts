import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student')
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Get student dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Student dashboard data retrieved successfully',
  })
  async getStudentDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getStudentDashboard(user.id);
  }

  @Get('teacher')
  @Roles(Role.Teacher)
  @ApiOperation({ summary: 'Get teacher dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Teacher dashboard data retrieved successfully',
  })
  async getTeacherDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getTeacherDashboard(user.id);
  }

  @Get('parent')
  @Roles(Role.Parent)
  @ApiOperation({ summary: 'Get parent dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Parent dashboard data retrieved successfully',
  })
  async getParentDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getParentDashboard(user.id);
  }

  @Get('admin')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard data retrieved successfully',
  })
  async getAdminDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('analytics')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get system analytics (Admin only)' })
  @ApiQuery({ name: 'period', required: false, description: 'Analytics period (week, month, year)' })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
  })
  async getAnalytics(@Query('period') period: string = 'month') {
    return this.dashboardService.getAnalytics(period);
  }
}

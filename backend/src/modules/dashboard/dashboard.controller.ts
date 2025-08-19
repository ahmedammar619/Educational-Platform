import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum'; // ✅ updated
import { User } from '../users/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin) // ✅ updated
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard statistics retrieved successfully',
  })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('teacher')
  @UseGuards(RolesGuard)
  @Roles(Role.Teacher) // ✅ updated
  @ApiOperation({ summary: 'Get teacher dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Teacher dashboard statistics retrieved successfully',
  })
  async getTeacherDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getTeacherDashboard(user.id);
  }

  @Get('student')
  @UseGuards(RolesGuard)
  @Roles(Role.Student) // ✅ updated
  @ApiOperation({ summary: 'Get student dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Student dashboard statistics retrieved successfully',
  })
  async getStudentDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getStudentDashboard(user.id);
  }

  @Get('parent')
  @UseGuards(RolesGuard)
  @Roles(Role.Parent) // ✅ updated
  @ApiOperation({ summary: 'Get parent dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Parent dashboard statistics retrieved successfully',
  })
  async getParentDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getParentDashboard(user.id);
  }
}

// src/modules/analytics/analytics.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum'; // ✅ updated

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin) // ✅ updated
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get system analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  async getOverview() {
    return this.analyticsService.getSystemOverview();
  }

  @Get('user-growth')
  @ApiOperation({ summary: 'Get user growth analytics' })
  @ApiResponse({ status: 200, description: 'User growth data retrieved successfully' })
  async getUserGrowth() {
    const data = await this.analyticsService.getUserGrowth();
    return { userGrowth: data };
  }

  @Get('course-popularity')
  @ApiOperation({ summary: 'Get course popularity analytics' })
  @ApiResponse({ status: 200, description: 'Course popularity data retrieved successfully' })
  async getCoursePopularity() {
    const data = await this.analyticsService.getCoursePopularity();
    return { coursePopularity: data };
  }
}

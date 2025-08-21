import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Educational Platform API',
      version: '1.0.0',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get API information and available endpoints' })
  @ApiResponse({ status: 200, description: 'API information retrieved successfully' })
  getApiInfo() {
    return {
      message: 'Educational Platform API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        admin: '/api/admin',
        parents: '/api/parents',
        students: '/api/students',
        teachers: '/api/teachers',
        docs: '/api/docs',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
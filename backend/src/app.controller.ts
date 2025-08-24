import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('System')
@Controller() // This controller handles routes WITH the global 'api' prefix
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    console.log('Health endpoint called at:', new Date().toISOString());
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Educational Platform API',
      version: '1.0.0',
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get API information and available endpoints' })
  @ApiResponse({ status: 200, description: 'API information retrieved successfully' })
  getApiInfo() {
    console.log('Root endpoint called at:', new Date().toISOString());
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

  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Simple test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  getTest() {
    console.log('Test endpoint called at:', new Date().toISOString());
    return {
      message: 'Test endpoint working!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cors-test')
  @Public()
  @ApiOperation({ summary: 'Test CORS configuration' })
  @ApiResponse({
    status: 200,
    description: 'CORS test successful',
  })
  async corsTest() {
    console.log('CORS test endpoint called at:', new Date().toISOString());
    return {
      message: 'CORS is working!',
      timestamp: new Date().toISOString(),
      origin: 'Backend API',
    };
  }
}
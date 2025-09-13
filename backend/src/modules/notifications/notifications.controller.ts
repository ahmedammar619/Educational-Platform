import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { MarkAllReadDto } from './dto/mark-all-read.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { TestNotificationDto } from './dto/test-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { NotificationType } from './entities/notification.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
@Throttle({ notifications: { limit: 200, ttl: 60000 } })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully', type: NotificationResponseDto })
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of notifications to skip' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Return only unread notifications' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by notification type' })
  @ApiQuery({ name: 'archived', required: false, type: Boolean, description: 'Include archived notifications' })
  async findAll(
    @Request() req,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('unreadOnly', new DefaultValuePipe(false)) unreadOnly: boolean,
    @Query('archived', new DefaultValuePipe(false)) archived: boolean,
    @Query('type') type?: NotificationType,
  ) {
    const userId = req.user.id;
    return this.notificationsService.findAll(userId, {
      limit,
      offset,
      unreadOnly,
      type,
      archived,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    return this.notificationsService.update(id, userId, updateNotificationDto);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read successfully' })
  async markAllAsRead(
    @Body() markAllReadDto: MarkAllReadDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.notificationsService.markAllAsRead(userId, markAllReadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.notificationsService.delete(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a notification' })
  @ApiResponse({ status: 200, description: 'Notification archived successfully', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    return this.notificationsService.archive(id, userId);
  }

  @Post('cleanup')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Cleanup old notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Old notifications cleaned up successfully' })
  async cleanup(@Query('daysOld', new DefaultValuePipe(30), ParseIntPipe) daysOld: number) {
    return this.notificationsService.cleanupOldNotifications(daysOld);
  }

  @Post('test')
  @ApiOperation({ summary: 'Create a test notification' })
  @ApiResponse({ status: 201, description: 'Test notification created successfully', type: NotificationResponseDto })
  async createTestNotification(
    @Body() testNotificationDto: TestNotificationDto,
    @Request() req,
  ): Promise<NotificationResponseDto> {
    const userId = testNotificationDto.userId || req.user.id;
    const message = testNotificationDto.message || 'This is a test notification';
    
    return this.notificationsService.create({
      userId,
      type: testNotificationDto.type,
      priority: 'medium' as any,
      title: 'Test Notification',
      message,
      metadata: { isTest: true },
    });
  }
}

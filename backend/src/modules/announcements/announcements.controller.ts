import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import { plainToClass } from 'class-transformer';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementMeetingsService } from './services/announcement-meetings.service';
import { CreateAnnouncementPostDto } from './dto/create-announcement-post.dto';
import { UpdateAnnouncementPostDto } from './dto/update-announcement-post.dto';
import { AnnouncementPostResponseDto } from './dto/announcement-post-response.dto';
import { CreateAnnouncementMeetingDto } from './dto/create-announcement-meeting.dto';
import { UpdateAnnouncementMeetingDto } from './dto/update-announcement-meeting.dto';
import { AnnouncementMeetingResponseDto } from './dto/announcement-meeting-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly announcementMeetingsService: AnnouncementMeetingsService,
  ) {}

  // Posts
  @Post('posts')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new announcement post' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Post created successfully', type: AnnouncementPostResponseDto })
  async createPost(
    @Body() createPostDto: CreateAnnouncementPostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ): Promise<AnnouncementPostResponseDto> {
    console.log('Controller - Creating announcement post:', { createPostDto, userId: req.user?.sub, file: file?.originalname });
    
    try {
      const post = await this.announcementsService.createPost(createPostDto, req.user.sub, file);
      console.log('Controller - Post created successfully:', post.id);
      
      const response = {
        id: post.id,
        authorId: post.authorId,
        subject: post.subject,
        description: post.description,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          email: post.author.email,
          phone: post.author.phone,
          role: post.author.role
        } : undefined,
        attachments: post.attachments ? post.attachments.map(attachment => ({
          id: attachment.id,
          postId: attachment.postId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt
        })) : []
      };
      
      console.log('Controller - Response transformed:', response);
      return response;
    } catch (error) {
      console.error('Controller - Error creating post:', error);
      throw error;
    }
  }

  @Get('posts')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get all announcement posts' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully', type: [AnnouncementPostResponseDto] })
  async getPosts(): Promise<AnnouncementPostResponseDto[]> {
    const posts = await this.announcementsService.getPosts();
    
    const transformedPosts = posts.map(post => {
      const transformed = {
        id: post.id,
        authorId: post.authorId,
        subject: post.subject,
        description: post.description,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          email: post.author.email,
          phone: post.author.phone,
          role: post.author.role
        } : undefined,
        attachments: post.attachments ? post.attachments.map(attachment => ({
          id: attachment.id,
          postId: attachment.postId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt
        })) : []
      };
      console.log('Controller - Transformed post:', transformed);
      return transformed;
    });
    
    console.log('Controller - Final response:', transformedPosts);
    return transformedPosts;
  }

  @Patch('posts/:postId')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update an announcement post' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Post updated successfully', type: AnnouncementPostResponseDto })
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdateAnnouncementPostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ): Promise<AnnouncementPostResponseDto> {
    console.log('Controller - Updating post:', { postId, updatePostDto, userId: req.user?.sub, file: file?.originalname });
    
    try {
      const post = await this.announcementsService.updatePost(postId, updatePostDto, req.user.sub, file);
      console.log('Controller - Post updated successfully:', post.id);
      
      const response = {
        id: post.id,
        authorId: post.authorId,
        subject: post.subject,
        description: post.description,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          email: post.author.email,
          phone: post.author.phone,
          role: post.author.role
        } : undefined,
        attachments: post.attachments ? post.attachments.map(attachment => ({
          id: attachment.id,
          postId: attachment.postId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt
        })) : []
      };
      
      console.log('Controller - Response transformed:', response);
      return response;
    } catch (error) {
      console.error('Controller - Error updating post:', error);
      throw error;
    }
  }

  @Delete('posts/:postId')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an announcement post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  async deletePost(@Param('postId') postId: string, @Req() req): Promise<{ message: string }> {
    console.log('Controller - Deleting post:', { postId, userId: req.user?.sub });
    
    try {
      await this.announcementsService.deletePost(postId, req.user.sub);
      console.log('Controller - Post deleted successfully');
      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error('Controller - Error deleting post:', error);
      throw error;
    }
  }

  // Attachments
  @Get('attachments/:attachmentId/download')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Download an attachment' })
  async downloadAttachment(@Param('attachmentId') attachmentId: string, @Res() res: Response): Promise<void> {
    console.log('Controller - Downloading attachment:', attachmentId);
    
    try {
      const { filePath, fileName } = await this.announcementsService.downloadAttachment(attachmentId);
      
      // Check if this is an R2 URL (new format) or legacy local path
      if (filePath.startsWith('http')) {
        // This is an R2 URL, fetch and stream it through our backend to avoid CORS issues
        try {
          const response = await fetch(filePath);
          if (!response.ok) {
            throw new Error(`Failed to fetch file from R2: ${response.statusText}`);
          }
          
          // Set appropriate headers for download
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
          
          // Stream the file content
          const buffer = await response.arrayBuffer();
          res.send(Buffer.from(buffer));
        } catch (fetchError) {
          console.error('Controller - Error fetching from R2:', fetchError);
          throw new Error('Failed to load file from storage');
        }
        return;
      } else {
        // Legacy local file handling
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.sendFile(path.resolve(filePath));
      }
    } catch (error) {
      console.error('Controller - Error downloading attachment:', error);
      throw error;
    }
  }

  @Get('attachments/:attachmentId/preview')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Preview an attachment' })
  async previewAttachment(@Param('attachmentId') attachmentId: string, @Res() res: Response): Promise<void> {
    console.log('Controller - Previewing attachment:', attachmentId);
    
    try {
      const { filePath, fileName } = await this.announcementsService.previewAttachment(attachmentId);
      
      // Check if this is an R2 URL (new format) or legacy local path
      if (filePath.startsWith('http')) {
        // This is an R2 URL, fetch and stream it through our backend to avoid CORS issues
        try {
          const response = await fetch(filePath);
          if (!response.ok) {
            throw new Error(`Failed to fetch file from R2: ${response.statusText}`);
          }
          
          // Set appropriate headers for preview
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
          res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
          res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
          
          // Stream the file content
          const buffer = await response.arrayBuffer();
          res.send(Buffer.from(buffer));
        } catch (fetchError) {
          console.error('Controller - Error fetching from R2:', fetchError);
          throw new Error('Failed to load file from storage');
        }
        return;
      } else {
        // Legacy local file handling
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.sendFile(path.resolve(filePath));
      }
    } catch (error) {
      console.error('Controller - Error previewing attachment:', error);
      throw error;
    }
  }

  @Delete('attachments/:attachmentId')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  async deleteAttachment(@Param('attachmentId') attachmentId: string, @Req() req): Promise<{ message: string }> {
    console.log('Controller - Deleting attachment:', { attachmentId, userId: req.user?.sub });
    
    try {
      await this.announcementsService.deleteAttachment(attachmentId, req.user.sub);
      console.log('Controller - Attachment deleted successfully');
      return { message: 'Attachment deleted successfully' };
    } catch (error) {
      console.error('Controller - Error deleting attachment:', error);
      throw error;
    }
  }

  // Meetings endpoints
  @Get('meetings')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get all announcement meetings' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully', type: [AnnouncementMeetingResponseDto] })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by meeting status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search meetings by title, description, or creator' })
  async getMeetings(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<AnnouncementMeetingResponseDto[]> {
    let meetings;

    if (search) {
      meetings = await this.announcementMeetingsService.searchMeetings(search);
    } else if (status) {
      meetings = await this.announcementMeetingsService.getMeetingsByStatus(status);
    } else {
      meetings = await this.announcementMeetingsService.findAllMeetings();
    }

    return meetings.map(meeting => 
      plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Post('meetings')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new announcement meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully', type: AnnouncementMeetingResponseDto })
  async createMeeting(
    @Body() createMeetingDto: CreateAnnouncementMeetingDto,
    @Req() req: any,
  ): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.createMeeting(createMeetingDto, req.user.sub);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Get('meetings/my-meetings')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get meetings created by the current user' })
  @ApiResponse({ status: 200, description: 'User meetings retrieved successfully', type: [AnnouncementMeetingResponseDto] })
  async findMyMeetings(@Req() req: any): Promise<AnnouncementMeetingResponseDto[]> {
    const meetings = await this.announcementMeetingsService.findMeetingsByUser(req.user.sub);
    return meetings.map(meeting => 
      plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get('meetings/:id')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get a specific announcement meeting by ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully', type: AnnouncementMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async findMeetingById(@Param('id') id: string): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.findMeetingById(id);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Patch('meetings/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update an announcement meeting' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully', type: AnnouncementMeetingResponseDto })
  async updateMeeting(
    @Param('id') id: string,
    @Body() updateMeetingDto: UpdateAnnouncementMeetingDto,
    @Req() req: any,
  ): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.updateMeeting(id, updateMeetingDto, req.user.sub);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Delete('meetings/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an announcement meeting' })
  @ApiResponse({ status: 200, description: 'Meeting deleted successfully' })
  async deleteMeeting(@Param('id') id: string, @Req() req: any): Promise<{ message: string }> {
    await this.announcementMeetingsService.deleteMeeting(id, req.user.sub);
    return { message: 'Announcement meeting deleted successfully' };
  }

  @Post('meetings/:id/join')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Join an announcement meeting' })
  @ApiResponse({ status: 200, description: 'Meeting joined successfully', type: AnnouncementMeetingResponseDto })
  async joinMeeting(@Param('id') id: string): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.joinMeeting(id);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post('meetings/:id/start')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Start an announcement meeting and notify all users' })
  @ApiResponse({ status: 200, description: 'Meeting started successfully', type: AnnouncementMeetingResponseDto })
  async startMeeting(@Param('id') id: string): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.startMeeting(id);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post('meetings/:id/end')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'End an announcement meeting' })
  @ApiResponse({ status: 200, description: 'Meeting ended successfully', type: AnnouncementMeetingResponseDto })
  async endMeeting(@Param('id') id: string, @Req() req: any): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.endMeeting(id, req.user.sub);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post('meetings/:id/cancel')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Cancel an announcement meeting' })
  @ApiResponse({ status: 200, description: 'Meeting cancelled successfully', type: AnnouncementMeetingResponseDto })
  async cancelMeeting(@Param('id') id: string, @Req() req: any): Promise<AnnouncementMeetingResponseDto> {
    const meeting = await this.announcementMeetingsService.cancelMeeting(id, req.user.sub);
    return plainToClass(AnnouncementMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  // Test endpoint for R2
  @Get('test-r2')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Test R2 connection' })
  async testR2(): Promise<{ status: string; message: string; config: any }> {
    console.log('Controller - Testing R2 connection');
    
    try {
      const r2Service = this.announcementsService['r2FileService'];
      const isHealthy = await r2Service.healthCheck();
      
      return {
        status: isHealthy ? 'success' : 'error',
        message: isHealthy ? 'R2 connection is working' : 'R2 connection failed',
        config: {
          bucketName: r2Service['bucketName'],
          region: r2Service['region'],
          endpoint: r2Service['endpoint'],
          publicUrlBase: r2Service['publicUrlBase']
        }
      };
    } catch (error) {
      console.error('Controller - R2 test error:', error);
      return {
        status: 'error',
        message: `R2 test failed: ${error.message}`,
        config: {}
      };
    }
  }
}

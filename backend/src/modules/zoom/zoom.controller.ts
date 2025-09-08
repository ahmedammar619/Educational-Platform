import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ZoomService } from './zoom.service';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { UpdateZoomMeetingDto } from './dto/update-zoom-meeting.dto';
import { ZoomMeetingResponseDto } from './dto/zoom-meeting-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { plainToClass } from 'class-transformer';

@ApiTags('Zoom Meetings')
@Controller('zoom')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  @Post()
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Create a new Zoom meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully', type: ZoomMeetingResponseDto })
  async createMeeting(
    @Body() createZoomMeetingDto: CreateZoomMeetingDto,
    @Request() req: any,
  ): Promise<ZoomMeetingResponseDto> {
    const meeting = await this.zoomService.createMeeting(createZoomMeetingDto, req.user.sub);
    return plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get all Zoom meetings' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully', type: [ZoomMeetingResponseDto] })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by meeting status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search meetings by title, description, or creator' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter meetings by course ID' })
  async findAllMeetings(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('courseId') courseId?: string,
  ): Promise<ZoomMeetingResponseDto[]> {
    let meetings;

    if (courseId) {
      meetings = await this.zoomService.findMeetingsByCourse(courseId);
    } else if (search) {
      meetings = await this.zoomService.searchMeetings(search);
    } else if (status) {
      meetings = await this.zoomService.getMeetingsByStatus(status);
    } else {
      meetings = await this.zoomService.findAllMeetings();
    }

    return meetings.map(meeting => 
      plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get('my-meetings')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get meetings created by the current user' })
  @ApiResponse({ status: 200, description: 'User meetings retrieved successfully', type: [ZoomMeetingResponseDto] })
  async findMyMeetings(@Request() req: any): Promise<ZoomMeetingResponseDto[]> {
    const meetings = await this.zoomService.findMeetingsByUser(req.user.sub);
    return meetings.map(meeting => 
      plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get('course/:courseId')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get meetings for a specific course' })
  @ApiResponse({ status: 200, description: 'Course meetings retrieved successfully', type: [ZoomMeetingResponseDto] })
  async findMeetingsByCourse(@Param('courseId') courseId: string): Promise<ZoomMeetingResponseDto[]> {
    const meetings = await this.zoomService.findMeetingsByCourse(courseId);
    return meetings.map(meeting => 
      plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get a specific Zoom meeting by ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully', type: ZoomMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async findMeetingById(@Param('id') id: string): Promise<ZoomMeetingResponseDto> {
    const meeting = await this.zoomService.findMeetingById(id);
    return plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Update a Zoom meeting' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully', type: ZoomMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update your own meetings' })
  async updateMeeting(
    @Param('id') id: string,
    @Body() updateZoomMeetingDto: UpdateZoomMeetingDto,
    @Request() req: any,
  ): Promise<ZoomMeetingResponseDto> {
    const meeting = await this.zoomService.updateMeeting(id, updateZoomMeetingDto, req.user.sub);
    return plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Delete a Zoom meeting' })
  @ApiResponse({ status: 200, description: 'Meeting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete your own meetings' })
  async deleteMeeting(@Param('id') id: string, @Request() req: any): Promise<void> {
    await this.zoomService.deleteMeeting(id, req.user.sub);
  }

  @Post(':id/join')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Join a Zoom meeting (increments join count)' })
  @ApiResponse({ status: 200, description: 'Join count incremented successfully', type: ZoomMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async joinMeeting(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { courseId?: string }
  ): Promise<ZoomMeetingResponseDto> {
    const studentId = req.user?.role === 'student' ? req.user.sub : undefined;
    const courseId = body?.courseId;
    
    const meeting = await this.zoomService.incrementJoinCount(id, studentId, courseId);
    return plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post(':id/end')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Manually end a meeting' })
  @ApiResponse({ status: 200, description: 'Meeting ended successfully', type: ZoomMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only end your own meetings' })
  async endMeeting(@Param('id') id: string, @Request() req: any): Promise<ZoomMeetingResponseDto> {
    const meeting = await this.zoomService.endMeeting(id, req.user.sub);
    return plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post(':id/cancel')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Cancel an upcoming meeting' })
  @ApiResponse({ status: 200, description: 'Meeting cancelled successfully', type: ZoomMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only cancel your own meetings' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot cancel a meeting that has started' })
  async cancelMeeting(@Param('id') id: string, @Request() req: any): Promise<ZoomMeetingResponseDto> {
    const meeting = await this.zoomService.cancelMeeting(id, req.user.sub);
    return plainToClass(ZoomMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post('update-statuses')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update all meeting statuses (admin only)' })
  @ApiResponse({ status: 200, description: 'Meeting statuses updated successfully' })
  async updateMeetingStatuses(): Promise<{ message: string }> {
    await this.zoomService.updateMeetingStatuses();
    return { message: 'Meeting statuses updated successfully' };
  }
}

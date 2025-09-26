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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AgoraService } from './agora.service';
import { CreateAgoraMeetingDto } from './dto/create-agora-meeting.dto';
import { UpdateAgoraMeetingDto } from './dto/update-agora-meeting.dto';
import { AgoraMeetingResponseDto } from './dto/agora-meeting-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { plainToClass } from 'class-transformer';

@ApiTags('Agora Meetings')
@Controller('agora')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Post()
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Create a new Agora meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully', type: AgoraMeetingResponseDto })
  async createMeeting(
    @Body() createAgoraMeetingDto: CreateAgoraMeetingDto,
    @Request() req: any,
  ): Promise<AgoraMeetingResponseDto> {
    const meeting = await this.agoraService.createMeeting(createAgoraMeetingDto, req.user.sub);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Get('tokens/:meetingId')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get Agora RTC and RTM tokens for a meeting' })
  @ApiResponse({ status: 200, description: 'Tokens retrieved successfully' })
  async getAgoraTokens(
    @Param('meetingId') meetingId: string,
    @Request() req: any,
  ): Promise<{ rtcToken: string; rtmToken: string; channelName: string; appId: string; rtcUid: string; rtmUid: string }> {
    return this.agoraService.getMeetingToken(meetingId, req.user.sub);
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get all Agora meetings' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully', type: [AgoraMeetingResponseDto] })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by meeting status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search meetings by title, description, or creator' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter meetings by course ID' })
  async findAllMeetings(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('courseId') courseId?: string,
  ): Promise<AgoraMeetingResponseDto[]> {
    let meetings;

    if (courseId) {
      meetings = await this.agoraService.findMeetingsByCourse(courseId);
    } else if (search) {
      meetings = await this.agoraService.searchMeetings(search);
    } else if (status) {
      meetings = await this.agoraService.getMeetingsByStatus(status);
    } else {
      meetings = await this.agoraService.findAllMeetings();
    }

    return meetings.map(meeting => 
      plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get('my-meetings')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get meetings created by the current user' })
  @ApiResponse({ status: 200, description: 'User meetings retrieved successfully', type: [AgoraMeetingResponseDto] })
  async findMyMeetings(@Request() req: any): Promise<AgoraMeetingResponseDto[]> {
    const meetings = await this.agoraService.findMeetingsByUser(req.user.sub);
    return meetings.map(meeting => 
      plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get('course/:courseId')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get meetings for a specific course' })
  @ApiResponse({ status: 200, description: 'Course meetings retrieved successfully', type: [AgoraMeetingResponseDto] })
  async findMeetingsByCourse(@Param('courseId') courseId: string): Promise<AgoraMeetingResponseDto[]> {
    const meetings = await this.agoraService.findMeetingsByCourse(courseId);
    return meetings.map(meeting => 
      plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true })
    );
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get a specific Agora meeting by ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully', type: AgoraMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async findMeetingById(@Param('id') id: string): Promise<AgoraMeetingResponseDto> {
    const meeting = await this.agoraService.findMeetingById(id);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Update an Agora meeting' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully', type: AgoraMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update your own meetings' })
  async updateMeeting(
    @Param('id') id: string,
    @Body() updateAgoraMeetingDto: UpdateAgoraMeetingDto,
    @Request() req: any,
  ): Promise<AgoraMeetingResponseDto> {
    const meeting = await this.agoraService.updateMeeting(id, updateAgoraMeetingDto, req.user.sub);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Delete an Agora meeting' })
  @ApiResponse({ status: 200, description: 'Meeting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete your own meetings' })
  async deleteMeeting(@Param('id') id: string, @Request() req: any): Promise<void> {
    await this.agoraService.deleteMeeting(id, req.user.sub);
  }

  @Post(':id/join')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Join an Agora meeting (increments join count)' })
  @ApiResponse({ status: 200, description: 'Join count incremented successfully', type: AgoraMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async joinMeeting(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { courseId?: string }
  ): Promise<AgoraMeetingResponseDto> {
    const userId = req.user?.sub;
    const courseId = body?.courseId;
    
    const meeting = await this.agoraService.joinMeeting(id, userId, courseId);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post(':id/start')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Start an Agora meeting and notify students' })
  @ApiResponse({ status: 200, description: 'Meeting started successfully', type: AgoraMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only start your own meetings' })
  async startMeeting(@Param('id') id: string, @Request() req: any): Promise<AgoraMeetingResponseDto> {
    const meeting = await this.agoraService.startMeeting(id, req.user.sub);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post(':id/end')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Manually end a meeting' })
  @ApiResponse({ status: 200, description: 'Meeting ended successfully', type: AgoraMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only end your own meetings' })
  async endMeeting(@Param('id') id: string, @Request() req: any): Promise<AgoraMeetingResponseDto> {
    const meeting = await this.agoraService.endMeeting(id, req.user.sub);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post(':id/cancel')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Cancel an upcoming meeting' })
  @ApiResponse({ status: 200, description: 'Meeting cancelled successfully', type: AgoraMeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only cancel your own meetings' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot cancel a meeting that has started' })
  async cancelMeeting(@Param('id') id: string, @Request() req: any): Promise<AgoraMeetingResponseDto> {
    const meeting = await this.agoraService.cancelMeeting(id, req.user.sub);
    return plainToClass(AgoraMeetingResponseDto, meeting, { excludeExtraneousValues: true });
  }

  @Post(':id/token')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get meeting token for joining' })
  @ApiResponse({ status: 200, description: 'Meeting token generated successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeetingToken(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { role?: 'host' | 'attendee' }
  ): Promise<any> {
    const role = body?.role || 'attendee';
    return await this.agoraService.getMeetingToken(id, req.user.sub, role);
  }

  @Get(':id/recording-status')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get recording status for a meeting' })
  @ApiResponse({ status: 200, description: 'Recording status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getRecordingStatus(@Param('id') id: string): Promise<any> {
    const meeting = await this.agoraService.findMeetingById(id);
    
    return {
      meetingId: meeting.id,
      recordingStatus: meeting.recordingStatus,
      recordingUrl: meeting.r2RecordingUrl,
      recordingCompletedAt: meeting.recordingCompletedAt,
      hasRecording: !!meeting.r2RecordingUrl
    };
  }
}

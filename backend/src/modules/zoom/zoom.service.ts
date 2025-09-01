import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomMeeting } from './entities/zoom-meeting.entity';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { UpdateZoomMeetingDto } from './dto/update-zoom-meeting.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ZoomService {
  constructor(
    @InjectRepository(ZoomMeeting)
    private readonly zoomMeetingRepository: Repository<ZoomMeeting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createMeeting(createZoomMeetingDto: CreateZoomMeetingDto, userId: string): Promise<ZoomMeeting> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const meeting = this.zoomMeetingRepository.create({
      ...createZoomMeetingDto,
      createdById: userId,
      status: this.calculateMeetingStatus(createZoomMeetingDto),
    });

    return await this.zoomMeetingRepository.save(meeting);
  }

  async findAllMeetings(): Promise<ZoomMeeting[]> {
    return await this.zoomMeetingRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingsByUser(userId: string): Promise<ZoomMeeting[]> {
    return await this.zoomMeetingRepository.find({
      where: { createdById: userId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingById(id: string): Promise<ZoomMeeting> {
    const meeting = await this.zoomMeetingRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async updateMeeting(id: string, updateZoomMeetingDto: UpdateZoomMeetingDto, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only update your own meetings');
    }

    Object.assign(meeting, updateZoomMeetingDto);
    meeting.status = this.calculateMeetingStatus({ ...meeting, ...updateZoomMeetingDto });
    
    return await this.zoomMeetingRepository.save(meeting);
  }

  async deleteMeeting(id: string, userId: string): Promise<void> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own meetings');
    }

    await this.zoomMeetingRepository.remove(meeting);
  }

  async incrementJoinCount(id: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    meeting.joinCount += 1;
    return await this.zoomMeetingRepository.save(meeting);
  }

  async endMeeting(id: string, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only end your own meetings');
    }

    meeting.status = 'ended';
    return await this.zoomMeetingRepository.save(meeting);
  }

  async getMeetingsByStatus(status: string): Promise<ZoomMeeting[]> {
    const meetings = await this.findAllMeetings();
    return meetings.filter(meeting => this.calculateMeetingStatus(meeting) === status);
  }

  async searchMeetings(searchTerm: string): Promise<ZoomMeeting[]> {
    const queryBuilder = this.zoomMeetingRepository.createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.createdBy', 'user')
      .where('meeting.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('meeting.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('meeting.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  private calculateMeetingStatus(meeting: any): string {
    if (!meeting.date || !meeting.time || !meeting.period) return 'scheduled';
    
    const now = new Date();
    
    // Parse time with AM/PM period
    const [hours, minutes] = meeting.time.split(':').map(Number);
    let hour24 = hours;
    
    if (meeting.period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (meeting.period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    // Create meeting datetime
    const meetingDateTime = new Date(meeting.date);
    meetingDateTime.setHours(hour24, minutes, 0, 0);
    
    const endDateTime = new Date(meetingDateTime.getTime() + 60 * 60000); // Default 60 minutes
    
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime && now <= endDateTime) return 'live';
    return 'ended';
  }

  async updateMeetingStatuses(): Promise<void> {
    const meetings = await this.zoomMeetingRepository.find();
    
    for (const meeting of meetings) {
      const newStatus = this.calculateMeetingStatus(meeting);
      if (meeting.status !== newStatus) {
        meeting.status = newStatus;
        await this.zoomMeetingRepository.save(meeting);
      }
    }
  }
}

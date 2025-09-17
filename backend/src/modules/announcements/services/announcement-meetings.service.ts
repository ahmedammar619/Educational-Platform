import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementMeeting } from '../entities/announcement-meeting.entity';
import { CreateAnnouncementMeetingDto } from '../dto/create-announcement-meeting.dto';
import { UpdateAnnouncementMeetingDto } from '../dto/update-announcement-meeting.dto';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../../common/enums/role.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { ZoomApiService } from '../../zoom/services/zoom-api.service';

@Injectable()
export class AnnouncementMeetingsService {
  constructor(
    @InjectRepository(AnnouncementMeeting)
    private readonly announcementMeetingRepository: Repository<AnnouncementMeeting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly zoomApiService: ZoomApiService,
  ) {}

  async createMeeting(createAnnouncementMeetingDto: CreateAnnouncementMeetingDto, userId: string): Promise<AnnouncementMeeting> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins can create announcement meetings
    if (user.role !== Role.Admin) {
      throw new ForbiddenException('Only administrators can create announcement meetings');
    }

    try {
      // Create Zoom meeting via API
      const zoomMeetingData = {
        topic: createAnnouncementMeetingDto.title,
        agenda: createAnnouncementMeetingDto.description || `Announcement: ${createAnnouncementMeetingDto.title}`,
        startTime: createAnnouncementMeetingDto.date && createAnnouncementMeetingDto.time 
          ? new Date(`${createAnnouncementMeetingDto.date}T${createAnnouncementMeetingDto.time}:00`).toISOString()
          : undefined,
        duration: 120, // 120 minutes default
        password: undefined, // Let Zoom generate password
      };

      const zoomMeeting = await this.zoomApiService.createZoomMeeting(zoomMeetingData);

      // Create meeting record in database
      const meeting = this.announcementMeetingRepository.create({
        ...createAnnouncementMeetingDto,
        invitationLink: zoomMeeting.join_url,
        zoomMeetingId: zoomMeeting.id.toString(),
        zoomPassword: zoomMeeting.password,
        zoomStartUrl: zoomMeeting.start_url,
        createdById: userId,
        status: 'scheduled',
        recordingStatus: 'pending',
        joinCount: 0,
      });

      const savedMeeting = await this.announcementMeetingRepository.save(meeting);

      // Send notification to ALL users about the new announcement meeting
      await this.sendAnnouncementMeetingNotification(savedMeeting, 'created');

      // Return meeting with relations
      return this.announcementMeetingRepository.findOne({
        where: { id: savedMeeting.id },
        relations: ['createdBy'],
      });

    } catch (error) {
      console.error('Error creating announcement meeting:', error);
      throw new BadRequestException('Failed to create announcement meeting');
    }
  }

  async findAllMeetings(): Promise<AnnouncementMeeting[]> {
    return await this.announcementMeetingRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingById(id: string): Promise<AnnouncementMeeting> {
    const meeting = await this.announcementMeetingRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!meeting) {
      throw new NotFoundException('Announcement meeting not found');
    }

    return meeting;
  }

  async findMeetingsByUser(userId: string): Promise<AnnouncementMeeting[]> {
    return await this.announcementMeetingRepository.find({
      where: { createdById: userId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateMeeting(id: string, updateAnnouncementMeetingDto: UpdateAnnouncementMeetingDto, userId: string): Promise<AnnouncementMeeting> {
    const meeting = await this.findMeetingById(id);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins or the meeting creator can update
    if (user.role !== Role.Admin && meeting.createdById !== userId) {
      throw new ForbiddenException('You can only update your own announcement meetings');
    }

    try {
      // Update Zoom meeting if it exists
      if (meeting.zoomMeetingId) {
        const zoomUpdateData = {
          topic: updateAnnouncementMeetingDto.title || meeting.title,
          agenda: updateAnnouncementMeetingDto.description || meeting.description,
          startTime: updateAnnouncementMeetingDto.date && updateAnnouncementMeetingDto.time 
            ? new Date(`${updateAnnouncementMeetingDto.date}T${updateAnnouncementMeetingDto.time}:00`).toISOString()
            : undefined,
        };

        // Note: ZoomApiService doesn't have updateZoomMeeting method
        // For now, we'll skip updating the Zoom meeting and only update our database
        console.log('Skipping Zoom meeting update - method not available in ZoomApiService');
      }

      // Update database record
      Object.assign(meeting, updateAnnouncementMeetingDto);
      const updatedMeeting = await this.announcementMeetingRepository.save(meeting);

      // Send notification about meeting update
      await this.sendAnnouncementMeetingNotification(updatedMeeting, 'updated');

      return updatedMeeting;

    } catch (error) {
      console.error('Error updating announcement meeting:', error);
      throw new BadRequestException('Failed to update announcement meeting');
    }
  }

  async deleteMeeting(id: string, userId: string): Promise<void> {
    const meeting = await this.findMeetingById(id);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins or the meeting creator can delete
    if (user.role !== Role.Admin && meeting.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own announcement meetings');
    }

    try {
      // Delete Zoom meeting if it exists
      if (meeting.zoomMeetingId) {
        await this.zoomApiService.deleteMeeting(meeting.zoomMeetingId);
      }

      // Send notification about meeting cancellation
      await this.sendAnnouncementMeetingNotification(meeting, 'cancelled');

      // Delete from database
      await this.announcementMeetingRepository.remove(meeting);

    } catch (error) {
      console.error('Error deleting announcement meeting:', error);
      throw new BadRequestException('Failed to delete announcement meeting');
    }
  }

  async joinMeeting(id: string): Promise<AnnouncementMeeting> {
    const meeting = await this.findMeetingById(id);

    // Increment join count
    meeting.joinCount += 1;
    const updatedMeeting = await this.announcementMeetingRepository.save(meeting);

    console.log(`User joined announcement meeting ${id}, total joins: ${updatedMeeting.joinCount}`);
    return updatedMeeting;
  }

  async startMeeting(id: string): Promise<AnnouncementMeeting> {
    const meeting = await this.findMeetingById(id);

    // Send notification to all users that the meeting has started
    await this.sendAnnouncementMeetingNotification(meeting, 'started');

    console.log(`Announcement meeting ${id} started, notifications sent to all users`);
    return meeting;
  }

  async endMeeting(id: string, userId: string): Promise<AnnouncementMeeting> {
    const meeting = await this.findMeetingById(id);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins or the meeting creator can end
    if (user.role !== Role.Admin && meeting.createdById !== userId) {
      throw new ForbiddenException('You can only end your own announcement meetings');
    }

    meeting.status = 'ended';
    const updatedMeeting = await this.announcementMeetingRepository.save(meeting);

    // Send notification about meeting end
    await this.sendAnnouncementMeetingNotification(updatedMeeting, 'ended');

    return updatedMeeting;
  }

  async cancelMeeting(id: string, userId: string): Promise<AnnouncementMeeting> {
    const meeting = await this.findMeetingById(id);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins or the meeting creator can cancel
    if (user.role !== Role.Admin && meeting.createdById !== userId) {
      throw new ForbiddenException('You can only cancel your own announcement meetings');
    }

    meeting.status = 'cancelled';
    const updatedMeeting = await this.announcementMeetingRepository.save(meeting);

    // Send notification about meeting cancellation
    await this.sendAnnouncementMeetingNotification(updatedMeeting, 'cancelled');

    return updatedMeeting;
  }

  async getMeetingsByStatus(status: string): Promise<AnnouncementMeeting[]> {
    const meetings = await this.findAllMeetings();
    return meetings.filter(meeting => this.calculateMeetingStatus(meeting) === status);
  }

  async searchMeetings(searchTerm: string): Promise<AnnouncementMeeting[]> {
    const queryBuilder = this.announcementMeetingRepository.createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.createdBy', 'user')
      .where('meeting.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('meeting.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.firstName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.lastName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('meeting.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  private calculateMeetingStatus(meeting: AnnouncementMeeting): string {
    // If meeting was manually ended or cancelled, keep it as is
    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      return meeting.status;
    }

    if (!meeting.date || !meeting.time || !meeting.period) {
      return 'scheduled';
    }

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
    
    // Meeting continues until manually ended
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime) return 'live';
    
    return 'scheduled';
  }

  private async sendAnnouncementMeetingNotification(meeting: AnnouncementMeeting, action: string): Promise<void> {
    try {
      // Get ALL platform users (admin, teachers, students, parents) to send notifications to EVERYONE
      const allUsers = await this.userRepository.find();
      console.log(`📢 ANNOUNCEMENT MEETING: Sending notification to ALL ${allUsers.length} platform users for action: ${action}`);

      // For announcement meetings, we want to notify EVERYONE on the platform
      for (const user of allUsers) {
        // For 'created' action, notify EVERYONE including the creator (announcements should reach all)
        // For other actions, still notify everyone but skip creator for their own updates
        if (user.id === meeting.createdById && action === 'updated') {
          continue; // Skip notifying creator about their own updates
        }

        let title: string;
        let message: string;

        switch (action) {
          case 'created':
            title = '📢 New Announcement Meeting';
            message = `A new announcement meeting "${meeting.title}" has been scheduled for all platform users. Check the announcements tab for details and join information.`;
            break;
          case 'updated':
            title = '📝 Announcement Meeting Updated';
            message = `The announcement meeting "${meeting.title}" has been updated. Check the announcements tab for latest details.`;
            break;
          case 'started':
            title = '🔴 LIVE: Announcement Meeting Started';
            message = `The announcement meeting "${meeting.title}" has started and is now live! Join immediately from the announcements tab.`;
            break;
          case 'ended':
            title = '⏹️ Announcement Meeting Ended';
            message = `The announcement meeting "${meeting.title}" has ended. Thank you for your participation.`;
            break;
          case 'cancelled':
            title = '❌ Announcement Meeting Cancelled';
            message = `The announcement meeting "${meeting.title}" has been cancelled. You will be notified of any rescheduled meetings.`;
            break;
          default:
            continue;
        }

        await this.notificationsService.create({
          userId: user.id,
          title,
          message,
          type: NotificationType.ANNOUNCEMENT_MEETING,
          relatedId: meeting.id,
        });
      }

      console.log(`✅ Successfully sent announcement meeting notifications to ALL ${allUsers.length} platform users for action: ${action}`);
    } catch (error) {
      console.error('❌ Error sending announcement meeting notifications:', error);
      // Don't throw error - notification failure shouldn't break the main operation
    }
  }
}

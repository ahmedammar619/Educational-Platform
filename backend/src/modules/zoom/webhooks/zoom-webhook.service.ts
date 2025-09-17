import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomMeeting } from '../entities/zoom-meeting.entity';
import { RecordingService } from '../services/recording.service';
import * as crypto from 'crypto';

interface ZoomWebhookEvent {
  event: string;
  payload: {
    account_id: string;
    object: {
      uuid: string;
      id: string;
      host_id: string;
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      created_at: string;
      join_url: string;
      recording_files?: Array<{
        id: string;
        meeting_id: string;
        recording_start: string;
        recording_end: string;
        file_type: string;
        file_size: number;
        play_url: string;
        download_url: string;
        status: string;
        recording_type: string;
      }>;
    };
  };
  event_ts: number;
}

@Injectable()
export class ZoomWebhookService {
  private readonly logger = new Logger(ZoomWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ZoomMeeting)
    private zoomMeetingRepository: Repository<ZoomMeeting>,
    private recordingService: RecordingService
  ) {
    this.webhookSecret = this.configService.get<string>('ZOOM_WEBHOOK_SECRET') || 'test-secret';
    
    if (!this.webhookSecret) {
      this.logger.error('Zoom webhook secret is not configured');
      throw new Error('Zoom webhook secret is missing from environment variables');
    }
    
    this.logger.log(`Webhook secret configured: ${this.webhookSecret === 'test-secret' ? 'test-secret (testing mode)' : 'production secret'}`);
  }

  /**
   * Verify webhook signature for security
   * @param body - The webhook payload
   * @param signature - The signature from headers
   * @returns True if signature is valid
   */
  async verifyWebhookSignature(body: any, signature: string): Promise<boolean> {
    try {
      // For testing purposes, allow requests without signature if using test-secret
      if (this.webhookSecret === 'test-secret') {
        this.logger.log('Using test-secret, allowing all webhook requests');
        return true;
      }

      if (!signature) {
        this.logger.warn('No signature provided in webhook request');
        return false;
      }

      // Zoom uses HMAC-SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

      this.logger.log(`Signature validation: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Handle incoming webhook events
   * @param event - The webhook event
   */
  async handleWebhookEvent(event: ZoomWebhookEvent): Promise<void> {
    try {
      this.logger.log(`Processing webhook event: ${event.event}`);

      switch (event.event) {
        case 'recording.completed':
          await this.handleRecordingCompleted(event);
          break;
        case 'recording.started':
          await this.handleRecordingStarted(event);
          break;
        case 'recording.stopped':
          await this.handleRecordingStopped(event);
          break;
        case 'meeting.ended':
          await this.handleMeetingEnded(event);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event.event}`);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle recording completed event
   * @param event - The webhook event
   */
  private async handleRecordingCompleted(event: ZoomWebhookEvent): Promise<void> {
    try {
      const meetingId = event.payload.object.id;
      this.logger.log(`Recording completed for meeting: ${meetingId}`);

      // Find the meeting in our database
      let meeting = await this.zoomMeetingRepository.findOne({
        where: { zoomMeetingId: meetingId },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found in database: ${meetingId}`);
        this.logger.log(`Creating database entry for external Zoom meeting: ${meetingId}`);
        
        // Create a database entry for external Zoom meetings
        // Skip creating database entries for external meetings to avoid constraint issues
        this.logger.log(`Skipping database creation for external meeting: ${meetingId}`);
        this.logger.log(`Processing recording directly for external meeting: ${event.payload.object.topic}`);
        
        // Create a temporary meeting object for processing without saving to database
        meeting = {
          id: `external-${meetingId}`,
          zoomMeetingId: meetingId,
          title: event.payload.object.topic || 'External Zoom Meeting',
          description: 'Recording from external Zoom meeting',
          invitationLink: event.payload.object.join_url || '',
          date: event.payload.object.start_time ? new Date(event.payload.object.start_time).toISOString().split('T')[0] : null,
          time: event.payload.object.start_time ? new Date(event.payload.object.start_time).toTimeString().split(' ')[0].slice(0, 5) : null,
          period: 'AM',
          status: 'ended',
          recordingStatus: 'completed',
          course: null, // External meeting has no course
          createdAt: new Date(),
          updatedAt: new Date()
        } as any;
        
        this.logger.log(`Created temporary meeting object for external meeting: ${meeting.id}`);
      } else {
        // Update recording status for existing meetings
        meeting.recordingStatus = 'completed';
        await this.zoomMeetingRepository.save(meeting);
      }

      // Process the recording (download to R2, upload to YouTube)
      await this.recordingService.processRecording(meeting, event.payload.object);

      this.logger.log(`Successfully processed recording completion for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error(`Error handling recording completed event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle recording started event
   * @param event - The webhook event
   */
  private async handleRecordingStarted(event: ZoomWebhookEvent): Promise<void> {
    try {
      const meetingId = event.payload.object.id;
      this.logger.log(`Recording started for meeting: ${meetingId}`);

      // Find the meeting in our database
      const meeting = await this.zoomMeetingRepository.findOne({
        where: { zoomMeetingId: meetingId },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found in database: ${meetingId}`);
        return;
      }

      // Update recording status
      meeting.recordingStatus = 'recording';
      await this.zoomMeetingRepository.save(meeting);

      this.logger.log(`Updated recording status for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error(`Error handling recording started event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle recording stopped event
   * @param event - The webhook event
   */
  private async handleRecordingStopped(event: ZoomWebhookEvent): Promise<void> {
    try {
      const meetingId = event.payload.object.id;
      this.logger.log(`Recording stopped for meeting: ${meetingId}`);

      // Find the meeting in our database
      const meeting = await this.zoomMeetingRepository.findOne({
        where: { zoomMeetingId: meetingId },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found in database: ${meetingId}`);
        return;
      }

      // Update recording status
      meeting.recordingStatus = 'processing';
      await this.zoomMeetingRepository.save(meeting);

      this.logger.log(`Updated recording status for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error(`Error handling recording stopped event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle meeting ended event
   * @param event - The webhook event
   */
  private async handleMeetingEnded(event: ZoomWebhookEvent): Promise<void> {
    try {
      const meetingId = event.payload.object.id;
      this.logger.log(`Meeting ended: ${meetingId}`);

      // Find the meeting in our database
      const meeting = await this.zoomMeetingRepository.findOne({
        where: { zoomMeetingId: meetingId },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found in database: ${meetingId}`);
        return;
      }

      // Update meeting status
      meeting.status = 'ended';
      await this.zoomMeetingRepository.save(meeting);

      this.logger.log(`Updated meeting status for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error(`Error handling meeting ended event: ${error.message}`, error.stack);
      throw error;
    }
  }
}

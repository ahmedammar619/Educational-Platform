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
    this.webhookSecret = this.configService.get<string>('ZOOM_WEBHOOK_SECRET');
    
    if (!this.webhookSecret) {
      this.logger.error('Zoom webhook secret is not configured');
      throw new Error('Zoom webhook secret is missing from environment variables');
    }
  }

  /**
   * Verify webhook signature for security
   * @param body - The webhook payload
   * @param signature - The signature from headers
   * @returns True if signature is valid
   */
  async verifyWebhookSignature(body: any, signature: string): Promise<boolean> {
    try {
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

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
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
      const meeting = await this.zoomMeetingRepository.findOne({
        where: { zoomMeetingId: meetingId },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found in database: ${meetingId}`);
        return;
      }

      // Update recording status
      meeting.recordingStatus = 'completed';
      await this.zoomMeetingRepository.save(meeting);

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

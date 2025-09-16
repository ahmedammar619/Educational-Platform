import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomMeeting } from '../entities/zoom-meeting.entity';
import { ZoomApiService } from './zoom-api.service';
import { R2Service } from '../../storage/r2.service';
import { YouTubeService } from '../../youtube/youtube.service';

interface ZoomRecordingObject {
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
}

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);

  constructor(
    @InjectRepository(ZoomMeeting)
    private zoomMeetingRepository: Repository<ZoomMeeting>,
    private zoomApiService: ZoomApiService,
    private r2Service: R2Service,
    private youtubeService: YouTubeService
  ) {}

  /**
   * Process a completed recording from Zoom
   * @param meeting - The Zoom meeting entity
   * @param recordingObject - The recording object from Zoom webhook
   */
  async processRecording(meeting: ZoomMeeting, recordingObject: ZoomRecordingObject): Promise<void> {
    try {
      this.logger.log(`Processing recording for meeting: ${meeting.id}`);

      if (!recordingObject.recording_files || recordingObject.recording_files.length === 0) {
        this.logger.warn(`No recording files found for meeting: ${meeting.id}`);
        meeting.recordingStatus = 'failed';
        await this.zoomMeetingRepository.save(meeting);
        return;
      }

      // Find the main video recording file (usually the first one)
      const mainRecording = recordingObject.recording_files.find(
        file => file.recording_type === 'shared_screen_with_speaker_view' || 
                file.recording_type === 'shared_screen_with_gallery_view' ||
                file.file_type === 'MP4'
      ) || recordingObject.recording_files[0];

      if (!mainRecording) {
        this.logger.warn(`No suitable recording file found for meeting: ${meeting.id}`);
        meeting.recordingStatus = 'failed';
        await this.zoomMeetingRepository.save(meeting);
        return;
      }

      this.logger.log(`Processing recording file: ${mainRecording.id}`);

      // Step 1: Download recording from Zoom and upload to R2
      const r2Result = await this.downloadAndUploadToR2(meeting, mainRecording);

      // Step 2: Upload from R2 to YouTube
      const youtubeResult = await this.uploadToYouTube(meeting, r2Result.key, recordingObject);

      // Step 3: Update database with results
      await this.updateMeetingWithResults(meeting, r2Result, youtubeResult);

      this.logger.log(`Successfully processed recording for meeting: ${meeting.id}`);
    } catch (error) {
      this.logger.error(`Error processing recording: ${error.message}`, error.stack);
      
      // Update meeting status to failed
      meeting.recordingStatus = 'failed';
      await this.zoomMeetingRepository.save(meeting);
      
      throw error;
    }
  }

  /**
   * Download recording from Zoom and upload to R2
   * @param meeting - The Zoom meeting entity
   * @param recordingFile - The recording file from Zoom
   * @returns R2 upload result
   */
  private async downloadAndUploadToR2(
    meeting: ZoomMeeting,
    recordingFile: any
  ): Promise<{ key: string; url: string; size: number }> {
    try {
      this.logger.log(`Downloading recording from Zoom and uploading to R2 for meeting: ${meeting.id}`);

      // Download the recording file from Zoom
      const recordingStream = await this.zoomApiService.downloadRecordingFile(recordingFile.download_url);

      // Generate R2 key using course name
      const fileName = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_${meeting.id}.${recordingFile.file_type.toLowerCase()}`;
      const courseName = meeting.course?.name || 'Unknown_Course';
      const r2Key = this.r2Service.generateRecordingKey(courseName, fileName);

      // Upload to R2
      const r2Result = await this.r2Service.uploadRecording(
        r2Key,
        recordingStream,
        'video/mp4',
        {
          meetingId: meeting.id,
          zoomMeetingId: meeting.zoomMeetingId,
          originalFileName: fileName,
          recordingType: recordingFile.recording_type,
          fileSize: recordingFile.file_size.toString(),
        }
      );

      this.logger.log(`Successfully uploaded recording to R2: ${r2Key}`);

      return r2Result;
    } catch (error) {
      this.logger.error(`Error downloading and uploading to R2: ${error.message}`, error.stack);
      throw new Error(`Failed to download and upload to R2: ${error.message}`);
    }
  }

  /**
   * Upload recording from R2 to YouTube
   * @param meeting - The Zoom meeting entity
   * @param r2Key - The R2 key of the recording
   * @param recordingObject - The recording object from Zoom
   * @returns YouTube upload result
   */
  private async uploadToYouTube(
    meeting: ZoomMeeting,
    r2Key: string,
    recordingObject: ZoomRecordingObject
  ): Promise<{ videoId: string; url: string; title: string; description: string }> {
    try {
      this.logger.log(`Uploading recording to YouTube for meeting: ${meeting.id}`);

      // Get the recording stream from R2
      const recordingStream = await this.r2Service.streamRecording(r2Key);

      // Generate video title and description
      const videoTitle = this.youtubeService.generateVideoTitle(
        meeting.title,
        meeting.zoomMeetingId,
        new Date(recordingObject.start_time)
      );

      const videoDescription = this.youtubeService.generateVideoDescription(
        meeting.title,
        meeting.zoomMeetingId,
        new Date(recordingObject.start_time)
      );

      // Upload to YouTube
      const youtubeResult = await this.youtubeService.uploadVideo(
        recordingStream,
        videoTitle,
        videoDescription,
        meeting.zoomMeetingId
      );

      this.logger.log(`Successfully uploaded recording to YouTube: ${youtubeResult.videoId}`);

      return youtubeResult;
    } catch (error) {
      this.logger.error(`Error uploading to YouTube: ${error.message}`, error.stack);
      throw new Error(`Failed to upload to YouTube: ${error.message}`);
    }
  }

  /**
   * Update meeting entity with recording results
   * @param meeting - The Zoom meeting entity
   * @param r2Result - The R2 upload result
   * @param youtubeResult - The YouTube upload result
   */
  private async updateMeetingWithResults(
    meeting: ZoomMeeting,
    r2Result: { key: string; url: string; size: number },
    youtubeResult: { videoId: string; url: string; title: string; description: string }
  ): Promise<void> {
    try {
      this.logger.log(`Updating meeting with recording results: ${meeting.id}`);

      // Update meeting with all recording information
      meeting.recordingStatus = 'completed';
      meeting.recordingUrl = r2Result.url;
      meeting.r2RecordingKey = r2Result.key;
      meeting.r2RecordingUrl = r2Result.url;
      meeting.youtubeVideoId = youtubeResult.videoId;
      meeting.youtubeUrl = youtubeResult.url;
      meeting.recordingCompletedAt = new Date();

      await this.zoomMeetingRepository.save(meeting);

      this.logger.log(`Successfully updated meeting with recording results: ${meeting.id}`);
    } catch (error) {
      this.logger.error(`Error updating meeting with results: ${error.message}`, error.stack);
      throw new Error(`Failed to update meeting with results: ${error.message}`);
    }
  }

  /**
   * Retry processing a failed recording
   * @param meetingId - The meeting ID
   */
  async retryRecordingProcessing(meetingId: string): Promise<void> {
    try {
      this.logger.log(`Retrying recording processing for meeting: ${meetingId}`);

      const meeting = await this.zoomMeetingRepository.findOne({
        where: { id: meetingId },
      });

      if (!meeting) {
        throw new Error(`Meeting not found: ${meetingId}`);
      }

      if (!meeting.zoomMeetingId) {
        throw new Error(`No Zoom meeting ID found for meeting: ${meetingId}`);
      }

      // Get recording details from Zoom
      const recordingDetails = await this.zoomApiService.getRecordingDetails(meeting.zoomMeetingId);

      if (!recordingDetails.recording_files || recordingDetails.recording_files.length === 0) {
        throw new Error(`No recording files found for meeting: ${meetingId}`);
      }

      // Reset status and process again
      meeting.recordingStatus = 'processing';
      await this.zoomMeetingRepository.save(meeting);

      await this.processRecording(meeting, recordingDetails);

      this.logger.log(`Successfully retried recording processing for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error(`Error retrying recording processing: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get recording status for a meeting
   * @param meetingId - The meeting ID
   * @returns Recording status information
   */
  async getRecordingStatus(meetingId: string): Promise<{
    status: string;
    recordingUrl?: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
    completedAt?: Date;
  }> {
    try {
      const meeting = await this.zoomMeetingRepository.findOne({
        where: { id: meetingId },
      });

      if (!meeting) {
        throw new Error(`Meeting not found: ${meetingId}`);
      }

      return {
        status: meeting.recordingStatus,
        recordingUrl: meeting.r2RecordingUrl,
        youtubeUrl: meeting.youtubeUrl,
        youtubeVideoId: meeting.youtubeVideoId,
        completedAt: meeting.recordingCompletedAt,
      };
    } catch (error) {
      this.logger.error(`Error getting recording status: ${error.message}`, error.stack);
      throw error;
    }
  }
}

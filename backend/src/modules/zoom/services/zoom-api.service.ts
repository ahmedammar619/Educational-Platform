import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { encode } from 'base-64';
import { Readable } from 'stream';

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: string;
  join_url: string;
  password: string;
  start_url: string;
  topic: string;
  agenda: string;
  duration: number;
}

interface ZoomRecordingsResponse {
  meetings: Array<{
    id: string;
    uuid: string;
    topic: string;
    start_time: string;
    duration: number;
    host_id: string;
    recording_files: Array<{
      id: string;
      file_type: string;
      file_size: number;
      recording_type: string;
      status: string;
      download_url: string;
      play_url: string;
      recording_start: string;
      recording_end: string;
    }>;
  }>;
  from: string;
  to: string;
  page_count: number;
  page_size: number;
}

@Injectable()
export class ZoomApiService {
  private readonly logger = new Logger(ZoomApiService.name);
  private readonly zoomAccountId: string;
  private readonly zoomClientId: string;
  private readonly zoomClientSecret: string;

  constructor(private configService: ConfigService) {
    this.zoomAccountId = this.configService.get<string>('ZOOM_ACCOUNT_ID');
    this.zoomClientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    this.zoomClientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');

    if (!this.zoomAccountId || !this.zoomClientId || !this.zoomClientSecret) {
      this.logger.error('Zoom credentials are not properly configured');
      throw new Error('Zoom credentials are missing from environment variables');
    }
  }

  private getAuthHeaders() {
    return {
      Authorization: `Basic ${encode(
        `${this.zoomClientId}:${this.zoomClientSecret}`
      )}`,
      'Content-Type': 'application/json',
    };
  }

  async generateZoomAccessToken(): Promise<string> {
    try {
      this.logger.log('Generating Zoom access token...');
      
      const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.zoomAccountId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to generate access token: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      const jsonResponse = await response.json() as ZoomTokenResponse;
      this.logger.log('Successfully generated Zoom access token');
      
      return jsonResponse?.access_token;
    } catch (error) {
      this.logger.error('Error generating Zoom access token:', error);
      throw error;
    }
  }

  async createZoomMeeting(meetingData: {
    topic: string;
    agenda?: string;
    startTime?: string;
    duration?: number;
    password?: string;
    settings?: any;
    hostEmail?: string; // Add host email parameter
  }): Promise<{
    id: string;
    join_url: string;
    password: string;
    start_url: string;
  }> {
    try {
      this.logger.log('Creating Zoom meeting...');
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      const meetingPayload = {
        topic: meetingData.topic,
        agenda: meetingData.agenda || `Meeting for ${meetingData.topic}`,
        default_password: false,
        duration: meetingData.duration || 120, // Default 120 minutes as requested
        password: meetingData.password || this.generateMeetingPassword(),
        settings: {
          allow_multiple_devices: true,
          alternative_hosts_email_notification: true,
          calendar_type: 1,
          contact_email: 'AmericanIslamicDiversity@gmail.com',
          contact_name: 'Baraem Al-Nour Educational Platform',
          email_notification: true,
          encryption_type: 'enhanced_encryption',
          focus_mode: true,
          host_video: true,
          join_before_host: false, // Host must be present to start meeting
          meeting_authentication: false, // Allow students to join without authentication
          mute_upon_entry: true,
          participant_video: true,
          private_meeting: false, // Allow students to join
          waiting_room: false, // Don't use waiting room for easier access
          watermark: false,
          continuous_meeting_chat: {
            enable: true,
          },
          // Meeting control settings
          auto_recording: 'cloud', // Automatically start recording when meeting begins
          recording_authentication: false, // Allow recording without authentication
          // Ensure recording starts automatically
          recording_auto_start: true, // Start recording automatically when meeting starts
          // Prevent automatic meeting termination
          close_registration: false, // Keep registration open
          enforce_login: false, // Don't enforce login
          enforce_login_domains: '', // No domain restrictions
          // Host control settings
          host_save_video_order: true, // Host controls video order
          breakout_room: {
            enable: false, // Disable breakout rooms for simplicity
          },
          // Enable cloud recording with automatic start
          cloud_recording: true,
          cloud_recording_download: true,
          cloud_recording_download_host: true,
          cloud_recording_download_participants: true,
          cloud_recording_download_shared_screen_with_speaker_view: true,
          cloud_recording_download_shared_screen_with_gallery_view: true,
          cloud_recording_download_audio_only: true,
          cloud_recording_download_chat_transcript: true,
          cloud_recording_download_video_transcript: true,
          cloud_recording_download_poll_report: true,
          cloud_recording_download_attention_tracking_feature_report: true,
          cloud_recording_download_registrant_report: true,
          cloud_recording_download_participant_report: true,
          cloud_recording_download_qa_report: true,
          cloud_recording_download_survey_report: true,
          // Additional recording settings for automatic start
          recording_auto_start_cloud: true, // Auto-start cloud recording
          recording_auto_start_local: false, // Don't auto-start local recording
          ...meetingData.settings,
        },
        start_time: meetingData.startTime || new Date().toISOString(),
        timezone: 'America/Chicago', // Texas timezone
        type: 2, // Scheduled meeting
      };

      // Use specific host email if provided, otherwise use 'me'
      const endpoint = meetingData.hostEmail 
        ? `https://api.zoom.us/v2/users/${meetingData.hostEmail}/meetings`
        : 'https://api.zoom.us/v2/users/me/meetings';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${zoomAccessToken}`,
        },
        body: JSON.stringify(meetingPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to create Zoom meeting: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      const jsonResponse = await response.json() as ZoomMeetingResponse;
      this.logger.log('Successfully created Zoom meeting:', jsonResponse.id);

      return {
        id: jsonResponse.id.toString(),
        join_url: jsonResponse.join_url,
        password: jsonResponse.password,
        start_url: jsonResponse.start_url,
      };
    } catch (error) {
      this.logger.error('Error creating Zoom meeting:', error);
      throw error;
    }
  }

  async getMeetingDetails(meetingId: string): Promise<any> {
    try {
      this.logger.log(`Getting details for meeting: ${meetingId}`);
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to get meeting details: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      const jsonResponse = await response.json();
      this.logger.log('Successfully retrieved meeting details');
      
      return jsonResponse;
    } catch (error) {
      this.logger.error('Error getting meeting details:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      this.logger.log(`Deleting Zoom meeting: ${meetingId}`);
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to delete meeting: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      this.logger.log('Successfully deleted Zoom meeting');
    } catch (error) {
      this.logger.error('Error deleting Zoom meeting:', error);
      throw error;
    }
  }

  async getRecordingDetails(meetingId: string): Promise<any> {
    try {
      this.logger.log(`Getting recording details for meeting: ${meetingId}`);
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to get recording details: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      const jsonResponse = await response.json();
      this.logger.log('Successfully retrieved recording details');
      
      return jsonResponse;
    } catch (error) {
      this.logger.error('Error getting recording details:', error);
      throw error;
    }
  }

  async updateMeetingRecordingSettings(meetingId: string, enableAutoRecording: boolean = true): Promise<void> {
    try {
      this.logger.log(`Updating recording settings for meeting: ${meetingId}`);
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      const updatePayload = {
        settings: {
          cloud_recording: true,
          auto_recording: enableAutoRecording ? 'cloud' : 'none',
          recording_authentication: false,
          cloud_recording_download: true,
          cloud_recording_download_host: true,
          cloud_recording_download_participants: true,
          cloud_recording_download_shared_screen_with_speaker_view: true,
          cloud_recording_download_shared_screen_with_gallery_view: true,
          cloud_recording_download_audio_only: true,
          cloud_recording_download_chat_transcript: true,
          cloud_recording_download_video_transcript: true,
          cloud_recording_download_poll_report: true,
          cloud_recording_download_attention_tracking_feature_report: true,
          cloud_recording_download_registrant_report: true,
          cloud_recording_download_participant_report: true,
          cloud_recording_download_qa_report: true,
          cloud_recording_download_survey_report: true,
        },
      };

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomAccessToken}`,
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to update recording settings: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      this.logger.log(`Successfully updated recording settings for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error('Error updating recording settings:', error);
      throw error;
    }
  }

  async updateMeetingHostControlSettings(meetingId: string): Promise<void> {
    try {
      this.logger.log(`Updating host control settings for meeting: ${meetingId}`);
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      const updatePayload = {
        settings: {
          // Host control settings
          join_before_host: false, // Host must be present to start meeting
          host_save_video_order: true, // Host controls video order
          // Prevent automatic meeting termination
          close_registration: false, // Keep registration open
          enforce_login: false, // Don't enforce login
          enforce_login_domains: '', // No domain restrictions
          // Meeting control
          breakout_room: {
            enable: false, // Disable breakout rooms for simplicity
          },
          // Ensure host has full control
          alternative_hosts_email_notification: true,
          host_video: true,
          participant_video: true,
          mute_upon_entry: true,
          waiting_room: false, // Don't use waiting room for easier access
        },
      };

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomAccessToken}`,
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to update host control settings: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      this.logger.log(`Successfully updated host control settings for meeting: ${meetingId}`);
    } catch (error) {
      this.logger.error('Error updating host control settings:', error);
      throw error;
    }
  }

  async downloadRecordingFile(downloadUrl: string): Promise<Readable> {
    try {
      this.logger.log(`Downloading recording file from Zoom: ${downloadUrl}`);
      
      // For direct download URLs, we don't need authentication tokens
      // The URLs are already authenticated and can be downloaded directly
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to download recording file: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      this.logger.log('Successfully downloaded recording file from Zoom');
      
      // Convert fetch response body to Node.js Readable stream
      const { Readable } = require('stream');
      
      // Get the response body as buffer first
      const buffer = await response.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);
      
      // Create a readable stream from the buffer
      return Readable.from(nodeBuffer);
    } catch (error) {
      this.logger.error('Error downloading recording file:', error);
      throw error;
    }
  }

  async getAllRecordings(from?: string, to?: string): Promise<ZoomRecordingsResponse> {
    try {
      this.logger.log('Getting all recordings from Zoom account...');
      
      const zoomAccessToken = await this.generateZoomAccessToken();

      // Build query parameters
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      params.append('page_size', '300'); // Maximum page size
      params.append('include_fields', 'recording_files');

      const url = `https://api.zoom.us/v2/users/me/recordings?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${zoomAccessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to get all recordings: ${response.status} ${errorText}`);
        throw new Error(`Zoom API error: ${response.status} ${errorText}`);
      }

      const jsonResponse = await response.json() as ZoomRecordingsResponse;
      this.logger.log(`Successfully retrieved ${jsonResponse.meetings?.length || 0} meetings with recordings`);
      
      return jsonResponse;
    } catch (error) {
      this.logger.error('Error getting all recordings:', error);
      throw error;
    }
  }

  private generateMeetingPassword(): string {
    // Generate a 6-digit password
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

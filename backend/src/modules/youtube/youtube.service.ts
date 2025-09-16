import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Readable } from 'stream';

interface YouTubeUploadResponse {
  videoId: string;
  url: string;
  title: string;
  description: string;
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly channelId: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('YOUTUBE_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('YOUTUBE_CLIENT_SECRET');
    this.refreshToken = this.configService.get<string>('YOUTUBE_REFRESH_TOKEN');
    this.channelId = this.configService.get<string>('YOUTUBE_CHANNEL_ID');

    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.channelId) {
      this.logger.error('YouTube credentials are not properly configured');
      throw new Error('YouTube credentials are missing from environment variables');
    }
  }

  /**
   * Get authenticated YouTube client
   */
  private async getYouTubeClient() {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      oauth2Client.setCredentials({
        refresh_token: this.refreshToken,
      });

      return google.youtube({
        version: 'v3',
        auth: oauth2Client,
      });
    } catch (error) {
      this.logger.error('Error creating YouTube client:', error);
      throw new Error(`Failed to create YouTube client: ${error.message}`);
    }
  }

  /**
   * Upload a video to YouTube from a stream
   * @param fileStream - The video file stream
   * @param title - The video title
   * @param description - The video description
   * @param meetingId - The Zoom meeting ID for metadata
   * @returns YouTube upload response with video ID and URL
   */
  async uploadVideo(
    fileStream: Readable,
    title: string,
    description: string,
    meetingId: string
  ): Promise<YouTubeUploadResponse> {
    try {
      this.logger.log(`Starting YouTube upload for meeting: ${meetingId}`);

      const youtube = await this.getYouTubeClient();

      // Prepare video metadata
      const videoMetadata = {
        snippet: {
          title: title,
          description: description,
          tags: ['educational', 'zoom-recording', 'baraem-al-nour'],
          categoryId: '22', // People & Blogs category
        },
        status: {
          privacyStatus: 'unlisted', // Unlisted - accessible via link but not public/searchable
          selfDeclaredMadeForKids: false,
        },
      };

      // Upload the video
      const uploadResponse = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: videoMetadata,
        media: {
          body: fileStream,
        },
      });

      const videoId = uploadResponse.data.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      this.logger.log(`Successfully uploaded video to YouTube: ${videoId}`);

      return {
        videoId,
        url: videoUrl,
        title: videoMetadata.snippet.title,
        description: videoMetadata.snippet.description,
      };
    } catch (error) {
      this.logger.error(`Error uploading video to YouTube: ${error.message}`, error.stack);
      throw new Error(`Failed to upload video to YouTube: ${error.message}`);
    }
  }

  /**
   * Update video metadata (title, description, privacy)
   * @param videoId - The YouTube video ID
   * @param updates - The updates to apply
   */
  async updateVideoMetadata(
    videoId: string,
    updates: {
      title?: string;
      description?: string;
      privacyStatus?: 'private' | 'unlisted' | 'public';
    }
  ): Promise<void> {
    try {
      this.logger.log(`Updating YouTube video metadata: ${videoId}`);

      const youtube = await this.getYouTubeClient();

      // Get current video details
      const currentVideo = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: [videoId],
      });

      if (!currentVideo.data.items || currentVideo.data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      const video = currentVideo.data.items[0];

      // Update metadata
      const updatedMetadata = {
        snippet: {
          ...video.snippet,
          title: updates.title || video.snippet.title,
          description: updates.description || video.snippet.description,
        },
        status: {
          ...video.status,
          privacyStatus: updates.privacyStatus || video.status.privacyStatus,
        },
      };

      await youtube.videos.update({
        part: ['snippet', 'status'],
        requestBody: {
          id: videoId,
          ...updatedMetadata,
        },
      });

      this.logger.log(`Successfully updated YouTube video metadata: ${videoId}`);
    } catch (error) {
      this.logger.error(`Error updating YouTube video metadata: ${error.message}`, error.stack);
      throw new Error(`Failed to update YouTube video metadata: ${error.message}`);
    }
  }

  /**
   * Delete a video from YouTube
   * @param videoId - The YouTube video ID
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      this.logger.log(`Deleting YouTube video: ${videoId}`);

      const youtube = await this.getYouTubeClient();

      await youtube.videos.delete({
        id: videoId,
      });

      this.logger.log(`Successfully deleted YouTube video: ${videoId}`);
    } catch (error) {
      this.logger.error(`Error deleting YouTube video: ${error.message}`, error.stack);
      throw new Error(`Failed to delete YouTube video: ${error.message}`);
    }
  }

  /**
   * Get video details from YouTube
   * @param videoId - The YouTube video ID
   */
  async getVideoDetails(videoId: string): Promise<any> {
    try {
      this.logger.log(`Getting YouTube video details: ${videoId}`);

      const youtube = await this.getYouTubeClient();

      const response = await youtube.videos.list({
        part: ['snippet', 'status', 'statistics'],
        id: [videoId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      this.logger.log(`Successfully retrieved YouTube video details: ${videoId}`);
      
      return response.data.items[0];
    } catch (error) {
      this.logger.error(`Error getting YouTube video details: ${error.message}`, error.stack);
      throw new Error(`Failed to get YouTube video details: ${error.message}`);
    }
  }

  /**
   * Generate a video title for Zoom recordings
   * @param meetingTitle - The Zoom meeting title
   * @param meetingId - The Zoom meeting ID
   * @param date - The meeting date
   */
  generateVideoTitle(meetingTitle: string, meetingId: string, date: Date): string {
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `${meetingTitle} - ${formattedDate}`;
  }

  /**
   * Generate a video description for Zoom recordings
   * @param meetingTitle - The Zoom meeting title
   * @param meetingId - The Zoom meeting ID
   * @param date - The meeting date
   */
  generateVideoDescription(meetingTitle: string, meetingId: string, date: Date): string {
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `Educational session recording from Baraem Al-Nour Educational Platform.

Meeting: ${meetingTitle}
Date: ${formattedDate}
Meeting ID: ${meetingId}

This video is part of our educational content and is accessible to anyone with the link.

For more educational content, visit our platform.`;
  }
}

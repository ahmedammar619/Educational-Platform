import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2FileService } from '../../../common/services/r2-file.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AgoraRecordingService {
  private readonly logger = new Logger(AgoraRecordingService.name);
  private readonly customerId: string;
  private readonly customerCertificate: string;
  private readonly appId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly r2FileService: R2FileService,
  ) {
    this.customerId = this.configService.get<string>('AGORA_CUSTOMER_ID');
    this.customerCertificate = this.configService.get<string>('AGORA_CUSTOMER_CERTIFICATE');
    this.appId = this.configService.get<string>('AGORA_APP_ID');

    if (!this.customerId || !this.customerCertificate) {
      this.logger.warn('Agora Customer ID or Certificate not configured. Cloud recording will not be available.');
    }
  }

  /**
   * Start cloud recording for a channel
   */
  async startRecording(
    channelName: string,
    uid: string,
    recordingConfig?: any
  ): Promise<{ resourceId: string; sid: string }> {
    if (!this.customerId || !this.customerCertificate) {
      throw new Error('Agora Customer ID and Certificate are required for cloud recording');
    }

    const acquireRequest = {
      cname: channelName,
      uid: uid,
      clientRequest: {
        resourceExpiredHour: 24,
        scene: 0, // 0: Communication, 1: Live Broadcasting
      },
    };

    try {
      // Step 1: Acquire resource
      const acquireResponse = await this.makeRecordingRequest(
        'POST',
        '/v1/apps/' + this.appId + '/cloud_recording/acquire',
        acquireRequest
      );

      const resourceId = acquireResponse.data.resourceId;
      this.logger.log(`Acquired recording resource: ${resourceId}`);

      // Step 2: Start recording
      const startRequest = {
        cname: channelName,
        uid: uid,
        clientRequest: {
          token: '', // We'll use no-auth mode for simplicity
          recordingConfig: {
            maxIdleTime: 30,
            streamTypes: 2, // 0: Audio only, 1: Video only, 2: Audio and Video
            audioProfile: 1, // 0: Sample rate 48k, 1: Sample rate 48k with high quality
            channelType: 0, // 0: Communication, 1: Live Broadcasting
            videoStreamType: 1, // 0: Low stream, 1: High stream, 2: Both streams
            subscribeVideoUids: [],
            subscribeAudioUids: [],
            subscribeUidGroup: 0,
          },
          recordingFileConfig: {
            avFileType: ['hls', 'mp4'], // Record in both HLS and MP4 formats
          },
          storageConfig: {
            vendor: 3, // 3: CloudFront (R2 compatible)
            region: 1, // 1: US East
            bucket: this.configService.get<string>('R2_BUCKET_NAME'),
            accessKey: this.configService.get<string>('R2_ACCESS_KEY_ID'),
            secretKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
            fileNamePrefix: [`recordings/${channelName}`],
            extensionParams: {
              sse: 'kms',
            },
          },
          ...recordingConfig,
        },
      };

      const startResponse = await this.makeRecordingRequest(
        'POST',
        '/v1/apps/' + this.appId + '/cloud_recording/resourceid/' + resourceId + '/mode/mix/start',
        startRequest
      );

      const sid = startResponse.data.sid;
      this.logger.log(`Started recording with SID: ${sid}`);

      return { resourceId, sid };
    } catch (error) {
      this.logger.error('Failed to start recording:', error.response?.data || error.message);
      throw new Error(`Failed to start recording: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Stop cloud recording
   */
  async stopRecording(
    resourceId: string,
    sid: string,
    channelName: string,
    uid: string
  ): Promise<any> {
    if (!this.customerId || !this.customerCertificate) {
      throw new Error('Agora Customer ID and Certificate are required for cloud recording');
    }

    const stopRequest = {
      cname: channelName,
      uid: uid,
      clientRequest: {
        async_stop: false,
      },
    };

    try {
      const response = await this.makeRecordingRequest(
        'POST',
        '/v1/apps/' + this.appId + '/cloud_recording/resourceid/' + resourceId + '/sid/' + sid + '/mode/mix/stop',
        stopRequest
      );

      this.logger.log(`Stopped recording with SID: ${sid}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to stop recording:', error.response?.data || error.message);
      throw new Error(`Failed to stop recording: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Query recording status
   */
  async queryRecordingStatus(
    resourceId: string,
    sid: string,
    channelName: string,
    uid: string
  ): Promise<any> {
    if (!this.customerId || !this.customerCertificate) {
      throw new Error('Agora Customer ID and Certificate are required for cloud recording');
    }

    try {
      const response = await this.makeRecordingRequest(
        'GET',
        '/v1/apps/' + this.appId + '/cloud_recording/resourceid/' + resourceId + '/sid/' + sid + '/mode/mix/query',
        null,
        {
          cname: channelName,
          uid: uid,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to query recording status:', error.response?.data || error.message);
      throw new Error(`Failed to query recording status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Process recording files and upload to R2
   */
  async processRecordingFiles(
    channelName: string,
    recordingData: any,
    meetingId: string
  ): Promise<{ r2RecordingKey: string; r2RecordingUrl: string }> {
    try {
      const serverResponse = recordingData.serverResponse || {};
      const fileList = serverResponse.fileList || [];
      
      if (fileList.length === 0) {
        throw new Error('No recording files found');
      }

      // Find MP4 file (preferred format)
      const mp4File = fileList.find(file => file.fileName.endsWith('.mp4'));
      const recordingFile = mp4File || fileList[0];

      const fileName = recordingFile.fileName;
      const fileUrl = recordingFile.fileName;
      
      // Generate R2 key
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const r2Key = `recordings/${channelName}/${timestamp}-${fileName}`;

      // Download file from Agora
      this.logger.log(`Downloading recording file from: ${fileUrl}`);
      const fileResponse = await axios.get(fileUrl, { responseType: 'stream' });

      // Upload to R2
      this.logger.log(`Uploading recording to R2 with key: ${r2Key}`);
      const uploadResult = await this.r2FileService.uploadStream(
        fileResponse.data,
        r2Key,
        'video/mp4'
      );

      const r2Url = await this.r2FileService.getSignedUrl(r2Key, 3600 * 24 * 7); // 7 days

      this.logger.log(`Recording uploaded successfully: ${r2Key}`);

      return {
        r2RecordingKey: r2Key,
        r2RecordingUrl: r2Url,
      };
    } catch (error) {
      this.logger.error('Failed to process recording files:', error);
      throw new Error(`Failed to process recording files: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Agora Cloud Recording API
   */
  private async makeRecordingRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    queryParams?: any
  ): Promise<any> {
    const baseUrl = 'https://api.agora.io';
    const url = baseUrl + endpoint;

    // Create authorization header
    const authString = Buffer.from(this.customerId + ':' + this.customerCertificate).toString('base64');
    const headers = {
      'Authorization': 'Basic ' + authString,
      'Content-Type': 'application/json',
    };

    const config = {
      method,
      url,
      headers,
      data: data ? JSON.stringify(data) : undefined,
      params: queryParams,
    };

    return await axios(config);
  }

  /**
   * Generate recording configuration
   */
  generateRecordingConfig(options: {
    audioOnly?: boolean;
    videoQuality?: 'low' | 'high';
    includeScreenShare?: boolean;
  } = {}): any {
    const { audioOnly = false, videoQuality = 'high', includeScreenShare = false } = options;

    return {
      recordingConfig: {
        maxIdleTime: 30,
        streamTypes: audioOnly ? 0 : 2, // 0: Audio only, 2: Audio and Video
        audioProfile: 1, // High quality audio
        channelType: 0, // Communication
        videoStreamType: videoQuality === 'high' ? 1 : 0, // High or low stream
        subscribeVideoUids: includeScreenShare ? [] : [], // Empty means subscribe all
        subscribeAudioUids: [],
        subscribeUidGroup: 0,
      },
      recordingFileConfig: {
        avFileType: ['mp4'], // MP4 format for better compatibility
      },
    };
  }
}

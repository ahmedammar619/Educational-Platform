import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { RecordingService } from '../services/recording.service';
import { ZoomApiService } from '../services/zoom-api.service';

@Controller('zoom/recording-test')
export class RecordingTestController {
  private readonly logger = new Logger(RecordingTestController.name);

  constructor(
    private recordingService: RecordingService,
    private zoomApiService: ZoomApiService
  ) {}

  @Get('status/:meetingId')
  async getRecordingStatus(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Getting recording status for meeting: ${meetingId}`);
      const status = await this.recordingService.getRecordingStatus(meetingId);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error(`Error getting recording status: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('retry/:meetingId')
  async retryRecordingProcessing(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Retrying recording processing for meeting: ${meetingId}`);
      await this.recordingService.retryRecordingProcessing(meetingId);
      return {
        success: true,
        message: 'Recording processing retry initiated',
      };
    } catch (error) {
      this.logger.error(`Error retrying recording processing: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Get('zoom-details/:meetingId')
  async getZoomRecordingDetails(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Getting Zoom recording details for meeting: ${meetingId}`);
      const details = await this.zoomApiService.getRecordingDetails(meetingId);
      return {
        success: true,
        data: details,
      };
    } catch (error) {
      this.logger.error(`Error getting Zoom recording details: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('enable-auto-recording/:meetingId')
  async enableAutoRecording(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Enabling automatic recording for meeting: ${meetingId}`);
      await this.zoomApiService.updateMeetingRecordingSettings(meetingId, true);
      return {
        success: true,
        message: 'Automatic recording enabled successfully',
      };
    } catch (error) {
      this.logger.error(`Error enabling automatic recording: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('disable-auto-recording/:meetingId')
  async disableAutoRecording(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Disabling automatic recording for meeting: ${meetingId}`);
      await this.zoomApiService.updateMeetingRecordingSettings(meetingId, false);
      return {
        success: true,
        message: 'Automatic recording disabled successfully',
      };
    } catch (error) {
      this.logger.error(`Error disabling automatic recording: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('enable-host-control/:meetingId')
  async enableHostControl(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Enabling host control for meeting: ${meetingId}`);
      await this.zoomApiService.updateMeetingHostControlSettings(meetingId);
      return {
        success: true,
        message: 'Host control enabled successfully - meeting will wait for host to end',
      };
    } catch (error) {
      this.logger.error(`Error enabling host control: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Get('test-r2-connection')
  async testR2Connection() {
    try {
      this.logger.log('Testing R2 connection...');
      
      // Import R2Service dynamically to avoid circular dependencies
      const { R2Service } = await import('../../storage/r2.service');
      const { ConfigService } = await import('@nestjs/config');
      
      const configService = new ConfigService();
      const r2Service = new R2Service(configService);
      
      // Test R2 connection by checking if we can generate a key
      const testKey = r2Service.generateRecordingKey('Test_Course', 'test-file.mp4');
      const testUrl = r2Service.getPublicUrl(testKey);
      
      return {
        success: true,
        message: 'R2 connection test successful',
        data: {
          testKey,
          testUrl,
          bucketName: configService.get('R2_BUCKET_NAME'),
          region: configService.get('R2_REGION'),
          endpoint: configService.get('R2_ENDPOINT'),
          publicUrl: configService.get('R2_PUBLIC_URL'),
        },
      };
    } catch (error) {
      this.logger.error(`Error testing R2 connection: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('check-recording-workflow/:meetingId')
  async checkRecordingWorkflow(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Checking recording workflow for meeting: ${meetingId}`);
      
      // Get meeting details
      const meetingDetails = await this.zoomApiService.getRecordingDetails(meetingId);
      
      // Check if recording files exist
      const hasRecordings = meetingDetails.recording_files && meetingDetails.recording_files.length > 0;
      
      if (!hasRecordings) {
        return {
          success: true,
          message: 'No recordings found for this meeting',
          data: {
            meetingId,
            hasRecordings: false,
            recordingFiles: [],
          },
        };
      }
      
      // Analyze recording files
      const recordingFiles = meetingDetails.recording_files.map(file => ({
        id: file.id,
        fileType: file.file_type,
        fileSize: file.file_size,
        recordingType: file.recording_type,
        downloadUrl: file.download_url,
        playUrl: file.play_url,
        status: file.status,
        recordingStart: file.recording_start,
        recordingEnd: file.recording_end,
      }));
      
      return {
        success: true,
        message: 'Recording workflow check completed',
        data: {
          meetingId,
          hasRecordings: true,
          recordingFiles,
          totalFiles: recordingFiles.length,
          totalSize: recordingFiles.reduce((sum, file) => sum + file.fileSize, 0),
          workflowStatus: 'Ready for R2 upload',
        },
      };
    } catch (error) {
      this.logger.error(`Error checking recording workflow: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('test-r2-upload/:meetingId')
  async testR2Upload(@Param('meetingId') meetingId: string) {
    try {
      this.logger.log(`Testing R2 upload for meeting: ${meetingId}`);
      
      // Get meeting details from Zoom
      const meetingDetails = await this.zoomApiService.getRecordingDetails(meetingId);
      
      if (!meetingDetails.recording_files || meetingDetails.recording_files.length === 0) {
        return {
          success: false,
          error: 'No recording files found for this meeting',
        };
      }
      
      // Find the main video recording file
      const mainRecording = meetingDetails.recording_files.find(
        file => file.recording_type === 'shared_screen_with_speaker_view' || 
                file.recording_type === 'shared_screen_with_gallery_view' ||
                file.file_type === 'MP4'
      ) || meetingDetails.recording_files[0];
      
      if (!mainRecording) {
        return {
          success: false,
          error: 'No suitable recording file found',
        };
      }
      
      // Test download from Zoom
      this.logger.log(`Testing download from Zoom: ${mainRecording.download_url}`);
      const recordingStream = await this.zoomApiService.downloadRecordingFile(mainRecording.download_url);
      
      // Import R2Service dynamically
      const { R2Service } = await import('../../storage/r2.service');
      const { ConfigService } = await import('@nestjs/config');
      
      const configService = new ConfigService();
      const r2Service = new R2Service(configService);
      
      // Generate R2 key using course name
      const fileName = `test_${meetingId}_${Date.now()}.${mainRecording.file_type.toLowerCase()}`;
      const courseName = 'Test_Course'; // For testing purposes
      const r2Key = r2Service.generateRecordingKey(courseName, fileName);
      
      // Test upload to R2
      this.logger.log(`Testing upload to R2: ${r2Key}`);
      const r2Result = await r2Service.uploadRecording(
        r2Key,
        recordingStream,
        'video/mp4',
        {
          meetingId: meetingId,
          zoomMeetingId: meetingId,
          originalFileName: fileName,
          recordingType: mainRecording.recording_type,
          fileSize: mainRecording.file_size.toString(),
          testUpload: 'true',
        }
      );
      
      return {
        success: true,
        message: 'R2 upload test successful',
        data: {
          meetingId,
          r2Key: r2Result.key,
          r2Url: r2Result.url,
          fileSize: r2Result.size,
          originalFile: {
            id: mainRecording.id,
            fileType: mainRecording.file_type,
            fileSize: mainRecording.file_size,
            recordingType: mainRecording.recording_type,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error testing R2 upload: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Get('list-recordings')
  async listRecordings() {
    try {
      this.logger.log('Listing all recordings from R2 storage');
      
      // Import R2Service dynamically
      const { R2Service } = await import('../../storage/r2.service');
      const { ConfigService } = await import('@nestjs/config');
      
      const configService = new ConfigService();
      const r2Service = new R2Service(configService);
      
      // List all recordings
      const recordings = await r2Service.listRecordings();
      
      return {
        success: true,
        message: 'Recordings listed successfully',
        data: {
          recordings: recordings.recordings,
          totalCount: recordings.totalCount,
          totalSize: recordings.totalSize,
          totalSizeFormatted: this.formatBytes(recordings.totalSize),
        },
      };
    } catch (error) {
      this.logger.error(`Error listing recordings: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Get('list-recordings/:courseName')
  async listRecordingsForCourse(@Param('courseName') courseName: string) {
    try {
      this.logger.log(`Listing recordings for course: ${courseName}`);
      
      // Import R2Service dynamically
      const { R2Service } = await import('../../storage/r2.service');
      const { ConfigService } = await import('@nestjs/config');
      
      const configService = new ConfigService();
      const r2Service = new R2Service(configService);
      
      // List recordings for specific course
      const recordings = await r2Service.listRecordings(courseName);
      
      return {
        success: true,
        message: `Recordings for course ${courseName} listed successfully`,
        data: {
          courseName,
          recordings: recordings.recordings,
          totalCount: recordings.totalCount,
          totalSize: recordings.totalSize,
          totalSizeFormatted: this.formatBytes(recordings.totalSize),
        },
      };
    } catch (error) {
      this.logger.error(`Error listing recordings for course: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Get('list-bucket-contents')
  async listBucketContents() {
    try {
      this.logger.log('Listing all bucket contents from R2 storage');
      
      // Import R2Service dynamically
      const { R2Service } = await import('../../storage/r2.service');
      const { ConfigService } = await import('@nestjs/config');
      
      const configService = new ConfigService();
      const r2Service = new R2Service(configService);
      
      // List all objects in bucket
      const bucketContents = await r2Service.listObjects();
      
      // Filter only recordings folder contents
      const recordingsObjects = bucketContents.objects.filter(obj => 
        obj.key.startsWith('recordings/')
      );
      
      return {
        success: true,
        message: 'Bucket contents listed successfully',
        data: {
          allObjects: bucketContents.objects,
          recordingsObjects: recordingsObjects,
          totalCount: bucketContents.totalCount,
          recordingsCount: recordingsObjects.length,
          hasMore: bucketContents.hasMore,
          bucketName: configService.get('R2_BUCKET_NAME'),
        },
      };
    } catch (error) {
      this.logger.error(`Error listing bucket contents: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Get('list-all-zoom-recordings')
  async listAllZoomRecordings() {
    try {
      this.logger.log('Listing all recordings from Zoom cloud storage');
      
      // Get all recordings from Zoom
      const zoomRecordings = await this.zoomApiService.getAllRecordings();
      
      // Process the recordings data
      const meetings = zoomRecordings.meetings || [];
      const totalMeetings = meetings.length;
      let totalRecordings = 0;
      let totalSize = 0;
      
      const processedMeetings = meetings.map(meeting => {
        const recordingFiles = meeting.recording_files || [];
        totalRecordings += recordingFiles.length;
        
        const meetingSize = recordingFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
        totalSize += meetingSize;
        
        return {
          meetingId: meeting.id,
          uuid: meeting.uuid,
          topic: meeting.topic,
          startTime: meeting.start_time,
          duration: meeting.duration,
          hostId: meeting.host_id,
          recordingCount: recordingFiles.length,
          recordingFiles: recordingFiles.map(file => ({
            id: file.id,
            fileType: file.file_type,
            fileSize: file.file_size,
            recordingType: file.recording_type,
            status: file.status,
            downloadUrl: file.download_url,
            playUrl: file.play_url,
            recordingStart: file.recording_start,
            recordingEnd: file.recording_end,
          })),
          totalSize: meetingSize,
        };
      });
      
      return {
        success: true,
        message: 'Zoom recordings listed successfully',
        data: {
          meetings: processedMeetings,
          totalMeetings,
          totalRecordings,
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
          from: zoomRecordings.from,
          to: zoomRecordings.to,
          pageCount: zoomRecordings.page_count,
          pageSize: zoomRecordings.page_size,
        },
      };
    } catch (error) {
      this.logger.error(`Error listing Zoom recordings: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

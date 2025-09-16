import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    this.region = this.configService.get<string>('R2_REGION');

    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('R2_ENDPOINT');

    if (!this.bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
      this.logger.error('R2 credentials are not properly configured');
      throw new Error('R2 credentials are missing from environment variables');
    }

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Upload a recording file to R2 storage
   * @param key - The key/path for the file in R2
   * @param fileStream - The file stream to upload
   * @param contentType - The MIME type of the file
   * @param metadata - Optional metadata for the file
   */
  async uploadRecording(
    key: string,
    fileStream: Readable,
    contentType: string = 'video/mp4',
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string; size: number }> {
    try {
      this.logger.log(`Uploading recording to R2: ${key}`);

      const chunks: Buffer[] = [];
      let totalSize = 0;

      // Collect all chunks to calculate size
      for await (const chunk of fileStream) {
        chunks.push(chunk);
        totalSize += chunk.length;
      }

      // Create a new readable stream from the chunks
      const uploadStream = Readable.from(Buffer.concat(chunks));

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: uploadStream,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const url = `${this.publicUrl}/${key}`;
      
      this.logger.log(`Successfully uploaded recording to R2: ${key} (${totalSize} bytes)`);
      
      return {
        key,
        url,
        size: totalSize,
      };
    } catch (error) {
      this.logger.error(`Error uploading recording to R2: ${error.message}`, error.stack);
      throw new Error(`Failed to upload recording to R2: ${error.message}`);
    }
  }

  /**
   * Download a recording file from R2 storage
   * @param key - The key/path of the file in R2
   * @returns A readable stream of the file
   */
  async downloadRecording(key: string): Promise<Readable> {
    try {
      this.logger.log(`Downloading recording from R2: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file body received from R2');
      }

      this.logger.log(`Successfully downloaded recording from R2: ${key}`);
      
      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Error downloading recording from R2: ${error.message}`, error.stack);
      throw new Error(`Failed to download recording from R2: ${error.message}`);
    }
  }

  /**
   * Delete a recording file from R2 storage
   * @param key - The key/path of the file in R2
   */
  async deleteRecording(key: string): Promise<void> {
    try {
      this.logger.log(`Deleting recording from R2: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      
      this.logger.log(`Successfully deleted recording from R2: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting recording from R2: ${error.message}`, error.stack);
      throw new Error(`Failed to delete recording from R2: ${error.message}`);
    }
  }

  /**
   * Generate a unique key for a recording file
   * @param meetingId - The Zoom meeting ID
   * @param fileName - The original file name
   * @returns A unique key for the recording
   */
  generateRecordingKey(meetingId: string, fileName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = fileName.split('.').pop() || 'mp4';
    return `recordings/${meetingId}/${timestamp}.${extension}`;
  }

  /**
   * Get the public URL for a recording file
   * @param key - The key/path of the file in R2
   * @returns The public URL for the file
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Stream a file from R2 to another destination (e.g., YouTube)
   * @param key - The key/path of the file in R2
   * @returns A readable stream of the file
   */
  async streamRecording(key: string): Promise<Readable> {
    return this.downloadRecording(key);
  }
}

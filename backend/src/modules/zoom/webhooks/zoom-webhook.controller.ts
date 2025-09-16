import { Controller, Post, Body, Headers, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { ZoomWebhookService } from './zoom-webhook.service';

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

@Controller('webhooks/zoom')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);

  constructor(private readonly zoomWebhookService: ZoomWebhookService) {}

  @Public()
  @Post('events')
  async handleWebhookEvent(
    @Body() body: ZoomWebhookEvent,
    @Headers() headers: Record<string, string>
  ): Promise<{ status: string; message: string }> {
    try {
      this.logger.log(`Received Zoom webhook event: ${body.event}`);
      this.logger.log(`Headers received: ${JSON.stringify(headers)}`);
      this.logger.log(`Body received: ${JSON.stringify(body)}`);
      this.logger.log(`Body type: ${typeof body}`);

      // Get signature from headers
      const signature = headers['authorization'] || headers['x-zoom-signature'];
      this.logger.log(`Signature from headers: ${signature}`);

      // Verify webhook signature for security
      const isValidSignature = await this.zoomWebhookService.verifyWebhookSignature(
        body,
        signature
      );

      if (!isValidSignature) {
        this.logger.warn('Invalid webhook signature received');
        throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
      }

      // Handle the webhook event
      await this.zoomWebhookService.handleWebhookEvent(body);

      this.logger.log(`Successfully processed webhook event: ${body.event}`);

      return {
        status: 'success',
        message: 'Webhook event processed successfully',
      };
    } catch (error) {
      this.logger.error(`Error processing webhook event: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error processing webhook',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public()
  @Post('validation')
  async validateWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Validating Zoom webhook endpoint');

      // Zoom sends a validation request when setting up webhooks
      const validationToken = headers['x-zoom-validation-token'];
      
      if (validationToken) {
        this.logger.log('Webhook validation successful');
        return { status: 'validated' };
      }

      throw new HttpException('Invalid validation request', HttpStatus.BAD_REQUEST);
    } catch (error) {
      this.logger.error(`Error validating webhook: ${error.message}`, error.stack);
      throw new HttpException('Webhook validation failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Post('debug')
  async debugWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>
  ): Promise<{ status: string; debug: any }> {
    try {
      const signature = headers['authorization'] || headers['x-zoom-signature'];
      const webhookSecret = this.zoomWebhookService['webhookSecret'];
      
      return {
        status: 'debug',
        debug: {
          webhookSecret: webhookSecret,
          signature: signature,
          headers: headers,
          body: body
        }
      };
    } catch (error) {
      this.logger.error(`Error in debug endpoint: ${error.message}`, error.stack);
      throw new HttpException('Debug failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

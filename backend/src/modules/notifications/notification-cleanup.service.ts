import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationCleanupService {
  private readonly logger = new Logger(NotificationCleanupService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Run cleanup every day at 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleNotificationCleanup() {
    this.logger.log('Starting scheduled notification cleanup...');
    await this.notificationsService.automaticCleanup();
  }

  // Alternative: Run cleanup every 6 hours
  // @Cron('0 */6 * * *')
  // async handleNotificationCleanup() {
  //   this.logger.log('Starting scheduled notification cleanup (every 6 hours)...');
  //   await this.notificationsService.automaticCleanup();
  // }

  // Manual cleanup method for testing
  async manualCleanup(): Promise<void> {
    this.logger.log('Starting manual notification cleanup...');
    await this.notificationsService.automaticCleanup();
  }
}

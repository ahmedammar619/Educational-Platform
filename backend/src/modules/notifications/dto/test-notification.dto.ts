import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class TestNotificationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsOptional()
  message?: string;
}

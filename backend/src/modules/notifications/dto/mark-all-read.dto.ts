import { IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class MarkAllReadDto {
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

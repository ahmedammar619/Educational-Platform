import { IsString, IsIn, Matches } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsIn(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
  day: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string; // Format: '10:00', '14:30', etc.

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string; // Format: '11:30', '15:30', etc.
}

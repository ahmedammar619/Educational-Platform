import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddChildDto {
  @ApiProperty({ description: 'Student ID to add as child' })
  @IsUUID()
  studentId: string;
}

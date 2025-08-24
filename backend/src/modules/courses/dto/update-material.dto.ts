import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMaterialDto {
  @ApiProperty({ description: 'Material title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Material description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Material type', required: false })
  @IsOptional()
  @IsString()
  type?: 'post' | 'assignment' | 'announcement' | 'resource';

  @ApiProperty({ description: 'Material content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Publish date', required: false })
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiProperty({ description: 'Due date for assignments', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ description: 'Maximum score for assignments', required: false })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiProperty({ description: 'Whether submissions are allowed', required: false })
  @IsOptional()
  @IsBoolean()
  allowSubmissions?: boolean;

  @ApiProperty({ description: 'Whether comments are allowed', required: false })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiProperty({ description: 'Whether material is pinned', required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ description: 'Material metadata', required: false })
  @IsOptional()
  @IsArray()
  metadata?: {
    tags?: string[];
    difficulty?: string;
    estimatedTime?: number;
    prerequisites?: string[];
  };
}

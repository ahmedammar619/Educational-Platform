import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ description: 'Material title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Material description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Material type', enum: ['post', 'assignment', 'announcement', 'resource'] })
  @IsEnum(['post', 'assignment', 'announcement', 'resource'])
  type: 'post' | 'assignment' | 'announcement' | 'resource';

  @ApiProperty({ description: 'Material content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether material is published', required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ description: 'Due date for assignments (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ description: 'Maximum score for assignments', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxScore?: number;

  @ApiProperty({ description: 'Whether to allow submissions', required: false })
  @IsOptional()
  @IsBoolean()
  allowSubmissions?: boolean;

  @ApiProperty({ description: 'Whether to allow comments', required: false })
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

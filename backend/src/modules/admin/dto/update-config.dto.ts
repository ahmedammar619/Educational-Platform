import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiProperty({ description: 'Configuration key', required: true })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Configuration value', required: true })
  @IsString()
  value: string;

  @ApiProperty({ description: 'Configuration description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGoogleFormUrlDto {
  @ApiProperty({ description: 'Google Form URL for student registration', required: true })
  @IsUrl()
  url: string;
}

import { IsString, IsNotEmpty, Length, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentFileNames?: string[];
}

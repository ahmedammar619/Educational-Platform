import { IsOptional, IsUUID } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;
}

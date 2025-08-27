import { IsString, IsNotEmpty, Length, IsOptional, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsUUID()
  parentFolderId?: string;
}

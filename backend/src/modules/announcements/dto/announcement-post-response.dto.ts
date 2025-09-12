import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementPostAttachmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  uploadedAt: Date;
}

export class AnnouncementPostAuthorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  role: string;
}

export class AnnouncementPostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: AnnouncementPostAuthorResponseDto })
  author: AnnouncementPostAuthorResponseDto;

  @ApiProperty({ type: [AnnouncementPostAttachmentResponseDto] })
  attachments: AnnouncementPostAttachmentResponseDto[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AnnouncementPost } from './announcement-post.entity';

@Entity('announcement_post_attachments')
export class AnnouncementPostAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'postId', type: 'uuid' })
  postId: string;

  @Column({ name: 'fileName', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'filePath', type: 'varchar', length: 500 })
  filePath: string;

  @Column({ name: 'fileSize', type: 'int' })
  fileSize: number;

  @Column({ name: 'mimeType', type: 'varchar', length: 100 })
  mimeType: string;

  @CreateDateColumn({ name: 'uploadedAt' })
  uploadedAt: Date;

  // Relationships
  @ManyToOne(() => AnnouncementPost, 'attachments')
  @JoinColumn({ name: 'postId' })
  post: AnnouncementPost;
}

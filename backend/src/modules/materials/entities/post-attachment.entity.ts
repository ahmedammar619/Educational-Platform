import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('post_attachments')
export class PostAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relationships
  @ManyToOne('Post', 'attachments')
  @JoinColumn({ name: 'postId' })
  post: any;
}

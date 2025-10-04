import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AnnouncementPostAttachment } from './announcement-post-attachment.entity';

@Entity('announcement_posts')
export class AnnouncementPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  authorId: string;

  @Column({ length: 255 })
  subject: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  creatorTimezone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User | null;

  @OneToMany(() => AnnouncementPostAttachment, 'post')
  attachments: AnnouncementPostAttachment[];
}

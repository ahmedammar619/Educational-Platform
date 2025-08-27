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
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid')
  authorId: string;

  @Column({ length: 255 })
  subject: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('Course', 'posts')
  @JoinColumn({ name: 'courseId' })
  course: any;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany('PostAttachment', 'post')
  attachments: any[];
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('zoom_meetings')
export class ZoomMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  invitationLink: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  zoomMeetingId: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zoomPassword: string;

  @Column({ type: 'text', nullable: true })
  zoomStartUrl: string;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  time: string;

  @Column({ type: 'varchar', length: 2, default: 'AM' })
  period: string;

  @Column({ type: 'int', default: 0 })
  joinCount: number;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  recordingStatus: string;

  @Column({ type: 'text', nullable: true })
  recordingUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  youtubeVideoId: string;

  @Column({ type: 'text', nullable: true })
  youtubeUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  recordingCompletedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  r2RecordingKey: string;

  @Column({ type: 'text', nullable: true })
  r2RecordingUrl: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('agora_meetings')
export class AgoraMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  channelName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  agoraMeetingId: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  agoraPassword: string;

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

  @Column({ type: 'varchar', length: 500, nullable: true })
  r2RecordingKey: string;

  @Column({ type: 'text', nullable: true })
  r2RecordingUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  recordingCompletedAt: Date;

  @Column({ type: 'json', nullable: true })
  recordingConfig: any;

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

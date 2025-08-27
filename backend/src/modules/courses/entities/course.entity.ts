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
import { Class } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('uuid')
  teacherId: string;

  @Column('uuid')
  classId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('Class', 'courses')
  @JoinColumn({ name: 'classId' })
  class: any;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @OneToMany('CourseSession', 'course')
  sessions: any[];

  @OneToMany('Post', 'course')
  posts: any[];

  @OneToMany('Folder', 'course')
  folders: any[];

  @OneToMany('File', 'course')
  files: any[];

  @OneToMany('Assignment', 'course')
  assignments: any[];

  @OneToMany('Attendance', 'course')
  attendance: any[];
}

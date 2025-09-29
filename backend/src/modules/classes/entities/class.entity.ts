import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  courseIds: string[];

  @Column('uuid', { nullable: true })
  programId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany('Course', 'class')
  courses: any[];

  @ManyToOne(() => Program, program => program.classes, { nullable: true })
  @JoinColumn({ name: 'programId' })
  program: Program | null;

  // Note: students are now tracked in individual course.students arrays
  // Class-level enrollment adds students to all course.students arrays
}

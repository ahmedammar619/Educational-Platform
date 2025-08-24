import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseSession } from './course-session.entity';
import { CourseMaterial } from './course-material.entity';

@Entity('session_materials')
export class SessionMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  notes: string; // Additional notes for this material in this session

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => CourseSession, (session) => session.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: CourseSession;

  @Column()
  sessionId: string; // Changed to string to match CourseSession UUID

  @ManyToOne(() => CourseMaterial, (material) => material.sessionMaterials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materialId' })
  material: CourseMaterial;

  @Column()
  materialId: string; // Changed to string to match CourseMaterial UUID
}

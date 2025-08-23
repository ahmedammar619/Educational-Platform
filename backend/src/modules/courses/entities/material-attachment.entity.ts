import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseMaterial } from './course-material.entity';
import { CourseFile } from './course-file.entity';

@Entity('material_attachments')
export class MaterialAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  description: string; // Description of this attachment

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => CourseMaterial, (material) => material.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materialId' })
  material: CourseMaterial;

  @Column()
  materialId: number;

  @ManyToOne(() => CourseFile, (file) => file.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: CourseFile;

  @Column()
  fileId: number;
}

import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('parents')
export class Parent {
  @PrimaryColumn('uuid')
  id: string;

  // Only additional field: student IDs array
  @Column({ type: 'text', array: true, default: [] })
  studentIds: string[];

  // One-to-one relationship with User (no embedded object)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  // One-to-many relationship with Students
  @OneToMany(() => Student, student => student.parent)
  students: Student[];
}

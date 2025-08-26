import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryColumn('uuid')
  id: string;

  // Only additional field: subjects array
  @Column({ type: 'text', array: true, default: [] })
  subjects: string[];

  // One-to-one relationship with User
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;
}

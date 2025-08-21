import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';
import { Parent } from '../../parents/entities/parent.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  firstName: string;

  @Column({ length: 255 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 255, nullable: true })
  username?: string; // Only for students

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Student,
  })
  role: Role;

  @Column({ nullable: true, length: 20 })
  phone?: string; // For parents and teachers

  @Column({ type: 'date', nullable: true })
  birthDate?: Date; // Only for students

  @Column({ default: true })
  isActive: boolean;

  // ================= Security Fields =================
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  // Parent/Child Relations
  @OneToMany(() => Parent, (p) => p.parent)
  children: Parent[]; // if this user is a parent, these are their children

  @OneToMany(() => Parent, (p) => p.child)
  parents: Parent[]; // if this user is a child, these are their parents
}

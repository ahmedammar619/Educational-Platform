import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  firstName: string;

  @Column({ length: 255 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Parent,
  })
  role: Role;

  @Column({ nullable: true, length: 255 })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry?: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Parent-specific fields
  @Column({ type: 'text', array: true, default: [] })
  childrenIds: string[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

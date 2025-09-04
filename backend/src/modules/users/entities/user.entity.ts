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

@Entity('users')
export class User {
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
    default: Role.Teacher,
  })
  role: Role;

  @Column({ nullable: true, length: 255 })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry?: Date;

  @Column({ nullable: true, length: 64 })
  stripe_customer_id?: string;

  @CreateDateColumn()
  createdAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Role-specific relationships - these are managed by the respective services
  // No duplicate fields here - they belong in the role-specific entities
}

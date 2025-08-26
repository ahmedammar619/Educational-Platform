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

  @CreateDateColumn()
  createdAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Parent-Student relationship
  @Column({ nullable: true })
  parentId?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @ManyToMany(() => User, user => user.children)
  @JoinTable({
    name: 'parent_children',
    joinColumn: {
      name: 'parentId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'childId',
      referencedColumnName: 'id',
    },
  })
  children?: User[];

  @ManyToMany(() => User, user => user.children)
  parents?: User[];
}

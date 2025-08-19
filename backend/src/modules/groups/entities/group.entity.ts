import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupStudent } from './group_student.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => User, (user) => user.groups, { nullable: false, onDelete: 'RESTRICT' })
  teacher: User;

  // Use "groupStudents" and match inverse side in GroupStudent
  @OneToMany(() => GroupStudent, (gs) => gs.group, { cascade: true })
  groupStudents: GroupStudent[];
}

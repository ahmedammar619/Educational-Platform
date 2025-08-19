import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

@Entity('group_students')
export class GroupStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.groupMemberships, { onDelete: 'CASCADE' })
  student: User;

  @ManyToOne(() => Group, (group) => group.groupStudents, { onDelete: 'CASCADE' })
  group: Group;
}

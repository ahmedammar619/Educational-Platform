import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('parent_children')
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  parentId: string;

  @ManyToOne(() => User, (user) => user.parents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: User;

  @Column()
  childId: string;
}

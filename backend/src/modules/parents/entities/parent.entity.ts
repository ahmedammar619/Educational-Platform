import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  parentId: number;

  @ManyToOne(() => User, (user) => user.parents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: User;

  @Column()
  childId: number;

  @Column({ nullable: true })
  childAge?: number;

  @Column({ nullable: true })
  paymentInfo?: string;
}

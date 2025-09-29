import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Class } from '../../classes/entities/class.entity';
import { Subscription } from '../../payments/entities/subscription.entity';

@Entity('students')
export class Student {
  @PrimaryColumn('uuid')
  id: string;

  // Student-specific fields
  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ nullable: true })
  classId?: string;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  courseIds: string[];

  @Column({ type: 'simple-array', nullable: true, default: '' })
  programIds: string[];

  // One-to-one relationship with User (no embedded object)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  // Many-to-one relationship with Parent (User with role Parent)
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  // Many-to-one relationship with Class
  @ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  // One-to-many relationship with Subscriptions
  @OneToMany(() => Subscription, subscription => subscription.student)
  subscriptions: Subscription[];

  // Subscription status fields
  @Column({ name: 'subscription_status', type: 'varchar', length: 50, default: 'inactive' })
  subscriptionStatus: string; // active, inactive, past_due, canceled

  @Column({ name: 'subscription_end_date', type: 'timestamp', nullable: true })
  subscriptionEndDate?: Date;

  // Form completion tracking
  @Column({ name: 'registration_form_completed', type: 'boolean', default: false })
  registrationFormCompleted: boolean;

  @Column({ name: 'form_completion_date', type: 'timestamp', nullable: true })
  formCompletionDate?: Date;

  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

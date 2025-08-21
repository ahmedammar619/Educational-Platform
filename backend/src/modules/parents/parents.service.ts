import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { ParentSignupDto } from './dto/parent-signup.dto';
import { AddChildDto } from './dto/add-child.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent) private readonly parentRepo: Repository<Parent>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  // Parent signup
  async signupParent(dto: ParentSignupDto) {
    return this.authService.register({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      role: Role.Parent,
    } as any);
  }

  // Parent creates a new student account for their child
  async createChildAccount(parentUserId: number, dto: AddChildDto): Promise<{ user: User; parent: Parent }> {
    const parentUser = await this.userRepo.findOne({ where: { id: parentUserId } });
    if (!parentUser || parentUser.role !== Role.Parent) {
      throw new ForbiddenException('Only parents can create child accounts.');
    }

    // Check if username already exists
    const existingUsername = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('Username already exists.');
    }

    // Check if email already exists
    const existingEmail = await this.userRepo.findOne({ where: { email: dto.username + '@student.local' } });
    if (existingEmail) {
      throw new ConflictException('Email already exists.');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Create student user
    const studentUser = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.username + '@student.local', // Generate email from username
      username: dto.username,
      passwordHash,
      role: Role.Student,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
    });

    const savedStudent = await this.userRepo.save(studentUser);

    // Create parent-child relationship
    const parentRecord = this.parentRepo.create({
      parent: parentUser,
      child: savedStudent,
    });

    const savedParentRecord = await this.parentRepo.save(parentRecord);

    return {
      user: savedStudent,
      parent: savedParentRecord,
    };
  }

  // Get all children of the logged-in parent
  async getMyChildren(parentUserId: number): Promise<User[]> {
    const parentRecords = await this.parentRepo.find({
      where: { parent: { id: parentUserId } },
      relations: ['child'],
      order: { id: 'ASC' },
    });

    return parentRecords.map(record => record.child);
  }

  // Remove child from parent (delete student account)
  async removeChild(parentUserId: number, childId: number): Promise<{ message: string }> {
    const parentRecord = await this.parentRepo.findOne({
      where: { parent: { id: parentUserId }, child: { id: childId } },
      relations: ['parent', 'child'],
    });

    if (!parentRecord) {
      throw new NotFoundException('Parent-child relationship not found.');
    }

    // Delete the parent-child relationship
    await this.parentRepo.remove(parentRecord);

    // Delete the child user account
    await this.userRepo.remove(parentRecord.child);

    return { message: 'Child account removed successfully' };
  }
}

import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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
  async createChildAccount(parentUserId: string, dto: AddChildDto): Promise<{ user: User; parent: Parent }> {
    // Check if parent user exists and is actually a parent
    const parentUser = await this.userRepo.findOne({
      where: { id: parentUserId, role: Role.Parent },
    });

    if (!parentUser) {
      throw new BadRequestException('Parent user not found or user is not a parent');
    }

    // Check if child username already exists
    const existingChild = await this.userRepo.findOne({
      where: { username: dto.username },
    });

    if (existingChild) {
      throw new ConflictException('A user with this username already exists');
    }

    // Create child user account
    const childUser = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.username + '@student.local', // Generate email from username
      username: dto.username,
      passwordHash: await bcrypt.hash(dto.password, 12),
      role: Role.Student,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
    });

    const savedChildUser = await this.userRepo.save(childUser);

    // Create parent-child relationship
    const parentRelation = this.parentRepo.create({
      parentId: parentUserId,
      childId: savedChildUser.id,
    });

    const savedParentRelation = await this.parentRepo.save(parentRelation);

    return {
      user: savedChildUser,
      parent: savedParentRelation,
    };
  }

  // Get all children of the logged-in parent
  async getMyChildren(parentUserId: string): Promise<User[]> {
    const children = await this.parentRepo.find({
      where: { parentId: parentUserId },
      relations: ['child'],
    });

    return children.map(relation => relation.child);
  }

  // Remove child from parent (delete student account)
  async removeChild(parentUserId: string, childId: string): Promise<{ message: string }> {
    const relation = await this.parentRepo.findOne({
      where: { parentId: parentUserId, childId },
    });

    if (!relation) {
      throw new NotFoundException('Child relationship not found');
    }

    await this.parentRepo.remove(relation);
    return { message: 'Child removed successfully' };
  }

  // Get child progress
  async getChildProgress(parentUserId: string, childId: string) {
    // Verify the parent-child relationship
    const relation = await this.parentRepo.findOne({
      where: { parentId: parentUserId, childId },
    });

    if (!relation) {
      throw new ForbiddenException('Access denied: Child not found in your family');
    }

    // For now, return empty progress data structure
    // This should be populated with actual database queries for courses, grades, attendance
    return {
      courses: [],
      recentGrades: [],
      attendanceSummary: []
    };
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { AddChildDto } from './dto/add-child.dto';
import { CreateChildAccountDto } from './dto/create-child-account.dto';
import { Role } from '../../common/enums/role.enum';
import { StudentsService } from '../students/students.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly studentsService: StudentsService,
  ) {}

  async createParent(createParentDto: CreateParentDto): Promise<Parent> {
    const { email, password, firstName, lastName, phone, ...rest } = createParentDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user first
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: Role.Parent,
      phone,
    });

    const savedUser = await this.userRepository.save(user);

    // Create parent record with the same ID
    const parent = this.parentRepository.create({
      id: savedUser.id,
      studentIds: [], // Start with empty array
    });

    return this.parentRepository.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  async findByEmail(email: string): Promise<Parent> {
    const user = await this.userRepository.findOne({
      where: { email, role: Role.Parent },
    });

    if (!user) {
      return null;
    }

    return this.parentRepository.findOne({
      where: { id: user.id },
      relations: ['user'],
    });
  }

  async updateParent(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.findOne(id);

    if (updateParentDto.password) {
      const passwordHash = await bcrypt.hash(updateParentDto.password, 10);
      await this.userRepository.update(id, { passwordHash });
      delete updateParentDto.password;
    }

    // Update user fields if provided
    const userFields = ['firstName', 'lastName', 'email'];
    const userUpdateData = {};
    const parentUpdateData = {};

    Object.keys(updateParentDto).forEach(key => {
      if (userFields.includes(key)) {
        userUpdateData[key] = updateParentDto[key];
      } else {
        parentUpdateData[key] = updateParentDto[key];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      await this.userRepository.update(id, userUpdateData);
    }

    if (Object.keys(parentUpdateData).length > 0) {
      await this.parentRepository.update(id, parentUpdateData);
    }

    return this.findOne(id);
  }

  async deleteParent(id: string): Promise<void> {
    const parent = await this.findOne(id);
    // Delete parent record first (this will cascade to user due to the relationship)
    await this.parentRepository.remove(parent);
  }

  async addChild(parentId: string, addChildDto: AddChildDto): Promise<Parent> {
    const parent = await this.findOne(parentId);
    const { studentId } = addChildDto;

    // Add child to parent_children table through the relationship
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Add student ID to parent's studentIds array
    if (!parent.studentIds.includes(studentId)) {
      parent.studentIds.push(studentId);
      return this.parentRepository.save(parent);
    }

    return parent;
  }

  async removeChild(parentId: string, studentId: string): Promise<Parent> {
    const parent = await this.findOne(parentId);
    
    // Remove student ID from parent's studentIds array
    parent.studentIds = parent.studentIds.filter(id => id !== studentId);
    return this.parentRepository.save(parent);
  }

  async getChildren(parentId: string): Promise<any[]> {
    const parent = await this.findOne(parentId);
    
    if (parent.studentIds && parent.studentIds.length > 0) {
      // Fetch student details for each student ID using modern TypeORM syntax
      const students = await this.userRepository.find({
        where: parent.studentIds.map(id => ({ id })),
        select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
      });
      return students;
    }
    
    return [];
  }

  async createChildAccount(parentId: string, createChildAccountDto: CreateChildAccountDto): Promise<any> {
    // Verify parent exists
    const parent = await this.findOne(parentId);
    
    // Create the student account
    const student = await this.studentsService.createStudent({
      ...createChildAccountDto,
      parentId: parentId,
    });
    
    // Fetch the student with user data loaded
    const studentWithUser = await this.studentsService.findOne(student.id);
    
    // Add student to parent's studentIds array
    if (!parent.studentIds.includes(student.id)) {
      parent.studentIds.push(student.id);
      await this.parentRepository.save(parent);
    }
    
    return {
      message: 'Child account created successfully',
      student: {
        id: studentWithUser.id,
        firstName: studentWithUser.user.firstName,
        lastName: studentWithUser.user.lastName,
        email: studentWithUser.user.email,
        birthDate: studentWithUser.birthDate,
        parentId: studentWithUser.parentId,
      },
      parent: {
        id: parent.id,
        name: `${parent.user.firstName} ${parent.user.lastName}`,
      }
    };
  }
}

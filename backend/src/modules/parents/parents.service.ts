import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
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
    private readonly studentsService: StudentsService,
  ) {}

  async createParent(createParentDto: CreateParentDto): Promise<Parent> {
    const { email, password, ...rest } = createParentDto;

    // Check if parent already exists
    const existingParent = await this.parentRepository.findOne({
      where: { email },
    });

    if (existingParent) {
      throw new ConflictException('Parent with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create parent
    const parent = this.parentRepository.create({
      ...rest,
      email,
      passwordHash,
      role: Role.Parent,
      childrenIds: [],
    });

    return this.parentRepository.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt', 'childrenIds'],
    });
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt', 'childrenIds'],
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  async findByEmail(email: string): Promise<Parent> {
    return this.parentRepository.findOne({
      where: { email },
    });
  }

  async updateParent(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.findOne(id);

    if (updateParentDto.password) {
      const passwordHash = await bcrypt.hash(updateParentDto.password, 10);
      Object.assign(parent, { passwordHash });
      delete updateParentDto.password;
    }

    Object.assign(parent, updateParentDto);
    return this.parentRepository.save(parent);
  }

  async deleteParent(id: string): Promise<void> {
    const parent = await this.findOne(id);
    await this.parentRepository.remove(parent);
  }

  async addChild(parentId: string, addChildDto: AddChildDto): Promise<Parent> {
    const parent = await this.findOne(parentId);
    const { studentId } = addChildDto;

    if (!parent.childrenIds.includes(studentId)) {
      parent.childrenIds.push(studentId);
      return this.parentRepository.save(parent);
    }

    return parent;
  }

  async removeChild(parentId: string, studentId: string): Promise<Parent> {
    const parent = await this.findOne(parentId);
    
    parent.childrenIds = parent.childrenIds.filter(id => id !== studentId);
    return this.parentRepository.save(parent);
  }

  async getChildren(parentId: string): Promise<string[]> {
    const parent = await this.findOne(parentId);
    return parent.childrenIds;
  }

  async createChildAccount(parentId: string, createChildAccountDto: CreateChildAccountDto): Promise<any> {
    // Verify parent exists
    const parent = await this.findOne(parentId);
    
    // Create the student account
    const student = await this.studentsService.createStudent({
      ...createChildAccountDto,
      parentId: parentId,
    });
    
    // Add student to parent's children array
    await this.addChild(parentId, { studentId: student.id });
    
    return {
      message: 'Child account created successfully',
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        birthDate: student.birthDate,
        parentId: student.parentId,
      },
      parent: {
        id: parent.id,
        name: parent.fullName,
      }
    };
  }
}

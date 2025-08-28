import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Parent } from '../parents/entities/parent.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
  ) {}

  async createStudent(createStudentDto: CreateStudentDto): Promise<Student> {
    const { email, password, firstName, lastName, birthDate, parentId, ...rest } = createStudentDto;

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
      role: Role.Student,
    });

    const savedUser = await this.userRepository.save(user);

    // Create student record with the same ID
    const student = this.studentRepository.create({
      id: savedUser.id,
      birthDate: new Date(birthDate),
      parentId,
      ...rest,
    });

    return this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByEmail(email: string): Promise<Student> {
    const user = await this.userRepository.findOne({
      where: { email, role: Role.Student },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt']
    });

    if (!user) {
      return null;
    }

    return this.studentRepository.findOne({
      where: { id: user.id },
      relations: ['user'],
      select: {
        id: true,
        birthDate: true,
        parentId: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        }
      }
    });
  }

  async findByParentId(parentId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { parentId },
      relations: ['user'],
    });
  }

  async updateStudent(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    if (updateStudentDto.password) {
      const passwordHash = await bcrypt.hash(updateStudentDto.password, 10);
      await this.userRepository.update(id, { passwordHash });
      delete updateStudentDto.password;
    }

    // Update user fields if provided
    const userFields = ['firstName', 'lastName', 'email'];
    const userUpdateData = {};
    const studentUpdateData = {};

    Object.keys(updateStudentDto).forEach(key => {
      if (userFields.includes(key)) {
        userUpdateData[key] = updateStudentDto[key];
      } else {
        studentUpdateData[key] = updateStudentDto[key];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      await this.userRepository.update(id, userUpdateData);
    }

    if (Object.keys(studentUpdateData).length > 0) {
      // Handle birthDate conversion if it exists
      if ('birthDate' in studentUpdateData && studentUpdateData.birthDate) {
        const birthDateValue = studentUpdateData.birthDate as string | Date;
        studentUpdateData.birthDate = new Date(birthDateValue);
      }
      await this.studentRepository.update(id, studentUpdateData);
    }

    return this.findOne(id);
  }

  async deleteStudent(id: string): Promise<void> {
    const student = await this.findOne(id);
    
    // Check if student has a parent and remove from parent's children array
    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId }
      });
      
      if (parent && parent.studentIds) {
        // Remove the student ID from parent's studentIds array
        parent.studentIds = parent.studentIds.filter(studentId => studentId !== id);
        await this.parentRepository.save(parent);
      }
    }
    
    // Delete student record first (this will cascade to user due to the relationship)
    await this.studentRepository.delete(id);
  }

  // Method to safely remove a student from all parent relationships
  async removeFromAllParents(studentId: string): Promise<void> {
    const student = await this.findOne(studentId);
    
    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId }
      });
      
      if (parent && parent.studentIds) {
        parent.studentIds = parent.studentIds.filter(id => id !== studentId);
        await this.parentRepository.save(parent);
      }
      
      // Also update the student record
      student.parentId = null;
      await this.studentRepository.save(student);
    }
  }

  async linkToParent(studentId: string, parentId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    
    if (student.parentId) {
      throw new ConflictException('Student already has a parent');
    }

    student.parentId = parentId;
    return this.studentRepository.save(student);
  }

  async unlinkFromParent(studentId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    
    if (!student.parentId) {
      throw new ConflictException('Student does not have a parent');
    }

    // Remove student ID from parent's studentIds array
    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId }
      });
      
      if (parent && parent.studentIds) {
        parent.studentIds = parent.studentIds.filter(id => id !== studentId);
        await this.parentRepository.save(parent);
      }
    }

    student.parentId = null;
    return this.studentRepository.save(student);
  }

  // Method to create a student record from an existing user
  async createStudentFromUser(userId: string, birthDate: string, phone?: string): Promise<Student> {
    // Check if student record already exists
    const existingStudent = await this.studentRepository.findOne({
      where: { id: userId }
    });

    if (existingStudent) {
      throw new ConflictException('Student record already exists for this user');
    }

    // Create student record with the existing user ID
    const student = this.studentRepository.create({
      id: userId,
      birthDate: new Date(birthDate),
      parentId: null, // Students created from signup have no parent initially
    });

    return this.studentRepository.save(student);
  }
}

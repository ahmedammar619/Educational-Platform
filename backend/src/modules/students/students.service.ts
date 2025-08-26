import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async createStudent(createStudentDto: CreateStudentDto): Promise<Student> {
    const { email, password, birthDate, parentId, ...rest } = createStudentDto;

    // Check if student already exists
    const existingStudent = await this.studentRepository.findOne({
      where: { email },
    });

    if (existingStudent) {
      throw new ConflictException('Student with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create student
    const student = this.studentRepository.create({
      ...rest,
      email,
      passwordHash,
      role: Role.Student,
      birthDate: new Date(birthDate),
      parentId,
      // Phone number is optional - can be null when created by parent
      phone: rest.phone || null,
    });

    return this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'birthDate', 'parentId', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'birthDate', 'parentId', 'createdAt'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByEmail(email: string): Promise<Student> {
    return this.studentRepository.findOne({
      where: { email },
    });
  }

  async findByParentId(parentId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { parentId },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'birthDate', 'parentId', 'createdAt'],
    });
  }

  async updateStudent(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    if (updateStudentDto.password) {
      const passwordHash = await bcrypt.hash(updateStudentDto.password, 10);
      Object.assign(student, { passwordHash });
      delete updateStudentDto.password;
    }

    if (updateStudentDto.birthDate) {
      const birthDate = new Date(updateStudentDto.birthDate);
      Object.assign(student, { birthDate });
      delete updateStudentDto.birthDate;
    }

    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async deleteStudent(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
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

    student.parentId = null;
    return this.studentRepository.save(student);
  }
}

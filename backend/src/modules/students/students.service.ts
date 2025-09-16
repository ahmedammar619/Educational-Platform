import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { AssignmentSubmission } from '../materials/entities/assignment-submission.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { Invoice } from '../payments/entities/invoice.entity';
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
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
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
    
    // Clean up all related data before deleting the student
    
    // 1. Delete assignment submissions
    await this.assignmentSubmissionRepository.delete({ studentId: id });
    
    // 2. Delete attendance records
    await this.attendanceRepository.delete({ studentId: id });
    
    // 3. Delete subscriptions
    await this.subscriptionRepository.delete({ studentId: id });
    
    // 4. Delete invoices
    await this.invoiceRepository.delete({ studentId: id });
    
    // 5. Check if student has a parent and remove from parent's children array
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
    
    // 6. Delete student record first
    await this.studentRepository.delete(id);
    
    // 7. Delete the corresponding user record
    await this.userRepository.delete(id);
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
  async createStudentFromUser(userId: string, birthDate: string, phone?: string, parentId?: string): Promise<Student> {
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
      parentId: parentId || null, // Use provided parentId or null
    });

    const savedStudent = await this.studentRepository.save(student);

    // If parentId is provided, add the student to the parent's studentIds array
    if (parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: parentId }
      });
      
      if (parent) {
        parent.studentIds = [...(parent.studentIds || []), userId];
        await this.parentRepository.save(parent);
      }
    }

    return savedStudent;
  }

  async updateStudentFromUser(userId: string, updateData: { birthDate?: string; parentId?: string }): Promise<Student> {
    const student = await this.findOne(userId);
    
    // Update student-specific fields
    if (updateData.birthDate) {
      student.birthDate = new Date(updateData.birthDate);
    }
    
    if (updateData.parentId !== undefined) {
      // Handle parent relationship change
      const oldParentId = student.parentId;
      student.parentId = updateData.parentId || null;
      
      // Update parent relationships
      if (oldParentId && oldParentId !== updateData.parentId) {
        // Remove from old parent's studentIds array
        const oldParent = await this.parentRepository.findOne({
          where: { id: oldParentId }
        });
        if (oldParent && oldParent.studentIds) {
          oldParent.studentIds = oldParent.studentIds.filter(studentId => studentId !== userId);
          await this.parentRepository.save(oldParent);
        }
      }
      
      if (updateData.parentId) {
        // Add to new parent's studentIds array
        const newParent = await this.parentRepository.findOne({
          where: { id: updateData.parentId }
        });
        if (newParent) {
          newParent.studentIds = [...(newParent.studentIds || []), userId];
          await this.parentRepository.save(newParent);
        }
      }
    }
    
    return this.studentRepository.save(student);
  }

  async getStudentClasses(studentId: string): Promise<any[]> {
    // First, get the student to find their classId
    const student = await this.findOne(studentId);
    
    if (!student.classId) {
      return []; // Student is not enrolled in any class
    }

    // Get the class with its courses
    const classEntity = await this.classRepository.findOne({
      where: { id: student.classId },
      relations: ['courses', 'courses.teacher']
    });

    if (!classEntity) {
      return [];
    }

    // Get the actual student count for this class
    const studentCount = await this.studentRepository.count({
      where: { classId: student.classId }
    });

    // Transform the data to match the frontend structure
    const transformedClass = {
      id: classEntity.id,
      name: classEntity.name,
      startDate: classEntity.startDate,
      endDate: classEntity.endDate,
      price: classEntity.price,
      numberOfStudents: studentCount,
      status: 'active', // Default status since Class entity doesn't have status field
      courses: classEntity.courses?.map(course => ({
        id: course.id,
        name: course.name,
        startDate: classEntity.startDate, // Use class dates since courses don't have their own dates
        endDate: classEntity.endDate,
        teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'No Teacher Assigned',
        courseMaterial: course.name || 'No description available',
        sessionTime: course.sessions?.map(session => ({
          day: session.day,
          startTime: session.startTime,
          endTime: session.endTime
        })) || []
      })) || []
    };

    return [transformedClass];
  }
}

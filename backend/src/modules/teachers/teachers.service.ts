import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Role } from '../../common/enums/role.enum';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>
  ) {}

  async getTeacherProfile(teacherId: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      id: teacher.id,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      courses: teacher.courses,
      createdAt: teacher.user.createdAt,
    };
  }

  async updateTeacher(teacherId: string, updateData: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Only allow updating courses array
    if (updateData.courses) {
      await this.teacherRepository.update(teacherId, { courses: updateData.courses });
    }

    return this.findOne(teacherId);
  }

  async getTeacherClasses(teacherId: string) {
    console.log('🔍 Getting classes for teacher ID:', teacherId);
    
    // First, verify the teacher exists
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });

    if (!teacher) {
      console.log('❌ Teacher not found for ID:', teacherId);
      throw new NotFoundException('Teacher not found');
    }

    console.log('✅ Teacher found:', teacher.user.firstName, teacher.user.lastName);

    // Get all courses taught by this teacher
    const courses = await this.courseRepository.find({
      where: { teacherId },
      relations: ['class', 'teacher'],
    });

    console.log('📚 Found courses for teacher:', courses.length);
    console.log('📚 Courses data:', courses.map(c => ({ id: c.id, name: c.name, teacherId: c.teacherId, classId: c.classId })));

    // Group courses by class
    const classMap = new Map<string, any>();
    
    for (const course of courses) {
      const classId = course.classId;
      
      if (!classMap.has(classId)) {
        // Get class details
        const classEntity = await this.classRepository.findOne({
          where: { id: classId },
        });
        
        if (classEntity) {
          // Get students from Student entity where classId matches
          const students = await this.studentRepository.find({
            where: { classId: classEntity.id }
          });
          
          // Get student IDs
          const studentIds = students.map(student => student.id);
          
          classMap.set(classId, {
            id: classEntity.id,
            name: classEntity.name,
            startDate: classEntity.startDate,
            endDate: classEntity.endDate,
            price: classEntity.price,
            students: studentIds,
            studentCount: studentIds.length,
            numberOfStudents: studentIds.length, // For backward compatibility
            courseIds: classEntity.courseIds || [],
            courses: []
          });
        }
      }
      
      // Add course to the class
      const classData = classMap.get(classId);
      if (classData) {
        classData.courses.push({
          id: course.id,
          name: course.name,
          teacherId: course.teacherId,
          teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Unknown Teacher',
          sessionTime: course.sessions || [],
          sessions: course.sessions || []
        });
      }
    }

    const result = Array.from(classMap.values());
    console.log('🏫 Final classes result:', result.length, 'classes');
    console.log('🏫 Classes data:', result.map(c => ({ id: c.id, name: c.name, coursesCount: c.courses.length })));
    
    return result;
  }

  async getClassStudents(classId: string) {
    // Get students from the Student entity where classId matches
    const students = await this.studentRepository.find({
      where: { classId },
      relations: ['user', 'parent']
    });

    // Transform students to include user data and parent information
    return students.map(student => ({
      id: student.id,
      birthDate: student.birthDate,
      parentId: student.parentId,
      classId: student.classId,
      user: student.user,
      parent: student.parent
    }));
  }

  async createTeacher(teacherData: { id: string; courses: string[] }) {
    const teacher = this.teacherRepository.create({
      id: teacherData.id,
      courses: teacherData.courses,
    });

    return this.teacherRepository.save(teacher);
  }

  async findAll(): Promise<Teacher[]> {
    return this.teacherRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async deleteTeacher(id: string): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.teacherRepository.delete(id);
  }

  // Method to create a teacher record from an existing user
  async createTeacherFromUser(userId: string): Promise<Teacher> {
    // Check if teacher record already exists
    const existingTeacher = await this.teacherRepository.findOne({
      where: { id: userId }
    });

    if (existingTeacher) {
      throw new Error('Teacher record already exists for this user');
    }

    // Create teacher record with the existing user ID
    const teacher = this.teacherRepository.create({
      id: userId,
      courses: [], // Start with empty courses array
    });

    return this.teacherRepository.save(teacher);
  }
}
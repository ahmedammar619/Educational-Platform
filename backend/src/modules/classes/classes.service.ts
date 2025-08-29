import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Class } from './entities/class.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { Role } from '../../common/enums/role.enum';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async createClass(createClassDto: CreateClassDto): Promise<Class> {
    const { startDate, endDate } = createClassDto;
    
    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const classEntity = this.classRepository.create({
      ...createClassDto,
      courseIds: [] // Initialize courseIds as empty array
    });
    return await this.classRepository.save(classEntity);
  }

  async findAllClasses(): Promise<Class[]> {
    const classes = await this.classRepository.find({
      relations: ['students'], // Only load students, not full course objects
      order: { createdAt: 'DESC' }
    });

    // Ensure courseIds is always an array, not null
    return classes.map(classEntity => ({
      ...classEntity,
      courseIds: classEntity.courseIds || []
    }));
  }

  async findClassById(id: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['students'] // Only load students, not full course objects
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Ensure courseIds is always an array, not null
    return {
      ...classEntity,
      courseIds: classEntity.courseIds || []
    };
  }

  async updateClass(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findClassById(id);
    
    if (updateClassDto.startDate && updateClassDto.endDate) {
      if (new Date(updateClassDto.startDate) >= new Date(updateClassDto.endDate)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async deleteClass(id: string): Promise<void> {
    const classEntity = await this.findClassById(id);
    
    // First, remove all students from the class
    if (classEntity.students && classEntity.students.length > 0) {
      classEntity.students = [];
      await this.classRepository.save(classEntity);
    }
    
    // Delete all courses associated with this class first
    await this.courseRepository.delete({ classId: id });
    
    // Now delete the class
    await this.classRepository.delete(id);
  }

  async enrollStudents(classId: string, enrollDto: EnrollStudentsDto): Promise<void> {
    const classEntity = await this.findClassById(classId);
    
    // Verify all students exist and are actually students
    const students = await this.userRepository.find({
      where: { 
        id: In(enrollDto.studentIds),
        role: Role.Student 
      }
    });

    if (students.length !== enrollDto.studentIds.length) {
      throw new BadRequestException('Some student IDs are invalid or not students');
    }

    // Get all courses in this class
    const classCourses = await this.courseRepository.find({
      where: { classId }
    });

    // Update student records with classId
    for (const student of students) {
      await this.studentRepository.update(student.id, { classId });
    }

    // Add students to class (TypeORM will handle duplicates)
    classEntity.students = [...(classEntity.students || []), ...students];
    await this.classRepository.save(classEntity);

    // Automatically enroll students in all courses within the class
    for (const student of students) {
      for (const course of classCourses) {
        await this.enrollmentsService.enrollStudentInCourse(student.id, course.id);
      }
    }
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.findClassById(classId);
    
    // Get all courses in this class
    const classCourses = await this.courseRepository.find({
      where: { classId }
    });

    // Remove student from all courses in the class
    for (const course of classCourses) {
      await this.enrollmentsService.unenrollStudentFromCourse(studentId, course.id);
    }

    // Update student record to remove classId
    await this.studentRepository.update(studentId, { classId: null });
    
    // Remove student from class
    classEntity.students = classEntity.students.filter(student => student.id !== studentId);
    await this.classRepository.save(classEntity);
  }

  async getClassStudents(classId: string): Promise<User[]> {
    const classEntity = await this.findClassById(classId);
    return classEntity.students || [];
  }
}

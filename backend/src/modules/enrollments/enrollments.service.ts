import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async enrollStudentInCourse(studentId: string, courseId: string): Promise<Enrollment> {
    // Check if enrollment already exists
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { studentId, courseId }
    });

    if (existingEnrollment) {
      return existingEnrollment;
    }

    // Create new enrollment
    const enrollment = this.enrollmentRepository.create({
      studentId,
      courseId,
      enrolledAt: new Date()
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  async enrollStudentInMultipleCourses(studentId: string, courseIds: string[]): Promise<Enrollment[]> {
    const enrollments: Enrollment[] = [];

    for (const courseId of courseIds) {
      const enrollment = await this.enrollStudentInCourse(studentId, courseId);
      enrollments.push(enrollment);
    }

    return enrollments;
  }

  async enrollStudentsInCourse(studentIds: string[], courseId: string): Promise<Enrollment[]> {
    const enrollments: Enrollment[] = [];

    for (const studentId of studentIds) {
      const enrollment = await this.enrollStudentInCourse(studentId, courseId);
      enrollments.push(enrollment);
    }

    return enrollments;
  }

  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find({
      where: { studentId },
      relations: ['course', 'course.teacher', 'course.class']
    });
  }

  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find({
      where: { courseId },
      relations: ['student', 'student.user']
    });
  }

  async unenrollStudentFromCourse(studentId: string, courseId: string): Promise<void> {
    await this.enrollmentRepository.delete({ studentId, courseId });
  }

  async unenrollStudentFromAllCourses(studentId: string): Promise<void> {
    await this.enrollmentRepository.delete({ studentId });
  }

  async unenrollAllStudentsFromCourse(courseId: string): Promise<void> {
    await this.enrollmentRepository.delete({ courseId });
  }
}

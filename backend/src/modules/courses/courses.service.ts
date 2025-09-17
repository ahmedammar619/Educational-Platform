import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, SessionData } from './entities/course.entity';
import { Class } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class CoursesService {
  private courseCreationLock = new Set<string>(); // Track ongoing course creations by classId

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const { teacherId, classId, sessions } = createCourseDto;

    // Check if course creation is already in progress for this class
    if (this.courseCreationLock.has(classId)) {
      throw new BadRequestException('Course creation is already in progress for this class. Please wait and try again.');
    }

    // Add classId to lock set
    this.courseCreationLock.add(classId);

    try {
      console.log('Creating course with sessions:', { teacherId, classId, sessions });

    // Verify teacher exists and is a teacher
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: Role.Teacher }
    });
    if (!teacher) {
      throw new BadRequestException('Teacher not found or invalid role');
    }

    // Verify class exists
    const classEntity = await this.classRepository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new BadRequestException('Class not found');
    }

      // Validate session times if provided
      if (sessions && sessions.length > 0) {
        const validation = await this.validateSessions(sessions, classId);
        if (!validation.isValid) {
          throw new BadRequestException(`Session validation failed: ${validation.errors.join('; ')}`);
        }
      }

    // Convert sessions to SessionData format
    const sessionData: SessionData[] = sessions ? sessions.map(session => ({
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime
    })) : [];

    // Create course with sessions
    const course = this.courseRepository.create({
      name: createCourseDto.name,
      teacherId,
      classId,
      sessions: sessionData
    });

    const savedCourse = await this.courseRepository.save(course);
    console.log('Saved course with sessions:', savedCourse);

    // Add course ID to class's courseIds array
    const targetClass = await this.classRepository.findOne({
      where: { id: createCourseDto.classId }
    });
    
    if (targetClass) {
      const currentCourseIds = targetClass.courseIds || [];
      if (!currentCourseIds.includes(savedCourse.id)) {
        targetClass.courseIds = [...currentCourseIds, savedCourse.id];
        await this.classRepository.save(targetClass);
        console.log('Added course ID to class courseIds array:', savedCourse.id);
      }
    }

    // Send notification to teacher about being added to the course
    try {
      await this.notificationsService.createAddedToCourseNotification(
        teacherId,
        createCourseDto.name,
        classEntity.name,
        {
          courseId: savedCourse.id,
          classId: classId,
          createdDate: new Date().toISOString()
        }
      );
      console.log(`✅ Sent course assignment notification to teacher: ${teacher.firstName} ${teacher.lastName}`);
    } catch (error) {
      console.error('❌ Failed to send course assignment notification to teacher:', error);
      // Don't throw error - notification failure shouldn't break the main operation
    }

      return savedCourse;
    } finally {
      // Always remove the lock, even if an error occurs
      this.courseCreationLock.delete(classId);
    }
  }

  async findAllCourses(): Promise<Course[]> {
    const courses = await this.courseRepository.find({
      relations: ['teacher'],
      order: { createdAt: 'DESC' }
    });
    
    // Add teacherName to each course
    return courses.map(course => ({
      ...course,
      teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : null
    })) as any;
  }

  async findCourseById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher']
    });

    console.log('Found course by ID:', course);
    console.log('Course sessions:', course?.sessions);
    console.log('Course sessions length:', course?.sessions?.length);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Add teacherName to the course
    return {
      ...course,
      teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : null
    } as any;
  }

  async findCoursesByClass(classId: string): Promise<Course[]> {
    const courses = await this.courseRepository.find({
      where: { classId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' }
    });
    
    // Add teacherName to each course
    return courses.map(course => ({
      ...course,
      teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : null
    })) as any;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findCourseById(id);
    
    if (updateCourseDto.teacherId) {
      const teacher = await this.userRepository.findOne({
        where: { id: updateCourseDto.teacherId, role: Role.Teacher }
      });
      if (!teacher) {
        throw new BadRequestException('Teacher not found or invalid role');
      }
    }

    if (updateCourseDto.classId) {
      const classEntity = await this.classRepository.findOne({ 
        where: { id: updateCourseDto.classId } 
      });
      if (!classEntity) {
        throw new BadRequestException('Class not found');
      }
    }

    // Handle sessions update
    if (updateCourseDto.sessions !== undefined) {
      if (updateCourseDto.sessions && updateCourseDto.sessions.length > 0) {
        const validation = await this.validateSessions(updateCourseDto.sessions, course.classId, id);
        if (!validation.isValid) {
          throw new BadRequestException(`Session validation failed: ${validation.errors.join('; ')}`);
        }
        // Convert sessions to SessionData format
        course.sessions = updateCourseDto.sessions.map(session => ({
          day: session.day,
          startTime: session.startTime,
          endTime: session.endTime
        }));
      } else {
        course.sessions = [];
      }
    }

    // Update other course properties
    if (updateCourseDto.name) {
      course.name = updateCourseDto.name;
    }
    if (updateCourseDto.teacherId) {
      course.teacherId = updateCourseDto.teacherId;
    }
    if (updateCourseDto.classId) {
      course.classId = updateCourseDto.classId;
    }

    const savedCourse = await this.courseRepository.save(course);
    return savedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.findCourseById(id);
    
    // Remove course ID from class's courseIds array
    const targetClass = await this.classRepository.findOne({
      where: { id: course.classId }
    });
    
    if (targetClass && targetClass.courseIds) {
      targetClass.courseIds = targetClass.courseIds.filter(courseId => courseId !== id);
      await this.classRepository.save(targetClass);
      console.log('Removed course ID from class courseIds array:', id);
    }
    
    // Delete the course (sessions are stored as JSON in the course, so they'll be deleted automatically)
    await this.courseRepository.delete(id);
  }

  private async validateSessions(sessions: any[], classId: string, excludeCourseId?: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // If no sessions provided, that's valid (course can exist without sessions)
    if (!sessions || sessions.length === 0) {
      return { isValid: true, errors: [] };
    }

    try {
      // Check for conflicts within the same sessions array
      const internalErrors = this.checkInternalSessionConflicts(sessions);
      if (internalErrors.length > 0) {
        errors.push(...internalErrors);
      }

      // Check for conflicts with existing sessions in the same class
      const externalErrors = await this.checkExternalSessionConflicts(sessions, classId, excludeCourseId);
      if (externalErrors.length > 0) {
        errors.push(...externalErrors);
      }
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  private checkInternalSessionConflicts(sessions: any[]): string[] {
    const errors: string[] = [];
    const validSessions = sessions.filter(session => 
      session && session.day && session.startTime && session.endTime
    );

    for (let i = 0; i < validSessions.length; i++) {
      const session1 = validSessions[i];
      const startTime1 = this.parseTime(session1.startTime);
      const endTime1 = this.parseTime(session1.endTime);

      if (startTime1 >= endTime1) {
        errors.push(`Session ${i + 1}: End time must be after start time`);
      }

      // Check for conflicts with other sessions in the same array
      for (let j = i + 1; j < validSessions.length; j++) {
        const session2 = validSessions[j];
        
        if (session1.day === session2.day) {
          const startTime2 = this.parseTime(session2.startTime);
          const endTime2 = this.parseTime(session2.endTime);

          if (this.sessionsOverlap(startTime1, endTime1, startTime2, endTime2)) {
            errors.push(
              `Session conflict: ${session1.day} ${session1.startTime}-${session1.endTime} overlaps with ${session2.day} ${session2.startTime}-${session2.endTime}`
            );
          }
        }
      }
    }

    return errors;
  }

  private async checkExternalSessionConflicts(sessions: any[], classId: string, excludeCourseId?: string): Promise<string[]> {
    const errors: string[] = [];
    
    try {
      // Get all courses in the same class
      const existingCourses = await this.courseRepository.find({
        where: { classId },
        select: ['id', 'sessions', 'name']
      });

      const validSessions = sessions.filter(session => 
        session && session.day && session.startTime && session.endTime
      );

      for (const newSession of validSessions) {
        const newStartTime = this.parseTime(newSession.startTime);
        const newEndTime = this.parseTime(newSession.endTime);

        for (const existingCourse of existingCourses) {
          // Skip the course being updated
          if (excludeCourseId && existingCourse.id === excludeCourseId) {
            continue;
          }

          if (existingCourse.sessions && Array.isArray(existingCourse.sessions)) {
            for (const existingSession of existingCourse.sessions) {
              if (existingSession.day === newSession.day) {
                const existingStartTime = this.parseTime(existingSession.startTime);
                const existingEndTime = this.parseTime(existingSession.endTime);

                if (this.sessionsOverlap(newStartTime, newEndTime, existingStartTime, existingEndTime)) {
                  errors.push(
                    `Session conflict: ${newSession.day} ${newSession.startTime}-${newSession.endTime} overlaps with existing session in course "${existingCourse.name}" (${existingSession.startTime}-${existingSession.endTime})`
                  );
                }
              }
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Error checking external conflicts: ${error.message}`);
    }

    return errors;
  }

  private sessionsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    // Two sessions overlap if one starts before the other ends
    return start1 < end2 && start2 < end1;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes; // Convert to minutes for comparison
  }
}

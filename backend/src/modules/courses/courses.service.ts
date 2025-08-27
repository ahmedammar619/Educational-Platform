import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseSession } from './entities/course-session.entity';
import { Class } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseSession)
    private readonly sessionRepository: Repository<CourseSession>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const { teacherId, classId, sessions } = createCourseDto;

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

    // Validate session times
    this.validateSessions(sessions);

    // Create course
    const course = this.courseRepository.create({
      name: createCourseDto.name,
      teacherId,
      classId
    });

    const savedCourse = await this.courseRepository.save(course);

    // Create sessions
    const courseSessions = sessions.map(sessionDto => 
      this.sessionRepository.create({
        ...sessionDto,
        courseId: savedCourse.id
      })
    );

    await this.sessionRepository.save(courseSessions);

    return this.findCourseById(savedCourse.id);
  }

  async findAllCourses(): Promise<Course[]> {
    return await this.courseRepository.find({
      relations: ['teacher', 'class', 'sessions'],
      order: { createdAt: 'DESC' }
    });
  }

  async findCourseById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher', 'class', 'sessions']
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async findCoursesByClass(classId: string): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { classId },
      relations: ['teacher', 'sessions'],
      order: { createdAt: 'DESC' }
    });
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

    if (updateCourseDto.sessions) {
      this.validateSessions(updateCourseDto.sessions);
    }

    Object.assign(course, updateCourseDto);
    const savedCourse = await this.courseRepository.save(course);

    // Update sessions if provided
    if (updateCourseDto.sessions) {
      // Remove existing sessions
      await this.sessionRepository.delete({ courseId: id });
      
      // Create new sessions
      const courseSessions = updateCourseDto.sessions.map(sessionDto => 
        this.sessionRepository.create({
          ...sessionDto,
          courseId: id
        })
      );
      await this.sessionRepository.save(courseSessions);
    }

    return this.findCourseById(id);
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.findCourseById(id);
    await this.courseRepository.remove(course);
  }

  async addSession(courseId: string, sessionDto: CreateSessionDto): Promise<CourseSession> {
    const course = await this.findCourseById(courseId);
    
    this.validateSessions([sessionDto]);

    const session = this.sessionRepository.create({
      ...sessionDto,
      courseId
    });

    return await this.sessionRepository.save(session);
  }

  async updateSession(sessionId: string, sessionDto: UpdateSessionDto): Promise<CourseSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (sessionDto.startTime || sessionDto.endTime) {
      this.validateSessions([{ ...session, ...sessionDto }]);
    }

    Object.assign(session, sessionDto);
    return await this.sessionRepository.save(session);
  }

  async removeSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.sessionRepository.remove(session);
  }

  private validateSessions(sessions: CreateSessionDto[]): void {
    for (const session of sessions) {
      const startTime = this.parseTime(session.startTime);
      const endTime = this.parseTime(session.endTime);

      if (startTime >= endTime) {
        throw new BadRequestException('End time must be after start time');
      }

      // Check for overlapping sessions on the same day
      // This would require checking against existing sessions in the database
      // For now, we'll just validate the time format and logic
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes; // Convert to minutes for comparison
  }
}

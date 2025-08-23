import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseSession } from './entities/course-session.entity';
import { CourseMaterial } from './entities/course-material.entity';
import { CourseFile } from './entities/course-file.entity';
import { CourseFolder } from './entities/course-folder.entity';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { CourseSchedule } from './entities/course-schedule.entity';
import { CreateScheduleDto, UpdateScheduleDto, BulkCreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseSession)
    private readonly sessionRepository: Repository<CourseSession>,
    @InjectRepository(CourseMaterial)
    private readonly materialRepository: Repository<CourseMaterial>,
    @InjectRepository(CourseFile)
    private readonly fileRepository: Repository<CourseFile>,
    @InjectRepository(CourseFolder)
    private readonly folderRepository: Repository<CourseFolder>,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentRepository: Repository<CourseEnrollment>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(CourseSchedule)
    private readonly scheduleRepository: Repository<CourseSchedule>,
  ) {}

  // ================= Course Management =================

  async createCourse(createCourseDto: CreateCourseDto, teacherId: number): Promise<Course> {
    const course = this.courseRepository.create({
      ...createCourseDto,
      teacherId,
      startDate: new Date(createCourseDto.startDate),
      endDate: new Date(createCourseDto.endDate),
    });

    return this.courseRepository.save(course);
  }

  async findAllCourses(filters?: {
    category?: string;
    level?: string;
    isPublished?: boolean;
    teacherId?: number;
    search?: string;
  }): Promise<Course[]> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .leftJoinAndSelect('course.students', 'students')
      .where('course.isActive = :isActive', { isActive: true });

    if (filters?.category) {
      queryBuilder.andWhere('course.category = :category', { category: filters.category });
    }

    if (filters?.level) {
      queryBuilder.andWhere('course.level = :level', { level: filters.level });
    }

    if (filters?.isPublished !== undefined) {
      queryBuilder.andWhere('course.isPublished = :isPublished', { isPublished: filters.isPublished });
    }

    if (filters?.teacherId) {
      queryBuilder.andWhere('course.teacherId = :teacherId', { teacherId: filters.teacherId });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(course.name ILIKE :search OR course.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder
      .orderBy('course.createdAt', 'DESC')
      .getMany();
  }

  async findCourseById(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, isActive: true },
      relations: ['teacher', 'students', 'sessions', 'materials', 'files', 'folders'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async updateCourse(id: number, updateCourseDto: UpdateCourseDto, userId: number, userRole: Role): Promise<Course> {
    const course = await this.findCourseById(id);

    // Only teacher or admin can update course
    if (userRole !== Role.Admin && course.teacherId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    Object.assign(course, updateCourseDto);
    
    if (updateCourseDto.startDate) {
      course.startDate = new Date(updateCourseDto.startDate);
    }
    if (updateCourseDto.endDate) {
      course.endDate = new Date(updateCourseDto.endDate);
    }

    return this.courseRepository.save(course);
  }

  async deleteCourse(id: number, userId: number, userRole: Role): Promise<void> {
    const course = await this.findCourseById(id);

    // Only teacher or admin can delete course
    if (userRole !== Role.Admin && course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    await this.courseRepository.update(id, { isActive: false });
  }

  // ================= Session Management =================

  async createSession(courseId: number, createSessionDto: CreateSessionDto, userId: number): Promise<CourseSession> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create sessions
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create sessions for your own courses');
    }

    const session = this.sessionRepository.create({
      ...createSessionDto,
      courseId,
      teacherId: userId,
      createdById: userId,
      scheduledDate: new Date(createSessionDto.scheduledDate),
    });

    return this.sessionRepository.save(session);
  }

  async findSessionsByCourse(courseId: number, filters?: {
    status?: string;
    type?: string;
    date?: string;
  }): Promise<CourseSession[]> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.teacher', 'teacher')
      .where('session.courseId = :courseId', { courseId });

    if (filters?.status) {
      queryBuilder.andWhere('session.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      queryBuilder.andWhere('session.type = :type', { type: filters.type });
    }

    if (filters?.date) {
      const date = new Date(filters.date);
      queryBuilder.andWhere('session.scheduledDate = :date', { date });
    }

    return queryBuilder
      .orderBy('session.scheduledDate', 'ASC')
      .addOrderBy('session.startTime', 'ASC')
      .getMany();
  }

  async updateSession(sessionId: number, updateData: Partial<CreateSessionDto>, userId: number): Promise<CourseSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teacher can update session
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only update sessions for your own courses');
    }

    Object.assign(session, updateData);
    
    if (updateData.scheduledDate) {
      session.scheduledDate = new Date(updateData.scheduledDate);
    }

    return this.sessionRepository.save(session);
  }

  async deleteSession(sessionId: number, userId: number): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teacher can delete session
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete sessions for your own courses');
    }

    await this.sessionRepository.delete(sessionId);
  }

  // ================= Material Management =================

  async createMaterial(courseId: number, createMaterialDto: CreateMaterialDto, userId: number): Promise<CourseMaterial> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create materials
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create materials for your own courses');
    }

    const material = this.materialRepository.create({
      ...createMaterialDto,
      courseId,
      authorId: userId,
      publishDate: createMaterialDto.isPublished ? new Date() : null,
    });

    return this.materialRepository.save(material);
  }

  async findMaterialsByCourse(courseId: number, filters?: {
    type?: string;
    isPublished?: boolean;
  }): Promise<CourseMaterial[]> {
    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.author', 'author')
      .where('material.courseId = :courseId', { courseId });

    if (filters?.type) {
      queryBuilder.andWhere('material.type = :type', { type: filters.type });
    }

    if (filters?.isPublished !== undefined) {
      queryBuilder.andWhere('material.isPublished = :isPublished', { isPublished: filters.isPublished });
    }

    return queryBuilder
      .orderBy('material.isPinned', 'DESC')
      .addOrderBy('material.createdAt', 'DESC')
      .getMany();
  }

  async updateMaterial(materialId: number, updateData: Partial<CreateMaterialDto>, userId: number): Promise<CourseMaterial> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['course'],
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Only teacher can update material
    if (material.course.teacherId !== userId) {
      throw new ForbiddenException('You can only update materials for your own courses');
    }

    Object.assign(material, updateData);
    
    if (updateData.isPublished && !material.isPublished) {
      material.publishDate = new Date();
    }

    return this.materialRepository.save(material);
  }

  async deleteMaterial(materialId: number, userId: number): Promise<void> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['course'],
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Only teacher can delete material
    if (material.course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete materials for your own courses');
    }

    await this.materialRepository.delete(materialId);
  }

  // ================= Attendance Management =================

  async markAttendance(sessionId: number, markAttendanceDto: MarkAttendanceDto, userId: number): Promise<SessionAttendance> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teacher can mark attendance
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only mark attendance for your own courses');
    }

    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId: markAttendanceDto.studentId },
    });

    if (attendance) {
      // Update existing attendance
      Object.assign(attendance, markAttendanceDto);
      attendance.markedById = userId;
      attendance.markedAt = new Date();
    } else {
      // Create new attendance
      attendance = this.attendanceRepository.create({
        ...markAttendanceDto,
        sessionId,
        markedById: userId,
        markedAt: new Date(),
      });
    }

    return this.attendanceRepository.save(attendance);
  }

  async bulkMarkAttendance(sessionId: number, bulkMarkAttendanceDto: BulkMarkAttendanceDto, userId: number): Promise<SessionAttendance[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teacher can mark attendance
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only mark attendance for your own courses');
    }

    const attendances: SessionAttendance[] = [];

    for (const attendanceData of bulkMarkAttendanceDto.attendances) {
      let attendance = await this.attendanceRepository.findOne({
        where: { sessionId, studentId: attendanceData.studentId },
      });

      if (attendance) {
        // Update existing attendance
        Object.assign(attendance, attendanceData);
        attendance.markedById = userId;
        attendance.markedAt = new Date();
      } else {
        // Create new attendance
        attendance = this.attendanceRepository.create({
          ...attendanceData,
          sessionId,
          markedById: userId,
          markedAt: new Date(),
        });
      }

      attendances.push(attendance);
    }

    return this.attendanceRepository.save(attendances);
  }

  async getSessionAttendance(sessionId: number): Promise<SessionAttendance[]> {
    return this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student', 'markedBy'],
      order: { student: { firstName: 'ASC' } },
    });
  }

  // ================= Enrollment Management =================

  async enrollStudent(courseId: number, studentId: number): Promise<CourseEnrollment> {
    const course = await this.findCourseById(courseId);

    // Check if course is full
    if (course.maxStudents > 0 && course.currentStudents >= course.maxStudents) {
      throw new BadRequestException('Course is full');
    }

    // Check if student is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { courseId, studentId, status: 'enrolled' },
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({
      courseId,
      studentId,
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    // Update course student count
    await this.courseRepository.update(courseId, {
      currentStudents: course.currentStudents + 1,
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async unenrollStudent(courseId: number, studentId: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { courseId, studentId, status: 'enrolled' },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.enrollmentRepository.update(enrollment.id, {
      status: 'dropped',
      droppedAt: new Date(),
    });

    // Update course student count
    const course = await this.findCourseById(courseId);
    await this.courseRepository.update(courseId, {
      currentStudents: Math.max(0, course.currentStudents - 1),
    });
  }

  // ================= File Management =================

  async createFolder(courseId: number, name: string, description?: string, parentFolderId?: number, userId: number): Promise<CourseFolder> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create folders
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create folders for your own courses');
    }

    const folder = this.folderRepository.create({
      name,
      description,
      courseId,
      parentFolderId,
      createdById: userId,
    });

    return this.folderRepository.save(folder);
  }

  async findFoldersByCourse(courseId: number, parentFolderId?: number): Promise<CourseFolder[]> {
    const whereClause: any = { courseId, isDeleted: false };
    
    if (parentFolderId !== undefined) {
      whereClause.parentFolderId = parentFolderId;
    } else {
      whereClause.parentFolderId = null; // Root folders only
    }

    return this.folderRepository.find({
      where: whereClause,
      relations: ['subFolders', 'files'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  // ================= Schedule Management =================

  async createSchedule(courseId: number, createScheduleDto: CreateScheduleDto, userId: number): Promise<CourseSchedule> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create schedules
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create schedules for your own courses');
    }

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      courseId,
    });

    return this.scheduleRepository.save(schedule);
  }

  async bulkCreateSchedules(courseId: number, bulkCreateScheduleDto: BulkCreateScheduleDto, userId: number): Promise<CourseSchedule[]> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create schedules
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create schedules for your own courses');
    }

    const schedules = bulkCreateScheduleDto.schedules.map(scheduleData => 
      this.scheduleRepository.create({
        ...scheduleData,
        courseId,
      })
    );

    return this.scheduleRepository.save(schedules);
  }

  async findSchedulesByCourse(courseId: number): Promise<CourseSchedule[]> {
    return this.scheduleRepository.find({
      where: { courseId, isActive: true },
      order: { sortOrder: 'ASC', day: 'ASC' },
    });
  }

  async updateSchedule(scheduleId: number, updateScheduleDto: UpdateScheduleDto, userId: number): Promise<CourseSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['course'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Only teacher can update schedule
    if (schedule.course.teacherId !== userId) {
      throw new ForbiddenException('You can only update schedules for your own courses');
    }

    Object.assign(schedule, updateScheduleDto);
    return this.scheduleRepository.save(schedule);
  }

  async deleteSchedule(scheduleId: number, userId: number): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['course'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Only teacher can delete schedule
    if (schedule.course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete schedules for your own courses');
    }

    await this.scheduleRepository.delete(scheduleId);
  }

  async toggleScheduleStatus(scheduleId: number, userId: number): Promise<CourseSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['course'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Only teacher can toggle schedule status
    if (schedule.course.teacherId !== userId) {
      throw new ForbiddenException('You can only modify schedules for your own courses');
    }

    schedule.isActive = !schedule.isActive;
    return this.scheduleRepository.save(schedule);
  }

  // ================= Analytics & Reports =================

  async getCourseStats(courseId: number): Promise<any> {
    const course = await this.findCourseById(courseId);
    
    const [totalSessions, completedSessions, totalStudents, totalMaterials] = await Promise.all([
      this.sessionRepository.count({ where: { courseId } }),
      this.sessionRepository.count({ where: { courseId, status: 'completed' } }),
      this.enrollmentRepository.count({ where: { courseId, status: 'enrolled' } }),
      this.materialRepository.count({ where: { courseId, isPublished: true } }),
    ]);

    return {
      courseId,
      totalSessions,
      completedSessions,
      totalStudents,
      totalMaterials,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    };
  }

  async getAttendanceReport(courseId: number, startDate?: Date, endDate?: Date): Promise<any> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.session', 'session')
      .leftJoinAndSelect('attendance.student', 'student')
      .where('session.courseId = :courseId', { courseId });

    if (startDate && endDate) {
      queryBuilder.andWhere('session.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const attendances = await queryBuilder.getMany();

    // Group by student and calculate statistics
    const studentStats = new Map();
    
    attendances.forEach(attendance => {
      const studentId = attendance.studentId;
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          studentId,
          studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          attendanceRate: 0,
        });
      }

      const stats = studentStats.get(studentId);
      stats.totalSessions++;

      switch (attendance.status) {
        case 'present':
          stats.presentCount++;
          break;
        case 'absent':
          stats.absentCount++;
          break;
        case 'late':
          stats.lateCount++;
          break;
      }
    });

    // Calculate attendance rates
    studentStats.forEach(stats => {
      stats.attendanceRate = stats.totalSessions > 0 
        ? ((stats.presentCount + stats.lateCount) / stats.totalSessions) * 100 
        : 0;
    });

    return Array.from(studentStats.values());
  }
}

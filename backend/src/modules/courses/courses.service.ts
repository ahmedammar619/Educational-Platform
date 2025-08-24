import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
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
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { CourseSchedule } from './entities/course-schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BulkCreateScheduleDto } from './dto/bulk-create-schedule.dto';

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

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create({
      ...createCourseDto,
      startDate: new Date(createCourseDto.startDate),
      endDate: new Date(createCourseDto.endDate),
    });

    return this.courseRepository.save(course);
  }

  async findAllCourses(filters?: {
    teacherId?: string;
    search?: string;
  }): Promise<Course[]> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .leftJoinAndSelect('course.students', 'students');

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

  async findCourseById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher', 'students', 'sessions', 'materials', 'files', 'folders'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto, userId: string, userRole: Role): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only teachers can update their own courses, admins can update any course
    if (userRole !== Role.Admin && course.teacherId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    Object.assign(course, updateCourseDto);
    const updatedCourse = await this.courseRepository.save(course);
    return updatedCourse;
  }

  async deleteCourse(id: string, userId: string, userRole: Role): Promise<void> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only teachers can delete their own courses, admins can delete any course
    if (userRole !== Role.Admin && course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    await this.courseRepository.remove(course);
  }

  // ================= Session Management =================

  async createSession(courseId: string, createSessionDto: CreateSessionDto, userId: string): Promise<CourseSession> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['teacher'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only teachers can create sessions for their own courses
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create sessions for your own courses');
    }

    const session = this.sessionRepository.create({
      ...createSessionDto,
      courseId,
    });

    const savedSession = await this.sessionRepository.save(session);
    return savedSession;
  }

  async findSessionsByCourse(courseId: string, filters?: {
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

  async updateSession(sessionId: string, updateData: Partial<CreateSessionDto>, userId: string): Promise<CourseSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course', 'course.teacher'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teachers can update sessions for their own courses
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only update sessions for your own courses');
    }

    Object.assign(session, updateData);
    const updatedSession = await this.sessionRepository.save(session);
    return updatedSession;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course', 'course.teacher'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teachers can delete sessions for their own courses
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete sessions for your own courses');
    }

    await this.sessionRepository.remove(session);
  }

  // ================= Material Management =================

  async createMaterial(courseId: string, createMaterialDto: CreateMaterialDto, userId: string): Promise<CourseMaterial> {
    const course = await this.findCourseById(courseId);

    // Only teachers can create materials for their own courses
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create materials for your own courses');
    }

    const material = this.materialRepository.create({
      ...createMaterialDto,
      courseId,
      authorId: userId,
    });

    const savedMaterial = await this.materialRepository.save(material);
    return savedMaterial;
  }

  async findMaterialsByCourse(courseId: string, filters?: {
    type?: string;
  }): Promise<CourseMaterial[]> {
    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.author', 'author')
      .where('material.courseId = :courseId', { courseId });

    if (filters?.type) {
      queryBuilder.andWhere('material.type = :type', { type: filters.type });
    }

    return queryBuilder
      .orderBy('material.isPinned', 'DESC')
      .addOrderBy('material.createdAt', 'DESC')
      .getMany();
  }

  async findMaterialById(materialId: string): Promise<CourseMaterial> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['author', 'attachments'],
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async updateMaterial(materialId: string, updateMaterialDto: UpdateMaterialDto, userId: string): Promise<CourseMaterial> {
    const material = await this.findMaterialById(materialId);

    // Only the author can update the material
    if (material.authorId !== userId) {
      throw new ForbiddenException('You can only update your own materials');
    }

    Object.assign(material, updateMaterialDto);
    const updatedMaterial = await this.materialRepository.save(material);
    return updatedMaterial;
  }

  async deleteMaterial(materialId: string, userId: string): Promise<void> {
    const material = await this.findMaterialById(materialId);

    // Only the author can delete the material
    if (material.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own materials');
    }

    await this.materialRepository.remove(material);
  }

  // ================= Attendance Management =================

  async markAttendance(sessionId: string, markAttendanceDto: MarkAttendanceDto, userId: string): Promise<SessionAttendance> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only teachers can mark attendance
    if (session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only mark attendance for your own sessions');
    }

    // Check if attendance already exists
    const existingAttendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId: markAttendanceDto.studentId },
    });

    if (existingAttendance) {
      // Update existing attendance
      Object.assign(existingAttendance, markAttendanceDto);
      existingAttendance.markedAt = new Date();
      return this.attendanceRepository.save(existingAttendance);
    }

    // Create new attendance
    const attendance = this.attendanceRepository.create({
      sessionId,
      studentId: markAttendanceDto.studentId,
      status: markAttendanceDto.status,
      notes: markAttendanceDto.notes,
      markedAt: new Date(),
      markedById: userId,
    });

    return this.attendanceRepository.save(attendance);
  }

  async bulkMarkAttendance(sessionId: string, bulkMarkAttendanceDto: BulkMarkAttendanceDto, userId: string): Promise<SessionAttendance[]> {
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

  async getSessionAttendance(sessionId: string): Promise<SessionAttendance[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student', 'markedBy'],
    });
  }

  async updateAttendance(attendanceId: string, updateAttendanceDto: UpdateAttendanceDto, userId: string): Promise<SessionAttendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
      relations: ['session', 'session.course'],
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Only teachers can update attendance
    if (attendance.session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only update attendance for your own sessions');
    }

    Object.assign(attendance, updateAttendanceDto);
    attendance.markedAt = new Date();
    attendance.markedById = userId;

    return this.attendanceRepository.save(attendance);
  }

  async deleteAttendance(attendanceId: string, userId: string): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
      relations: ['session', 'session.course'],
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Only teachers can delete attendance
    if (attendance.session.course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete attendance for your own sessions');
    }

    await this.attendanceRepository.remove(attendance);
  }

  // ================= Enrollment Management =================

  async enrollStudent(courseId: string, studentId: string): Promise<CourseEnrollment> {
    const course = await this.findCourseById(courseId);

    // Check if student is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { courseId, studentId, status: 'enrolled' },
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Create enrollment
    const enrollment = this.enrollmentRepository.create({
      courseId,
      studentId,
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async unenrollStudent(courseId: string, studentId: string): Promise<void> {
    const course = await this.findCourseById(courseId);

    // Find and update enrollment
    const enrollment = await this.enrollmentRepository.findOne({
      where: { courseId, studentId, status: 'enrolled' },
    });

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this course');
    }

    enrollment.status = 'dropped';
    enrollment.droppedAt = new Date();
    await this.enrollmentRepository.save(enrollment);
  }

  // ================= File Management =================

  async createFolder(courseId: string, userId: string, name: string, description?: string, parentFolderId?: string): Promise<CourseFolder> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create folders
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create folders for your own courses');
    }

    const folder = this.folderRepository.create({
      name,
      description,
      courseId,
      createdById: userId,
      parentFolderId,
    });

    const savedFolder = await this.folderRepository.save(folder);
    return savedFolder;
  }

  async findFoldersByCourse(courseId: string, parentFolderId?: string): Promise<CourseFolder[]> {
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

  async createSchedule(courseId: string, createScheduleDto: CreateScheduleDto, userId: string): Promise<CourseSchedule> {
    const course = await this.findCourseById(courseId);

    // Only teacher can create schedules
    if (course.teacherId !== userId) {
      throw new ForbiddenException('You can only create schedules for your own courses');
    }

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      courseId,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);
    return savedSchedule;
  }

  async bulkCreateSchedules(courseId: string, bulkCreateScheduleDto: BulkCreateScheduleDto, userId: string): Promise<CourseSchedule[]> {
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

  async findSchedulesByCourse(courseId: string): Promise<CourseSchedule[]> {
    return this.scheduleRepository.find({
      where: { courseId },
      order: { sortOrder: 'ASC', day: 'ASC' },
    });
  }

  async updateSchedule(scheduleId: string, updateScheduleDto: UpdateScheduleDto, userId: string): Promise<CourseSchedule> {
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

  async deleteSchedule(scheduleId: string, userId: string): Promise<void> {
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

  async toggleScheduleStatus(scheduleId: string, userId: string): Promise<CourseSchedule> {
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

  async getCourseStats(courseId: string): Promise<any> {
    const course = await this.findCourseById(courseId);
    
    const [totalSessions, completedSessions, totalStudents, totalMaterials] = await Promise.all([
      this.sessionRepository.count({ where: { courseId } }),
      this.sessionRepository.count({ where: { courseId, status: 'completed' } }),
      this.enrollmentRepository.count({ where: { courseId, status: 'enrolled' } }),
      this.materialRepository.count({ where: { courseId } }),
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

  async getAttendanceReport(courseId: string, startDate?: Date, endDate?: Date): Promise<any> {
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

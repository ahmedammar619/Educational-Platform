import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef ,ConflictException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Course, SessionData } from './entities/course.entity';
import { Class } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Student } from '../students/entities/student.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';
// Import materials entities for cascading deletion
import { Post } from '../materials/entities/post.entity';
import { Folder } from '../materials/entities/folder.entity';
import { File } from '../materials/entities/file.entity';
import { Assignment } from '../materials/entities/assignment.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { AssignmentSubmission } from '../materials/entities/assignment-submission.entity';
import { PostAttachment } from '../materials/entities/post-attachment.entity';
import { ZoomMeeting } from '../zoom/entities/zoom-meeting.entity';

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
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    // Materials repositories for cascading deletion
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(PostAttachment)
    private readonly postAttachmentRepository: Repository<PostAttachment>,
    @InjectRepository(ZoomMeeting)
    private readonly zoomMeetingRepository: Repository<ZoomMeeting>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const { teacherId, classId, sessions, creatorTimezone } = createCourseDto;

    // Check if course creation is already in progress for this class
    if (this.courseCreationLock.has(classId)) {
      throw new BadRequestException('Course creation is already in progress for this class. Please wait and try again.');
    }

    // Add classId to lock set
    this.courseCreationLock.add(classId);

    try {
      console.log('Creating course with sessions:', { teacherId, classId, sessions });

    // Verify teacher exists and is a teacher (if teacherId is provided)
    let teacher = null;
    if (teacherId) {
      teacher = await this.userRepository.findOne({
        where: { id: teacherId, role: Role.Teacher }
      });
      if (!teacher) {
        throw new BadRequestException('Selected teacher not found or does not have teacher role. Please select a valid teacher.');
      }
    }

    // Verify class exists
    const classEntity = await this.classRepository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new BadRequestException('Selected class not found. Please select a valid class.');
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
      sessions: sessionData,
      creatorTimezone: creatorTimezone
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

    // Add course ID to teacher's courses array if teacher is assigned
    if (teacherId) {
      const teacherEntity = await this.teacherRepository.findOne({
        where: { id: teacherId }
      });
      
      if (teacherEntity) {
        const currentCourses = teacherEntity.courses || [];
        if (!currentCourses.includes(savedCourse.id)) {
          teacherEntity.courses = [...currentCourses, savedCourse.id];
          await this.teacherRepository.save(teacherEntity);
          console.log('Added course ID to teacher courses array:', savedCourse.id);
        }
      }
    }

    // Send notification to teacher about being added to the course (if teacher is assigned)
    if (teacherId && teacher) {
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
      throw new NotFoundException('Course not found. It may have been deleted or moved.');
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
    
    // Get enrolled students for each course
    const coursesWithEnrollments = await Promise.all(courses.map(async (course) => {
      // Get students enrolled in this course (both through class and individual enrollment)
      const enrolledStudents = await this.getStudentsInCourse(course.id);
      
      console.log(`🔍 Course ${course.name} (${course.id}):`);
      console.log(`  - Course.students array:`, course.students);
      console.log(`  - Enrolled students found:`, enrolledStudents.length);
      console.log(`  - Student details:`, enrolledStudents.map(s => `${s.firstName} ${s.lastName}`));
      
      return {
        ...course,
        teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : null,
        enrolledStudents: enrolledStudents
      } as any;
    }));

    console.log('📋 Final courses with enrollments:', coursesWithEnrollments.map(c => ({
      name: c.name,
      enrolledStudentsCount: c.enrolledStudents?.length || 0
    })));

    return coursesWithEnrollments;
  }

  async enrollStudentInCourse(courseId: string, studentId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({ 
      where: { id: courseId },
      relations: ['class']
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingStudents = course.students || [];
    if (existingStudents.includes(studentId)) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    course.students = [...existingStudents, studentId];
    const savedCourse = await this.courseRepository.save(course);
    
    // Send notifications to student and parents
    await this.sendCourseEnrollmentNotifications(studentId, course);
    
    return savedCourse;
  }

  async unenrollStudentFromCourse(courseId: string, studentId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingStudents = course.students || [];
    if (!existingStudents.includes(studentId)) {
      throw new NotFoundException('Student is not enrolled in this course');
    }

    course.students = existingStudents.filter(id => id !== studentId);
    return this.courseRepository.save(course);
  }

  async isStudentEnrolledInCourse(courseId: string, studentId: string): Promise<boolean> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      return false;
    }

    const students = course.students || [];
    return students.includes(studentId);
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findCourseById(id);
    const oldTeacherId = course.teacherId;
    
    // Validate new teacher if provided
    let newTeacher = null;
    if (updateCourseDto.teacherId !== undefined) {
      if (updateCourseDto.teacherId) {
        newTeacher = await this.userRepository.findOne({
          where: { id: updateCourseDto.teacherId, role: Role.Teacher }
        });
        if (!newTeacher) {
          throw new BadRequestException('Selected teacher not found or does not have teacher role. Please select a valid teacher.');
        }
      }
    }

    if (updateCourseDto.classId) {
      const classEntity = await this.classRepository.findOne({ 
        where: { id: updateCourseDto.classId } 
      });
      if (!classEntity) {
        throw new BadRequestException('Selected class not found. Please select a valid class.');
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
    if (updateCourseDto.teacherId !== undefined) {
      course.teacherId = updateCourseDto.teacherId;
    }
    if (updateCourseDto.classId) {
      course.classId = updateCourseDto.classId;
    }
    if (updateCourseDto.creatorTimezone) {
      course.creatorTimezone = updateCourseDto.creatorTimezone;
    }

    const savedCourse = await this.courseRepository.save(course);

    // Handle teacher assignment changes
    if (updateCourseDto.teacherId !== undefined && oldTeacherId !== updateCourseDto.teacherId) {
      // Remove course from old teacher's courses array
      if (oldTeacherId) {
        const oldTeacherEntity = await this.teacherRepository.findOne({
          where: { id: oldTeacherId }
        });
        if (oldTeacherEntity) {
          oldTeacherEntity.courses = oldTeacherEntity.courses.filter(courseId => courseId !== id);
          await this.teacherRepository.save(oldTeacherEntity);
          console.log('Removed course ID from old teacher courses array:', id);
        }
      }

      // Add course to new teacher's courses array
      if (updateCourseDto.teacherId) {
        const newTeacherEntity = await this.teacherRepository.findOne({
          where: { id: updateCourseDto.teacherId }
        });
        if (newTeacherEntity) {
          const currentCourses = newTeacherEntity.courses || [];
          if (!currentCourses.includes(id)) {
            newTeacherEntity.courses = [...currentCourses, id];
            await this.teacherRepository.save(newTeacherEntity);
            console.log('Added course ID to new teacher courses array:', id);
          }
        }
      }
    }

    return savedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.findCourseById(id);
    
    console.log(`🗑️ Starting cascading deletion for course: ${course.name} (${id})`);
    
    try {
      // Step 1: Delete assignment submissions first (they reference assignments)
      const assignments = await this.assignmentRepository.find({ where: { courseId: id } });
      for (const assignment of assignments) {
        await this.assignmentSubmissionRepository.delete({ assignmentId: assignment.id });
        console.log(`✅ Deleted submissions for assignment: ${assignment.name}`);
      }
      
      // Step 2: Delete post attachments (they reference posts)
      const posts = await this.postRepository.find({ where: { courseId: id } });
      for (const post of posts) {
        await this.postAttachmentRepository.delete({ postId: post.id });
        console.log(`✅ Deleted attachments for post: ${post.subject}`);
      }
      
      // Step 3: Delete all materials that directly reference the course
      await this.assignmentRepository.delete({ courseId: id });
      console.log('✅ Deleted assignments');
      
      await this.postRepository.delete({ courseId: id });
      console.log('✅ Deleted posts');
      
      await this.attendanceRepository.delete({ courseId: id });
      console.log('✅ Deleted attendance records');
      
      // Step 4: Delete folders and files (folders might contain files)
      const folders = await this.folderRepository.find({ where: { courseId: id } });
      for (const folder of folders) {
        // Delete files in this folder first
        await this.fileRepository.delete({ folderId: folder.id });
        console.log(`✅ Deleted files in folder: ${folder.name}`);
      }
      await this.folderRepository.delete({ courseId: id });
      console.log('✅ Deleted folders');
      
      // Delete any remaining files that reference the course directly
      await this.fileRepository.delete({ courseId: id });
      console.log('✅ Deleted remaining files');
      
      // Step 5: Delete zoom meetings that reference this course
      await this.zoomMeetingRepository.delete({ courseId: id });
      console.log('✅ Deleted zoom meetings');
      
      // Step 6: Remove course ID from class's courseIds array
      const targetClass = await this.classRepository.findOne({
        where: { id: course.classId }
      });
      
      if (targetClass && targetClass.courseIds) {
        targetClass.courseIds = targetClass.courseIds.filter(courseId => courseId !== id);
        await this.classRepository.save(targetClass);
        console.log('✅ Removed course ID from class courseIds array');
      }
      
      // Step 7: Remove course ID from teacher's courses array if teacher is assigned
      if (course.teacherId) {
        const teacherEntity = await this.teacherRepository.findOne({
          where: { id: course.teacherId }
        });
        if (teacherEntity) {
          teacherEntity.courses = teacherEntity.courses.filter(courseId => courseId !== id);
          await this.teacherRepository.save(teacherEntity);
          console.log('✅ Removed course ID from teacher courses array');
        }
      }
      
      // Step 8: Finally, delete the course itself
      await this.courseRepository.delete(id);
      console.log(`✅ Successfully deleted course: ${course.name}`);
      
    } catch (error) {
      console.error(`❌ Error during cascading deletion for course ${id}:`, error);
      throw new BadRequestException(`Failed to delete course and all related data: ${error.message}`);
    }
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

  // Helper method to get students in a course
  async getStudentsInCourse(courseId: string): Promise<any[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['class']
    });

    if (!course) {
      return [];
    }

    // Only get students from course.students array
    // Class enrollment and individual enrollment both add students to this array
    const studentIds = course.students || [];

    if (studentIds.length === 0) {
      return [];
    }

    // Get students with their parent information, similar to class students endpoint
    const students = await this.studentRepository.find({
      where: { id: In(studentIds) },
      relations: ['user', 'parent']
    });

    return students;
  }

  /**
   * Send notifications to student and parents when student is enrolled in a course
   */
  private async sendCourseEnrollmentNotifications(studentId: string, course: any): Promise<void> {
    try {
      console.log(`📢 Sending course enrollment notifications for student ${studentId} in course: ${course.name}`);
      
      // Get student information
      const student = await this.userRepository.findOne({
        where: { id: studentId },
        select: ['id', 'firstName', 'lastName']
      });

      if (!student) {
        console.warn(`Student not found for notification: ${studentId}`);
        return;
      }

      const childName = `${student.firstName} ${student.lastName}`;
      const courseName = course.name;
      const className = course.class?.name || 'Unknown Class';

      // 1. Send notification to the student
      try {
        await this.notificationsService.createStudentAddedToCourseNotification(
          studentId,
          courseName,
          className,
          {
            courseId: course.id,
            classId: course.classId,
            enrollmentDate: new Date().toISOString()
          }
        );
        console.log(`✅ Sent course enrollment notification to student: ${childName}`);
      } catch (error) {
        console.error(`❌ Failed to send notification to student ${childName}:`, error);
      }

      // 2. Send notification to parents
      try {
        const parents = await this.getParentsOfStudent(studentId);
        
        if (parents.length > 0) {
          // Send notification to each parent
          for (const parent of parents) {
            await this.notificationsService.createChildAddedToCourseNotification(
              parent.id,
              childName,
              courseName,
              className,
              {
                studentId: studentId,
                courseId: course.id,
                classId: course.classId,
                enrollmentDate: new Date().toISOString()
              }
            );
          }
          
          console.log(`✅ Sent course enrollment notifications to ${parents.length} parents for student: ${childName}`);
        } else {
          console.log(`ℹ️ No parents found for student: ${childName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send parent notifications for student ${childName}:`, error);
      }
    } catch (error) {
      console.error('❌ Failed to send notifications for course enrollment:', error);
      // Don't throw error - notification failure shouldn't break the main enrollment operation
    }
  }

  /**
   * Helper method to get parents of a student
   */
  private async getParentsOfStudent(studentId: string): Promise<any[]> {
    try {
      // Get parent IDs from the parents table where studentId is in the studentIds array
      const parentData = await this.userRepository.manager.query(`
        SELECT p.id 
        FROM parents p
        WHERE $1 = ANY(p."studentIds")
      `, [studentId]);

      const parentIds = parentData.map(row => row.id);

      if (parentIds.length === 0) {
        return [];
      }

      return await this.userRepository.find({
        where: { id: In(parentIds) },
        select: ['id', 'firstName', 'lastName', 'email']
      });
    } catch (error) {
      console.error('Error getting parents of student:', error);
      return [];
    }
  }
}

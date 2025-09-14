import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { ZoomMeeting } from './entities/zoom-meeting.entity';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { UpdateZoomMeetingDto } from './dto/update-zoom-meeting.dto';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { ZoomApiService } from './services/zoom-api.service';

@Injectable()
export class ZoomService {
  constructor(
    @InjectRepository(ZoomMeeting)
    private readonly zoomMeetingRepository: Repository<ZoomMeeting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly zoomApiService: ZoomApiService,
  ) {}

  async createMeeting(createZoomMeetingDto: CreateZoomMeetingDto, userId: string): Promise<ZoomMeeting> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the course exists
    const course = await this.courseRepository.findOne({ where: { id: createZoomMeetingDto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    try {
      // Create Zoom meeting via API
      const zoomMeetingData = {
        topic: createZoomMeetingDto.title,
        agenda: createZoomMeetingDto.description || `Meeting for ${createZoomMeetingDto.title}`,
        startTime: createZoomMeetingDto.date && createZoomMeetingDto.time 
          ? new Date(`${createZoomMeetingDto.date}T${createZoomMeetingDto.time}:00`).toISOString()
          : undefined,
        duration: 120, // 120 minutes as requested
        password: undefined, // Let Zoom generate password
      };

      const zoomMeeting = await this.zoomApiService.createZoomMeeting(zoomMeetingData);

      // Create meeting record in database
      const meeting = this.zoomMeetingRepository.create({
        ...createZoomMeetingDto,
        invitationLink: zoomMeeting.join_url,
        zoomMeetingId: zoomMeeting.id,
        zoomPassword: zoomMeeting.password,
        zoomStartUrl: zoomMeeting.start_url,
        createdById: userId,
        status: this.calculateMeetingStatus(createZoomMeetingDto),
      });

      const savedMeeting = await this.zoomMeetingRepository.save(meeting);

      // Create attendance records for all students when meeting is created
      await this.createAttendanceRecordsForMeeting(savedMeeting, createZoomMeetingDto.courseId);

      // Send notifications to students about the new zoom session
      try {
        const students = await this.getStudentsInCourse(createZoomMeetingDto.courseId);
        if (students.length > 0) {
          const studentIds = students.map(student => student.id);
          await this.notificationsService.createZoomSessionNotification(
            studentIds,
            savedMeeting.title,
            'published',
            savedMeeting.date ? new Date(savedMeeting.date + ' ' + (savedMeeting.time || '00:00')) : undefined,
            {
              meetingId: savedMeeting.id,
              courseId: createZoomMeetingDto.courseId,
              meetingUrl: savedMeeting.invitationLink,
              zoomPassword: savedMeeting.zoomPassword
            }
          );
          console.log('✅ Zoom session published notifications sent to', students.length, 'students');
        }
      } catch (error) {
        console.error('❌ Failed to send zoom session notifications:', error);
      }

      // Return the meeting with the createdBy relationship loaded
      return await this.findMeetingById(savedMeeting.id);
    } catch (error) {
      console.error('❌ Failed to create Zoom meeting:', error);
      throw new BadRequestException('Failed to create Zoom meeting: ' + error.message);
    }
  }

  // Helper method to get students in a course
  private async getStudentsInCourse(courseId: string): Promise<User[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['class']
    });

    if (!course?.classId) {
      console.log('❌ No classId found for course:', courseId);
      return [];
    }

    // Get the class with students
    const classEntity = await this.courseRepository.manager.query(`
      SELECT students 
      FROM classes 
      WHERE id = $1
    `, [course.classId]);

    if (!classEntity || classEntity.length === 0) {
      console.log('❌ No class found with id:', course.classId);
      return [];
    }

    const classStudents = classEntity[0].students;
    console.log('👥 Students in class (raw):', classStudents);
    console.log('👥 Students type:', typeof classStudents);
    
    let studentIds: string[] = [];
    
    // Check if students field has data
    if (classStudents && classStudents !== '') {
      // Handle both array and comma-separated string formats
      if (Array.isArray(classStudents)) {
        studentIds = classStudents;
        console.log('✅ Found students array in class:', studentIds);
      } else if (typeof classStudents === 'string') {
        // Parse comma-separated string
        studentIds = classStudents.split(',').map(id => id.trim()).filter(id => id.length > 0);
        console.log('✅ Found students string in class, parsed to array:', studentIds);
      }
    }

    if (studentIds.length === 0) {
      console.log('❌ No students found in class:', course.classId);
      return [];
    }

    console.log('🔍 Looking up students with IDs:', studentIds);
    const students = await this.userRepository.find({
      where: { id: In(studentIds) },
      select: ['id', 'firstName', 'lastName', 'email']
    });

    console.log('✅ Found students:', students.length, students.map(s => `${s.firstName} ${s.lastName}`));
    return students;
  }

  async findAllMeetings(): Promise<ZoomMeeting[]> {
    return await this.zoomMeetingRepository.find({
      relations: ['createdBy', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingsByCourse(courseId: string): Promise<ZoomMeeting[]> {
    return await this.zoomMeetingRepository.find({
      where: { courseId },
      relations: ['createdBy', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingsByUser(userId: string): Promise<ZoomMeeting[]> {
    return await this.zoomMeetingRepository.find({
      where: { createdById: userId },
      relations: ['createdBy', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingById(id: string): Promise<ZoomMeeting> {
    const meeting = await this.zoomMeetingRepository.findOne({
      where: { id },
      relations: ['createdBy', 'course'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async updateMeeting(id: string, updateZoomMeetingDto: UpdateZoomMeetingDto, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only update your own meetings');
    }

    Object.assign(meeting, updateZoomMeetingDto);
    meeting.status = this.calculateMeetingStatus({ ...meeting, ...updateZoomMeetingDto });
    
    return await this.zoomMeetingRepository.save(meeting);
  }

  async deleteMeeting(id: string, userId: string): Promise<void> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own meetings');
    }

    // Use a database transaction to ensure data consistency
    await this.zoomMeetingRepository.manager.transaction(async (transactionalEntityManager) => {
      try {
        console.log('Deleting meeting:', meeting.title, 'ID:', id);
        
        // First, delete the Zoom meeting from Zoom's servers if it exists
        if (meeting.zoomMeetingId) {
          try {
            await this.zoomApiService.deleteMeeting(meeting.zoomMeetingId);
            console.log('✅ Deleted Zoom meeting from Zoom servers');
          } catch (error) {
            console.error('⚠️ Failed to delete Zoom meeting from servers:', error);
            // Continue with database deletion even if Zoom deletion fails
          }
        }
        
        // Delete all associated attendance records
        const attendanceRecords = await transactionalEntityManager.find('Attendance', {
          where: { meetingId: id }
        });
        
        console.log('Found attendance records to delete:', attendanceRecords.length);
        
        if (attendanceRecords.length > 0) {
          await transactionalEntityManager.remove('Attendance', attendanceRecords);
          console.log('✅ Deleted', attendanceRecords.length, 'attendance records');
        }
        
        // Then delete the meeting from database
        await transactionalEntityManager.remove('ZoomMeeting', meeting);
        console.log('✅ Successfully deleted meeting:', meeting.title);
        
      } catch (error) {
        console.error('Error deleting meeting in transaction:', error);
        throw new Error(`Failed to delete meeting: ${error.message}`);
      }
    });
  }

  async incrementJoinCount(id: string, userId?: string, courseId?: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    console.log('🚀 incrementJoinCount called:', { id, userId, courseId, meetingTitle: meeting.title });
    
    // Only increment join count if this is a new user joining
    if (userId) {
      // Check if this user has already joined this meeting
      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          meetingId: id,
          studentId: userId, // Using studentId field to store any user ID
          status: 'present'
        }
      });
      
      // Only increment if this is the first time this user is joining
      if (!existingAttendance) {
        meeting.joinCount += 1;
        console.log(`✅ New user joined meeting ${meeting.title}. Join count: ${meeting.joinCount}`);
      } else {
        console.log(`⚠️ User ${userId} already joined meeting ${meeting.title}. Join count remains: ${meeting.joinCount}`);
      }
    } else {
      // If no userId provided, increment anyway (for backward compatibility)
      meeting.joinCount += 1;
    }
    
    // Auto-mark attendance if userId and courseId are provided
    if (userId && courseId && meeting.date) {
      console.log('🎯 Calling markAttendanceForStudent with:', { userId, courseId, meetingId: meeting.id });
      await this.markAttendanceForStudent(meeting, userId, courseId);
    } else {
      console.log('❌ Not calling markAttendanceForStudent because:', { 
        hasUserId: !!userId, 
        hasCourseId: !!courseId, 
        hasMeetingDate: !!meeting.date 
      });
    }
    
    return await this.zoomMeetingRepository.save(meeting);
  }

  // Fix attendance records for a meeting - ensure all students are included
  async fixAttendanceForMeeting(meeting: ZoomMeeting, courseId: string): Promise<number> {
    try {
      console.log('Fixing attendance records for meeting:', meeting.title, 'Course ID:', courseId);
      
      // Get all students enrolled in this course
      const students = await this.getCourseStudents(courseId);
      console.log('Found students for fixing:', students.length, students.map(s => s.fullName || `${s.firstName} ${s.lastName}`));
      
      if (students.length === 0) {
        console.log('No students found for course:', courseId);
        return 0;
      }

      // Get the actual day name from the meeting date
      const meetingDate = new Date(meeting.date);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const actualDay = dayNames[meetingDate.getDay()];
      
      // Format the actual meeting time
      const actualTime = meeting.time && meeting.period ? `${meeting.time} ${meeting.period}` : 'Scheduled Time';
      
      console.log('Meeting data - Day:', actualDay, 'Time:', actualTime, 'Date:', meetingDate);
      
      let createdCount = 0;
      
      for (const student of students) {
        // Check if attendance record already exists for this meeting
        const existingAttendance = await this.attendanceRepository.findOne({
          where: {
            courseId,
            studentId: student.id,
            meetingId: meeting.id
          }
        });

        if (!existingAttendance) {
          const attendance = this.attendanceRepository.create({
            courseId,
            studentId: student.id,
            date: meetingDate,
            day: actualDay,
            time: actualTime,
            meetingId: meeting.id,
            status: 'absent', // Default to absent, will be updated when student joins
            markedBy: meeting.createdById,
            markedAt: new Date()
          });
          await this.attendanceRepository.save(attendance);
          createdCount++;
          console.log('✅ Created attendance record for student:', student.fullName || `${student.firstName} ${student.lastName}`, 'as ABSENT');
        } else {
          console.log('Attendance record already exists for student:', student.fullName || `${student.firstName} ${student.lastName}`);
        }
      }
      
      console.log('✅ Fixed attendance records - created/updated', createdCount, 'records for', students.length, 'students');
      return students.length;
    } catch (error) {
      console.error('Error fixing attendance records for meeting:', error);
      return 0;
    }
  }

  // Create attendance records for all students when a meeting is created
  async createAttendanceRecordsForMeeting(meeting: ZoomMeeting, courseId: string): Promise<void> {
    try {
      console.log('Creating attendance records for meeting:', meeting.title, 'Course ID:', courseId);
      
      // Get all students enrolled in this course
      const students = await this.getCourseStudents(courseId);
      console.log('Found students:', students.length, students.map(s => s.fullName));
      
      if (students.length > 0) {
        // Create attendance records for all students using actual meeting data
        const attendanceRecords: Attendance[] = [];
        
        // Get the actual day name from the meeting date
        const meetingDate = new Date(meeting.date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const actualDay = dayNames[meetingDate.getDay()];
        
        // Format the actual meeting time
        const actualTime = meeting.time && meeting.period ? `${meeting.time} ${meeting.period}` : 'Scheduled Time';
        
        console.log('Meeting data - Day:', actualDay, 'Time:', actualTime, 'Date:', meetingDate);
        
        for (const student of students) {
          // Check if attendance record already exists for this meeting
          const existingAttendance = await this.attendanceRepository.findOne({
            where: {
              courseId,
              studentId: student.id,
              meetingId: meeting.id
            }
          });

          if (!existingAttendance) {
            const attendance = this.attendanceRepository.create({
              courseId,
              studentId: student.id,
              date: meetingDate,
              day: actualDay,
              time: actualTime,
              meetingId: meeting.id,
              status: 'absent', // Default to absent, will be updated when student joins
              markedBy: meeting.createdById,
              markedAt: new Date()
            });
            attendanceRecords.push(attendance);
            console.log('Created attendance record for student:', student.fullName, 'as ABSENT');
          } else {
            console.log('Attendance record already exists for student:', student.fullName);
          }
        }
        
        if (attendanceRecords.length > 0) {
          await this.attendanceRepository.save(attendanceRecords);
          console.log('✅ Saved', attendanceRecords.length, 'attendance records - all marked as ABSENT');
        } else {
          console.log('No new attendance records to save');
        }
      } else {
        console.log('❌ No students found for course:', courseId);
        // Try to get students from a different approach
        console.log('Attempting alternative method to get students...');
        const alternativeStudents = await this.getStudentsAlternative(courseId);
        console.log('Alternative method found students:', alternativeStudents.length);
      }
    } catch (error) {
      console.error('Error creating attendance records for meeting:', error);
      // Don't throw error as this shouldn't interrupt the meeting creation process
    }
  }

  // Alternative method to get students if the first method fails
  private async getStudentsAlternative(courseId: string): Promise<User[]> {
    try {
      // Get students through class enrollment (since students are enrolled in classes, not individual courses)
      const students = await this.attendanceRepository.query(`
        SELECT DISTINCT u.* FROM users u
        JOIN students s ON u.id = s.id
        JOIN courses c ON s.class_id = c.class_id
        WHERE c.id = $1 AND u.role = 'student'
      `, [courseId]);
      
      console.log('Alternative method - students found through class:', students.length);
      return students;
    } catch (error) {
      console.error('Alternative method failed:', error);
      return [];
    }
  }

  // Auto-mark attendance when student joins meeting
  private async markAttendanceForStudent(meeting: ZoomMeeting, studentId: string, courseId: string): Promise<void> {
    try {
      console.log('🎯 Marking attendance for student:', { studentId, courseId, meetingId: meeting.id });
      
      // First, let's see what attendance records exist for this meeting
      const allAttendanceRecords = await this.attendanceRepository.find({
        where: {
          courseId,
          meetingId: meeting.id
        }
      });
      
      console.log('📊 All attendance records for this meeting:', allAttendanceRecords.map(r => ({
        id: r.id,
        studentId: r.studentId,
        status: r.status,
        date: r.date
      })));
      
      // Find the attendance record for this specific meeting and student
      const attendanceRecord = await this.attendanceRepository.findOne({
        where: {
          courseId,
          studentId,
          meetingId: meeting.id
        }
      });

      console.log('🔍 Found specific attendance record:', attendanceRecord);

      if (attendanceRecord) {
        // Update the attendance status to present
        attendanceRecord.status = 'present';
        attendanceRecord.markedBy = studentId; // The student who joined
        attendanceRecord.markedAt = new Date();
        await this.attendanceRepository.save(attendanceRecord);
        console.log('Successfully marked student as present:', studentId);
      } else {
        console.log('No attendance record found for student:', studentId);
        // Create a new attendance record if it doesn't exist
        const newAttendance = this.attendanceRepository.create({
          courseId,
          studentId,
          date: new Date(meeting.date),
          day: meeting.date ? new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long' }) : null,
          time: meeting.time && meeting.period ? `${meeting.time} ${meeting.period}` : null,
          meetingId: meeting.id,
          status: 'present',
          markedBy: studentId,
          markedAt: new Date()
        });
        await this.attendanceRepository.save(newAttendance);
        console.log('Created new attendance record and marked as present:', studentId);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      // Don't throw error as this is automatic and shouldn't interrupt the join process
    }
  }

  // Get course schedule for a specific date
  private getCourseScheduleForDate(date: string): { day: string; time: string } | null {
    const dayOfWeek = new Date(date).getDay();
    
    // Map day numbers to day names and times (matching frontend schedule)
    const scheduleMap = {
      1: { day: 'Monday', time: '09:00-11:00' },    // Monday
      3: { day: 'Wednesday', time: '14:00-16:00' }, // Wednesday  
      5: { day: 'Friday', time: '10:00-12:00' }     // Friday
    };
    
    return scheduleMap[dayOfWeek] || null;
  }

  async startMeeting(id: string, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only start your own meetings');
    }

    // Update meeting status to 'started' if it's not already ended or cancelled
    if (meeting.status !== 'ended' && meeting.status !== 'cancelled') {
      meeting.status = 'started';
      const savedMeeting = await this.zoomMeetingRepository.save(meeting);

      // Send notifications to students about the meeting starting
      try {
        const students = await this.getStudentsInCourse(meeting.courseId);
        if (students.length > 0) {
          const studentIds = students.map(student => student.id);
          await this.notificationsService.createZoomSessionNotification(
            studentIds,
            savedMeeting.title,
            'started',
            savedMeeting.date ? new Date(savedMeeting.date + ' ' + (savedMeeting.time || '00:00')) : undefined,
            {
              meetingId: savedMeeting.id,
              courseId: meeting.courseId,
              meetingUrl: savedMeeting.invitationLink,
              zoomPassword: savedMeeting.zoomPassword
            }
          );
          console.log('✅ Zoom session started notifications sent to', students.length, 'students');
        }
      } catch (error) {
        console.error('❌ Failed to send zoom session started notifications:', error);
      }

      return savedMeeting;
    }

    return meeting;
  }

  async endMeeting(id: string, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only end your own meetings');
    }

    meeting.status = 'ended';
    const savedMeeting = await this.zoomMeetingRepository.save(meeting);

    // Check attendance and send notifications for absent students
    await this.checkAttendanceAndSendNotifications(meeting);

    return savedMeeting;
  }

  async cancelMeeting(id: string, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only cancel your own meetings');
    }

    // Only allow canceling upcoming or scheduled meetings
    const currentStatus = this.calculateMeetingStatus(meeting);
    if (currentStatus === 'live' || currentStatus === 'ended') {
      throw new BadRequestException('Cannot cancel a meeting that has already started or ended');
    }

    // Use a database transaction to ensure data consistency
    await this.zoomMeetingRepository.manager.transaction(async (transactionalEntityManager) => {
      try {
        console.log('Cancelling meeting:', meeting.title, 'ID:', id);
        
        // First, delete all associated attendance records
        const attendanceRecords = await transactionalEntityManager.find('Attendance', {
          where: { meetingId: id }
        });
        
        console.log('Found attendance records to delete:', attendanceRecords.length);
        
        if (attendanceRecords.length > 0) {
          await transactionalEntityManager.remove('Attendance', attendanceRecords);
          console.log('✅ Deleted', attendanceRecords.length, 'attendance records for cancelled meeting');
        }
        
        // Then update the meeting status to cancelled
        meeting.status = 'cancelled';
        await transactionalEntityManager.save('ZoomMeeting', meeting);
        console.log('✅ Successfully cancelled meeting:', meeting.title);
        
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        throw new Error(`Failed to cancel meeting: ${error.message}`);
      }
    });

    return meeting;
  }

  async getMeetingsByStatus(status: string): Promise<ZoomMeeting[]> {
    const meetings = await this.findAllMeetings();
    return meetings.filter(meeting => this.calculateMeetingStatus(meeting) === status);
  }

  async searchMeetings(searchTerm: string): Promise<ZoomMeeting[]> {
    const queryBuilder = this.zoomMeetingRepository.createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.createdBy', 'user')
      .leftJoinAndSelect('meeting.course', 'course')
      .where('meeting.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('meeting.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.firstName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.lastName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('course.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('meeting.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  // Create attendance records for existing meetings that don't have them
  async createMissingAttendanceRecords(): Promise<void> {
    try {
      // Get all meetings that have a courseId
      const meetings = await this.zoomMeetingRepository.find({
        where: { courseId: Not(IsNull()) },
        relations: ['course']
      });

      for (const meeting of meetings) {
        if (meeting.courseId) {
          // Check if attendance records already exist for this meeting
          const existingAttendance = await this.attendanceRepository.findOne({
            where: { meetingId: meeting.id }
          });

          if (!existingAttendance) {
            // Create attendance records for this meeting
            await this.createAttendanceRecordsForMeeting(meeting, meeting.courseId);
          }
        }
      }
    } catch (error) {
      console.error('Error creating missing attendance records:', error);
    }
  }

  private calculateMeetingStatus(meeting: any): string {
    if (!meeting.date || !meeting.time || !meeting.period) return 'scheduled';
    
    // If meeting was manually ended or cancelled, keep it as is
    if (meeting.status === 'ended') return 'ended';
    if (meeting.status === 'cancelled') return 'cancelled';
    
    const now = new Date();
    
    // Parse time with AM/PM period
    const [hours, minutes] = meeting.time.split(':').map(Number);
    let hour24 = hours;
    
    if (meeting.period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (meeting.period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    // Create meeting datetime
    const meetingDateTime = new Date(meeting.date);
    meetingDateTime.setHours(hour24, minutes, 0, 0);
    
    // Only check if meeting has started, NEVER auto-end it
    // Meetings only end when manually ended by the host/admin
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime) return 'live';
    
    return 'scheduled';
  }

  async updateMeetingStatuses(): Promise<void> {
    const meetings = await this.zoomMeetingRepository.find();
    
    for (const meeting of meetings) {
      const newStatus = this.calculateMeetingStatus(meeting);
      if (meeting.status !== newStatus) {
        meeting.status = newStatus;
        await this.zoomMeetingRepository.save(meeting);
      }
    }
  }

  // Get all students enrolled in a course (through class enrollment)
  private async getCourseStudents(courseId: string): Promise<User[]> {
    console.log('🔍 Getting students for course:', courseId);
    
    try {
      // First try the direct class relation approach
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['class']
      });

      if (!course) {
        console.log('❌ Course not found:', courseId);
        throw new NotFoundException('Course not found');
      }

      console.log('✅ Course found:', course.name, 'Class ID:', course.classId);
      console.log('📚 Class relation:', course.class?.name);
      console.log('👥 Students array in class:', course.class?.students?.length || 0);
      console.log('👥 Student IDs in class:', course.class?.students);
      
      // Get students from the class that contains this course
      let students: User[] = [];
      
      if (course.class?.students && course.class.students.length > 0) {
        // Get students by their IDs from the students array
        students = await this.userRepository.find({
          where: { 
            id: In(course.class.students),
            role: Role.Student 
          }
        });
        console.log('👥 Students found by IDs:', students.length, students.map(s => s.fullName || `${s.firstName} ${s.lastName}`));
      }
      
      // If no students found through class relation, try getting students by classId
      if (students.length === 0) {
        console.log('⚠️ No students found through class relation, trying to get students by classId...');
        
        // Get the class first to get student IDs
        const classEntity = await this.courseRepository.manager.findOne('Class', {
          where: { id: course.classId }
        });
        
        console.log('📋 Class entity found:', classEntity ? 'Yes' : 'No');
        console.log('📋 Class entity students:', (classEntity as any)?.students);
        
        if (classEntity && (classEntity as any).students && (classEntity as any).students.length > 0) {
          console.log('✅ Found class with student IDs:', (classEntity as any).students);
          
          // Get students by their IDs
          students = await this.userRepository.find({
            where: { 
              id: In((classEntity as any).students),
              role: Role.Student 
            }
          });
          
          console.log('✅ Found students by IDs:', students.length, students.map(s => s.fullName || `${s.firstName} ${s.lastName}`));
        } else {
          console.log('❌ No students found in class entity');
        }
      }
      
      // If still no students, try a raw query approach
      if (students.length === 0) {
        console.log('🔍 Trying raw query approach...');
        
        // Use raw query to get students from the class
        const rawStudents = await this.userRepository.query(`
          SELECT u.* FROM users u
          JOIN classes c ON c.students @> ARRAY[u.id::text]
          JOIN courses co ON co."classId" = c.id
          WHERE co.id = $1 AND u.role = 'student'
        `, [courseId]);
        
        console.log('🔍 Raw query found students:', rawStudents.length, rawStudents.map(s => s.fullName || `${s.first_name} ${s.last_name}`));
        students = rawStudents;
      }
      
      console.log('🎯 Final students count:', students.length);
      console.log('🎯 Final students:', students.map(s => s.fullName || `${s.firstName} ${s.lastName}`));
      
      return students;
    } catch (error) {
      console.error('Error getting course students:', error);
      return [];
    }
  }

  // Debug method to check student retrieval
  async debugCourseStudents(courseId: string): Promise<User[]> {
    console.log('🐛 DEBUG: Getting students for course:', courseId);
    return await this.getCourseStudents(courseId);
  }

  // Debug method to check attendance records for a course
  async debugAttendanceForCourse(courseId: string): Promise<{ message: string; meetings: any[]; attendanceRecords: any[] }> {
    console.log('🐛 DEBUG: Checking attendance for course:', courseId);
    
    // Get all meetings for this course
    const meetings = await this.zoomMeetingRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' }
    });
    
    console.log('📅 Found meetings:', meetings.length, meetings.map(m => ({ id: m.id, title: m.title, date: m.date })));
    
    // Get all attendance records for this course
    const attendanceRecords = await this.attendanceRepository.find({
      where: { courseId },
      relations: ['student', 'meeting'],
      order: { date: 'DESC' }
    });
    
    console.log('📊 Found attendance records:', attendanceRecords.length);
    console.log('📊 Sample attendance record:', attendanceRecords[0] ? {
      id: attendanceRecords[0].id,
      studentId: attendanceRecords[0].studentId,
      meetingId: attendanceRecords[0].meetingId,
      status: attendanceRecords[0].status,
      studentName: attendanceRecords[0].student?.fullName || `${attendanceRecords[0].student?.firstName} ${attendanceRecords[0].student?.lastName}`,
      meetingTitle: attendanceRecords[0].meeting?.title
    } : 'No records');
    
    return {
      message: `Found ${meetings.length} meetings and ${attendanceRecords.length} attendance records for course ${courseId}`,
      meetings: meetings.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time,
        period: m.period,
        status: m.status,
        createdAt: m.createdAt
      })),
      attendanceRecords: attendanceRecords.map(a => ({
        id: a.id,
        studentId: a.studentId,
        meetingId: a.meetingId,
        status: a.status,
        date: a.date,
        studentName: a.student?.fullName || `${a.student?.firstName} ${a.student?.lastName}`,
        meetingTitle: a.meeting?.title
      }))
    };
  }

  // Clean up orphaned attendance records (attendance without valid meetings)
  async cleanupOrphanedAttendance(): Promise<number> {
    try {
      console.log('Cleaning up orphaned attendance records...');
      
      // Find all attendance records that reference non-existent meetings
      const orphanedRecords = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoin('attendance.meeting', 'meeting')
        .where('meeting.id IS NULL')
        .andWhere('attendance.meetingId IS NOT NULL')
        .getMany();
      
      console.log('Found orphaned attendance records:', orphanedRecords.length);
      
      if (orphanedRecords.length > 0) {
        await this.attendanceRepository.remove(orphanedRecords);
        console.log('✅ Cleaned up', orphanedRecords.length, 'orphaned attendance records');
      }
      
      return orphanedRecords.length;
    } catch (error) {
      console.error('Error cleaning up orphaned attendance records:', error);
      return 0;
    }
  }

  // Mark bulk attendance (reuse from materials service)
  private async markBulkAttendance(courseId: string, attendanceData: any, markerId: string): Promise<Attendance[]> {
    const attendanceRecords: Attendance[] = [];
    const attendanceDate = new Date(attendanceData.date);

    // Process each student's attendance
    for (const studentAttendance of attendanceData.students) {
      // Check if attendance already exists for this student on this date and meeting
      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          courseId,
          studentId: studentAttendance.id,
          date: attendanceDate,
          meetingId: attendanceData.meetingId
        }
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = studentAttendance.status;
        existingAttendance.day = attendanceData.day;
        existingAttendance.time = attendanceData.time;
        existingAttendance.meetingId = attendanceData.meetingId;
        existingAttendance.markedBy = markerId;
        existingAttendance.markedAt = new Date();
        attendanceRecords.push(await this.attendanceRepository.save(existingAttendance));
      } else {
        // Create new attendance record
        const attendance = this.attendanceRepository.create({
          courseId,
          studentId: studentAttendance.id,
          date: attendanceDate,
          day: attendanceData.day,
          time: attendanceData.time,
          meetingId: attendanceData.meetingId,
          status: studentAttendance.status,
          markedBy: markerId,
          markedAt: new Date()
        });
        attendanceRecords.push(await this.attendanceRepository.save(attendance));
      }
    }

    return attendanceRecords;
  }

  // Check attendance after meeting ends and send notifications for absent students
  private async checkAttendanceAndSendNotifications(meeting: ZoomMeeting): Promise<void> {
    try {
      console.log(`🔍 Checking attendance for ended meeting: ${meeting.title} (ID: ${meeting.id})`);

      // Get all attendance records for this meeting
      const attendanceRecords = await this.attendanceRepository.find({
        where: { meetingId: meeting.id },
        relations: ['student']
      });

      console.log(`📊 Found ${attendanceRecords.length} attendance records for meeting ${meeting.id}`);

      // Find absent students
      const absentStudents = attendanceRecords.filter(record => record.status === 'absent');
      console.log(`❌ Found ${absentStudents.length} absent students`);

      if (absentStudents.length === 0) {
        console.log('✅ No absent students found - no notifications to send');
        return;
      }

      // Send notifications for each absent student
      for (const attendanceRecord of absentStudents) {
        const student = attendanceRecord.student;
        if (!student) {
          console.log(`⚠️ Student not found for attendance record ${attendanceRecord.id}`);
          continue;
        }

        console.log(`📤 Sending absent notification for student: ${student.firstName} ${student.lastName}`);

        // Send notification to the student
        await this.notificationsService.createAbsentNotification(
          student.id,
          meeting.title,
          false, // isParent = false
          undefined, // childName not needed for student
          {
            meetingId: meeting.id,
            courseId: meeting.courseId,
            sessionTitle: meeting.title,
            studentId: student.id
          }
        );

        // Find parent(s) of this student using reliable method
        console.log(`🔍 Looking for parents of student: ${student.id} (${student.firstName} ${student.lastName})`);
        
        // Get all parents and filter manually to ensure reliability
        const allParents = await this.parentRepository.find({ relations: ['user'] });
        console.log(`🔍 All parents in database:`, allParents.map(p => ({
          id: p.id,
          user: p.user ? `${p.user.firstName} ${p.user.lastName}` : 'No user',
          studentIds: p.studentIds
        })));
        
        const parents = allParents.filter(parent => 
          parent.studentIds && parent.studentIds.includes(student.id)
        );

        console.log(`👨‍👩‍👧‍👦 Found ${parents.length} parent(s) for student ${student.firstName} ${student.lastName}`);

        // Send notification to each parent
        for (const parent of parents) {
          if (parent.user) {
            console.log(`📤 Sending absent notification to parent: ${parent.user.firstName} ${parent.user.lastName} (ID: ${parent.user.id})`);
            
            try {
              await this.notificationsService.createAbsentNotification(
                parent.user.id,
                meeting.title,
                true, // isParent = true
                `${student.firstName} ${student.lastName}`, // childName
                {
                  meetingId: meeting.id,
                  courseId: meeting.courseId,
                  sessionTitle: meeting.title,
                  studentId: student.id,
                  parentId: parent.user.id
                }
              );
              console.log(`✅ Successfully sent notification to parent: ${parent.user.firstName} ${parent.user.lastName}`);
            } catch (error) {
              console.error(`❌ Failed to send notification to parent ${parent.user.firstName} ${parent.user.lastName}:`, error);
            }
          } else {
            console.log(`⚠️ Parent ${parent.id} has no associated user record`);
          }
        }
      }

      console.log(`✅ Attendance check completed for meeting ${meeting.title}`);
    } catch (error) {
      console.error(`❌ Error checking attendance for meeting ${meeting.id}:`, error);
    }
  }
}

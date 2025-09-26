import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { AgoraMeeting } from './entities/agora-meeting.entity';
import { CreateAgoraMeetingDto } from './dto/create-agora-meeting.dto';
import { UpdateAgoraMeetingDto } from './dto/update-agora-meeting.dto';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { AgoraTokenService } from './services/agora-token.service';
import { AgoraRecordingService } from './services/agora-recording.service';
import * as crypto from 'crypto';

@Injectable()
export class AgoraService {
  constructor(
    @InjectRepository(AgoraMeeting)
    private readonly agoraMeetingRepository: Repository<AgoraMeeting>,
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
    private readonly agoraTokenService: AgoraTokenService,
    private readonly agoraRecordingService: AgoraRecordingService,
  ) {}

  async createMeeting(createAgoraMeetingDto: CreateAgoraMeetingDto, userId: string): Promise<AgoraMeeting> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the course exists
    const course = await this.courseRepository.findOne({ where: { id: createAgoraMeetingDto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    try {
      // Generate unique channel name if not provided
      const channelName = createAgoraMeetingDto.channelName || 
        this.generateChannelName(createAgoraMeetingDto.title, course.name);

      // Create meeting record in database
      const meeting = this.agoraMeetingRepository.create({
        ...createAgoraMeetingDto,
        channelName,
        agoraMeetingId: crypto.randomUUID(),
        createdById: userId,
        status: this.calculateMeetingStatus(createAgoraMeetingDto),
      });

      const savedMeeting = await this.agoraMeetingRepository.save(meeting);

      // Create attendance records for all students when meeting is created
      await this.createAttendanceRecordsForMeeting(savedMeeting, createAgoraMeetingDto.courseId);

      // Send notifications to students about the new meeting
      try {
        const students = await this.getStudentsInCourse(createAgoraMeetingDto.courseId);
        if (students.length > 0) {
          const studentIds = students.map(student => student.id);
          await this.notificationsService.createZoomSessionNotification(
            studentIds,
            savedMeeting.title,
            'published',
            savedMeeting.date ? new Date(savedMeeting.date + ' ' + (savedMeeting.time || '00:00')) : undefined,
            {
              meetingId: savedMeeting.id,
              courseId: createAgoraMeetingDto.courseId,
              meetingUrl: `/meetings/agora/${savedMeeting.id}`,
              channelName: savedMeeting.channelName
            }
          );
          console.log('✅ Agora session published notifications sent to', students.length, 'students');
        }
      } catch (error) {
        console.error('❌ Failed to send agora session notifications:', error);
      }

      // Return the meeting with the createdBy relationship loaded
      return await this.findMeetingById(savedMeeting.id);
    } catch (error) {
      console.error('❌ Failed to create Agora meeting:', error);
      throw new BadRequestException('Failed to create Agora meeting: ' + error.message);
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
    
    let studentIds: string[] = [];
    
    if (classStudents && classStudents !== '') {
      if (Array.isArray(classStudents)) {
        studentIds = classStudents;
        console.log('✅ Found students array in class:', studentIds);
      } else if (typeof classStudents === 'string') {
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

  async findAllMeetings(): Promise<AgoraMeeting[]> {
    return await this.agoraMeetingRepository.find({
      relations: ['createdBy', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingsByCourse(courseId: string): Promise<AgoraMeeting[]> {
    return await this.agoraMeetingRepository.find({
      where: { courseId },
      relations: ['createdBy', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingsByUser(userId: string): Promise<AgoraMeeting[]> {
    return await this.agoraMeetingRepository.find({
      where: { createdById: userId },
      relations: ['createdBy', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMeetingById(id: string): Promise<AgoraMeeting> {
    const meeting = await this.agoraMeetingRepository.findOne({
      where: { id },
      relations: ['createdBy', 'course'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async updateMeeting(id: string, updateAgoraMeetingDto: UpdateAgoraMeetingDto, userId: string): Promise<AgoraMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only update your own meetings');
    }

    Object.assign(meeting, updateAgoraMeetingDto);
    meeting.status = this.calculateMeetingStatus({ ...meeting, ...updateAgoraMeetingDto });
    
    return await this.agoraMeetingRepository.save(meeting);
  }

  async deleteMeeting(id: string, userId: string): Promise<void> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own meetings');
    }

    // Use a database transaction to ensure data consistency
    await this.agoraMeetingRepository.manager.transaction(async (transactionalEntityManager) => {
      try {
        console.log('Deleting meeting:', meeting.title, 'ID:', id);
        
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
        await transactionalEntityManager.remove('AgoraMeeting', meeting);
        console.log('✅ Successfully deleted meeting:', meeting.title);
        
      } catch (error) {
        console.error('Error deleting meeting in transaction:', error);
        throw new Error(`Failed to delete meeting: ${error.message}`);
      }
    });
  }

  async joinMeeting(id: string, userId?: string, courseId?: string): Promise<AgoraMeeting> {
    const meeting = await this.findMeetingById(id);
    
    console.log('🚀 joinMeeting called:', { id, userId, courseId, meetingTitle: meeting.title });
    
    // Only increment join count if this is a new user joining
    if (userId) {
      // Check if this user has already joined this meeting
      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          meetingId: id,
          studentId: userId,
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
    }
    
    return await this.agoraMeetingRepository.save(meeting);
  }

  async startMeeting(id: string, userId: string): Promise<AgoraMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only start your own meetings');
    }

    // Update meeting status to 'started' if it's not already ended or cancelled
    if (meeting.status !== 'ended' && meeting.status !== 'cancelled') {
      meeting.status = 'started';
      const savedMeeting = await this.agoraMeetingRepository.save(meeting);

      // Start recording if configured
      try {
        if (this.agoraRecordingService) {
          const recordingConfig = this.agoraRecordingService.generateRecordingConfig({
            audioOnly: false,
            videoQuality: 'high',
            includeScreenShare: true
          });

          const recordingResult = await this.agoraRecordingService.startRecording(
            meeting.channelName,
            userId,
            recordingConfig
          );

          // Store recording info
          savedMeeting.recordingConfig = {
            resourceId: recordingResult.resourceId,
            sid: recordingResult.sid,
            status: 'recording'
          };
          savedMeeting.recordingStatus = 'recording';
          await this.agoraMeetingRepository.save(savedMeeting);

          console.log('✅ Started recording for meeting:', meeting.title);
        }
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        // Don't fail the meeting start if recording fails
      }

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
              meetingUrl: `/meetings/agora/${savedMeeting.id}`,
              channelName: savedMeeting.channelName
            }
          );
          console.log('✅ Agora session started notifications sent to', students.length, 'students');
        }
      } catch (error) {
        console.error('❌ Failed to send agora session started notifications:', error);
      }

      return savedMeeting;
    }

    return meeting;
  }

  async endMeeting(id: string, userId: string): Promise<AgoraMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only end your own meetings');
    }

    meeting.status = 'ended';
    
    // Stop recording if it's active
    try {
      if (meeting.recordingConfig && meeting.recordingConfig.status === 'recording') {
        const recordingData = await this.agoraRecordingService.stopRecording(
          meeting.recordingConfig.resourceId,
          meeting.recordingConfig.sid,
          meeting.channelName,
          userId
        );

        // Process recording files and upload to R2
        const r2Result = await this.agoraRecordingService.processRecordingFiles(
          meeting.channelName,
          recordingData,
          meeting.id
        );

        meeting.r2RecordingKey = r2Result.r2RecordingKey;
        meeting.r2RecordingUrl = r2Result.r2RecordingUrl;
        meeting.recordingStatus = 'completed';
        meeting.recordingCompletedAt = new Date();
        
        console.log('✅ Recording completed and uploaded to R2');
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      meeting.recordingStatus = 'failed';
    }

    const savedMeeting = await this.agoraMeetingRepository.save(meeting);

    // Check attendance and send notifications for absent students
    await this.checkAttendanceAndSendNotifications(meeting);

    return savedMeeting;
  }

  async cancelMeeting(id: string, userId: string): Promise<AgoraMeeting> {
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
    await this.agoraMeetingRepository.manager.transaction(async (transactionalEntityManager) => {
      try {
        console.log('Cancelling meeting:', meeting.title, 'ID:', id);
        
        // Delete all associated attendance records
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
        await transactionalEntityManager.save('AgoraMeeting', meeting);
        console.log('✅ Successfully cancelled meeting:', meeting.title);
        
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        throw new Error(`Failed to cancel meeting: ${error.message}`);
      }
    });

    return meeting;
  }

  async getMeetingToken(meetingId: string, userId: string, role: 'host' | 'attendee' = 'attendee'): Promise<any> {
    const meeting = await this.findMeetingById(meetingId);
    
    // Check if user has permission to join
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine role based on meeting creator or user role
    const isHost = meeting.createdById === userId || user.role === 'admin' || user.role === 'teacher';
    const tokenRole = isHost ? 'host' : 'attendee';

    // Generate tokens
    const rtcToken = this.agoraTokenService.generateRtcToken(
      meeting.channelName,
      userId,
      tokenRole === 'host' ? 'publisher' : 'subscriber',
      7200 // 2 hours
    );
    
    const rtmToken = this.agoraTokenService.generateRtmToken(
      userId,
      7200 // 2 hours
    );

    return {
      rtcToken,
      rtmToken,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      channelName: meeting.channelName,
      appId: this.agoraTokenService.getAppId(),
      rtcUid: userId,
      rtmUid: userId,
      role: tokenRole,
      isHost
    };
  }

  async getMeetingsByStatus(status: string): Promise<AgoraMeeting[]> {
    const meetings = await this.findAllMeetings();
    return meetings.filter(meeting => this.calculateMeetingStatus(meeting) === status);
  }

  async searchMeetings(searchTerm: string): Promise<AgoraMeeting[]> {
    const queryBuilder = this.agoraMeetingRepository.createQueryBuilder('meeting')
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

  private generateChannelName(title: string, courseName: string): string {
    const timestamp = Date.now();
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    const cleanCourse = courseName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);
    return `${cleanCourse}-${cleanTitle}-${timestamp}`;
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
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime) return 'live';
    
    return 'scheduled';
  }

  // Create attendance records for all students when a meeting is created
  async createAttendanceRecordsForMeeting(meeting: AgoraMeeting, courseId: string): Promise<void> {
    try {
      console.log('Creating attendance records for meeting:', meeting.title, 'Course ID:', courseId);
      
      // Get all students enrolled in this course
      const students = await this.getStudentsInCourse(courseId);
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
      }
    } catch (error) {
      console.error('Error creating attendance records for meeting:', error);
    }
  }

  // Auto-mark attendance when student joins meeting
  private async markAttendanceForStudent(meeting: AgoraMeeting, studentId: string, courseId: string): Promise<void> {
    try {
      console.log('🎯 Marking attendance for student:', { studentId, courseId, meetingId: meeting.id });
      
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
    }
  }

  // Check attendance after meeting ends and send notifications for absent students
  private async checkAttendanceAndSendNotifications(meeting: AgoraMeeting): Promise<void> {
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

        // Find parent(s) of this student
        const allParents = await this.parentRepository.find({ relations: ['user'] });
        const parents = allParents.filter(parent => 
          parent.studentIds && parent.studentIds.includes(student.id)
        );

        console.log(`👨‍👩‍👧‍👦 Found ${parents.length} parent(s) for student ${student.firstName} ${student.lastName}`);

        // Send notification to each parent
        for (const parent of parents) {
          if (parent.user) {
            console.log(`📤 Sending absent notification to parent: ${parent.user.firstName} ${parent.user.lastName}`);
            
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
          }
        }
      }

      console.log(`✅ Attendance check completed for meeting ${meeting.title}`);
    } catch (error) {
      console.error(`❌ Error checking attendance for meeting ${meeting.id}:`, error);
    }
  }
}

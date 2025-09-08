import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomMeeting } from './entities/zoom-meeting.entity';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { UpdateZoomMeetingDto } from './dto/update-zoom-meeting.dto';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';

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

    const meeting = this.zoomMeetingRepository.create({
      ...createZoomMeetingDto,
      createdById: userId,
      status: this.calculateMeetingStatus(createZoomMeetingDto),
    });

    return await this.zoomMeetingRepository.save(meeting);
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

    await this.zoomMeetingRepository.remove(meeting);
  }

  async incrementJoinCount(id: string, studentId?: string, courseId?: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    meeting.joinCount += 1;
    
    // Auto-mark attendance if studentId and courseId are provided
    if (studentId && courseId && meeting.date) {
      await this.markAttendanceForStudent(meeting, studentId, courseId);
    }
    
    return await this.zoomMeetingRepository.save(meeting);
  }

  // Auto-mark attendance when student joins meeting
  private async markAttendanceForStudent(meeting: ZoomMeeting, studentId: string, courseId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Only mark attendance if the meeting is scheduled for today
      if (meeting.date === today) {
        // Get the course schedule to find the correct day and time
        const courseSchedule = this.getCourseScheduleForDate(meeting.date);
        
        if (courseSchedule) {
          // Get all students enrolled in this course
          const students = await this.getCourseStudents(courseId);
          
          // Get existing attendance records for this date
          const existingAttendance = await this.attendanceRepository.find({
            where: {
              courseId,
              date: new Date(meeting.date)
            },
            relations: ['student']
          });
          
          // Create attendance data for bulk update
          const attendanceData = {
            date: meeting.date,
            day: courseSchedule.day,
            time: courseSchedule.time,
            students: students.map(student => {
              // Check if this student already has attendance marked
              const existingRecord = existingAttendance.find(record => record.studentId === student.id);
              
              return {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                status: student.id === studentId ? 'present' : (existingRecord?.status || 'absent')
              };
            })
          };
          
          // Use bulk attendance marking
          await this.markBulkAttendance(courseId, attendanceData, studentId);
        }
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

  async endMeeting(id: string, userId: string): Promise<ZoomMeeting> {
    const meeting = await this.findMeetingById(id);
    
    // Check if user is the creator or admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (meeting.createdById !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('You can only end your own meetings');
    }

    meeting.status = 'ended';
    return await this.zoomMeetingRepository.save(meeting);
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

    meeting.status = 'cancelled';
    return await this.zoomMeetingRepository.save(meeting);
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
    
    // Only check if meeting has started, don't auto-end it
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
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['class', 'class.students']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get students from the class that contains this course
    return course.class?.students || [];
  }

  // Mark bulk attendance (reuse from materials service)
  private async markBulkAttendance(courseId: string, attendanceData: any, markerId: string): Promise<Attendance[]> {
    const attendanceRecords: Attendance[] = [];
    const attendanceDate = new Date(attendanceData.date);

    // Process each student's attendance
    for (const studentAttendance of attendanceData.students) {
      // Check if attendance already exists for this student on this date
      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          courseId,
          studentId: studentAttendance.id,
          date: attendanceDate
        }
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = studentAttendance.status;
        existingAttendance.day = attendanceData.day;
        existingAttendance.time = attendanceData.time;
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
          status: studentAttendance.status,
          markedBy: markerId,
          markedAt: new Date()
        });
        attendanceRecords.push(await this.attendanceRepository.save(attendance));
      }
    }

    return attendanceRecords;
  }
}

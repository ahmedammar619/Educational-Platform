import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Role } from '../../common/enums/role.enum';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async getTeacherProfile(teacherId: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found. The teacher may have been deleted or moved.');
    }

    return {
      id: teacher.id,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      courses: teacher.courses,
      createdAt: teacher.user.createdAt,
    };
  }

  async updateTeacher(teacherId: string, updateData: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found. The teacher may have been deleted or moved.');
    }

    // Only allow updating courses array
    if (updateData.courses) {
      await this.teacherRepository.update(teacherId, { courses: updateData.courses });
    }

    return this.findOne(teacherId);
  }

  async getTeacherClasses(teacherId: string) {
    try {
      console.log('🔍 Getting classes for teacher ID:', teacherId);
      
      // First, verify the teacher exists
      const teacher = await this.teacherRepository.findOne({
        where: { id: teacherId },
        relations: ['user'],
      });

      if (!teacher) {
        console.log('❌ Teacher not found for ID:', teacherId);
        throw new NotFoundException('Teacher not found. The teacher may have been deleted or moved.');
      }

      console.log('✅ Teacher found:', teacher.user.firstName, teacher.user.lastName);

      // Get all courses taught by this teacher
      const courses = await this.courseRepository.find({
        where: { teacherId },
        relations: ['class', 'teacher'],
      });

      console.log('📚 Found courses for teacher:', courses.length);
      console.log('📚 Courses data:', courses.map(c => ({ id: c.id, name: c.name, teacherId: c.teacherId, classId: c.classId })));

      // If no courses found, return empty array
      if (!courses || courses.length === 0) {
        console.log('📚 No courses found for teacher, returning empty array');
        return [];
      }

      // Group courses by class
      const classMap = new Map<string, any>();
      
      for (const course of courses) {
        try {
          const classId = course.classId;
          
          if (!classId) {
            console.log('⚠️ Course has no classId:', course.id);
            continue;
          }
          
          if (!classMap.has(classId)) {
            // Get class details
            const classEntity = await this.classRepository.findOne({
              where: { id: classId },
            });
            
            if (classEntity) {
              // Get students from Student entity where classId matches
              const students = await this.studentRepository.find({
                where: { classId: classEntity.id }
              });
              
              // Get student IDs
              const studentIds = students.map(student => student.id);
              
              classMap.set(classId, {
                id: classEntity.id,
                name: classEntity.name,
                startDate: classEntity.startDate,
                endDate: classEntity.endDate,
                students: studentIds,
                studentCount: studentIds.length,
                numberOfStudents: studentIds.length, // For backward compatibility
                courseIds: classEntity.courseIds || [],
                courses: []
              });
            } else {
              console.log('⚠️ Class not found for classId:', classId);
            }
          }
          
          // Add course to the class
          const classData = classMap.get(classId);
          if (classData) {
            classData.courses.push({
              id: course.id,
              name: course.name,
              teacherId: course.teacherId,
              teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Unknown Teacher',
              sessionTime: course.sessions || [],
              sessions: course.sessions || []
            });
          }
        } catch (courseError) {
          console.error('❌ Error processing course:', course.id, courseError);
          // Continue with next course
        }
      }

      const result = Array.from(classMap.values());
      console.log('🏫 Final classes result:', result.length, 'classes');
      console.log('🏫 Classes data:', result.map(c => ({ id: c.id, name: c.name, coursesCount: c.courses.length })));
      
      return result;
    } catch (error) {
      console.error('❌ Error in getTeacherClasses:', error);
      throw error;
    }
  }

  async getClassStudents(classId: string) {
    console.log(`🔍 Getting students for class ID: ${classId}`);
    
    // Get students from the Student entity where classId matches
    const students = await this.studentRepository.find({
      where: { classId },
      relations: ['user', 'parent']
    });

    console.log(`📊 Found ${students.length} students for class ${classId}`);
    console.log('📋 Students data:', students.map(s => ({
      id: s.id,
      classId: s.classId,
      hasUser: !!s.user,
      hasParent: !!s.parent,
      userEmail: s.user?.email
    })));

    // Transform students to include user data and parent information
    const transformedStudents = students.map(student => ({
      id: student.id,
      birthDate: student.birthDate,
      parentId: student.parentId,
      classId: student.classId,
      user: student.user,
      parent: student.parent
    }));

    console.log(`✅ Returning ${transformedStudents.length} transformed students`);
    return transformedStudents;
  }

  async createTeacher(teacherData: { id: string; courses: string[] }) {
    const teacher = this.teacherRepository.create({
      id: teacherData.id,
      courses: teacherData.courses,
    });

    return this.teacherRepository.save(teacher);
  }

  async findAll(): Promise<Teacher[]> {
    return this.teacherRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found. The teacher may have been deleted or moved.');
    }

    return teacher;
  }

  async deleteTeacher(id: string): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found. The teacher may have been deleted or moved.');
    }

    // Comprehensive cleanup of all teacher references
    await this.cleanupTeacherReferences(id);

    // Delete the teacher record (this will cascade delete the user due to onDelete: 'CASCADE')
    await this.teacherRepository.delete(id);
    console.log(`✅ Teacher deleted successfully: ${id}`);
  }

  private async cleanupTeacherReferences(teacherId: string): Promise<void> {
    console.log(`🧹 Cleaning up all references for teacher: ${teacherId}`);
    
    try {
      // Use raw queries for better performance and to avoid circular dependencies
      
      // 1. Unassign from courses (set teacherId to null)
      const coursesResult = await this.teacherRepository.query(
        'UPDATE courses SET "teacherId" = NULL WHERE "teacherId" = $1',
        [teacherId]
      );
      console.log(`📚 Unassigned teacher from ${coursesResult[1] || 0} courses`);
      
      // 2. Unassign from zoom meetings (set createdById to null)
      const zoomResult = await this.teacherRepository.query(
        'UPDATE zoom_meetings SET "createdById" = NULL WHERE "createdById" = $1',
        [teacherId]
      );
      console.log(`🎥 Unassigned teacher from ${zoomResult[1] || 0} zoom meetings`);
      
      // 3. Unassign from announcement meetings (set createdById to null)
      const announcementMeetingsResult = await this.teacherRepository.query(
        'UPDATE announcement_meetings SET "createdById" = NULL WHERE "createdById" = $1',
        [teacherId]
      );
      console.log(`📢 Unassigned teacher from ${announcementMeetingsResult[1] || 0} announcement meetings`);
      
      // 4. Unassign from attendance records (set markedBy to null)
      const attendanceResult = await this.teacherRepository.query(
        'UPDATE attendance SET "markedBy" = NULL WHERE "markedBy" = $1',
        [teacherId]
      );
      console.log(`✅ Unassigned teacher from ${attendanceResult[1] || 0} attendance records`);
      
      // 5. Unassign from announcement posts (set authorId to null)
      const announcementPostsResult = await this.teacherRepository.query(
        'UPDATE announcement_posts SET "authorId" = NULL WHERE "authorId" = $1',
        [teacherId]
      );
      console.log(`📝 Unassigned teacher from ${announcementPostsResult[1] || 0} announcement posts`);
      
      // 6. Unassign from files (set uploadedBy to null)
      const filesResult = await this.teacherRepository.query(
        'UPDATE files SET "uploadedBy" = NULL WHERE "uploadedBy" = $1',
        [teacherId]
      );
      console.log(`📁 Unassigned teacher from ${filesResult[1] || 0} files`);
      
      // 7. Unassign from posts (set authorId to null)
      const postsResult = await this.teacherRepository.query(
        'UPDATE posts SET "authorId" = NULL WHERE "authorId" = $1',
        [teacherId]
      );
      console.log(`📄 Unassigned teacher from ${postsResult[1] || 0} posts`);
      
      // 8. Unassign from assignments (set createdBy to null)
      const assignmentsResult = await this.teacherRepository.query(
        'UPDATE assignments SET "createdBy" = NULL WHERE "createdBy" = $1',
        [teacherId]
      );
      console.log(`📋 Unassigned teacher from ${assignmentsResult[1] || 0} assignments`);
      
      // 9. Unassign from folders (set createdBy to null)
      const foldersResult = await this.teacherRepository.query(
        'UPDATE folders SET "createdBy" = NULL WHERE "createdBy" = $1',
        [teacherId]
      );
      console.log(`📂 Unassigned teacher from ${foldersResult[1] || 0} folders`);
      
      // 10. Unassign from assignment submissions (set gradedBy to null)
      const submissionsResult = await this.teacherRepository.query(
        'UPDATE assignment_submissions SET "gradedBy" = NULL WHERE "gradedBy" = $1',
        [teacherId]
      );
      console.log(`📊 Unassigned teacher from ${submissionsResult[1] || 0} assignment submissions`);
      
      console.log(`✅ Successfully cleaned up all references for teacher: ${teacherId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up references for teacher ${teacherId}:`, error);
      throw error;
    }
  }

  // Method to create a teacher record from an existing user
  async createTeacherFromUser(userId: string): Promise<Teacher> {
    // Check if teacher record already exists
    const existingTeacher = await this.teacherRepository.findOne({
      where: { id: userId }
    });

    if (existingTeacher) {
      throw new Error('Teacher record already exists for this user');
    }

    // Create teacher record with the existing user ID
    const teacher = this.teacherRepository.create({
      id: userId,
      courses: [], // Start with empty courses array
    });

    return this.teacherRepository.save(teacher);
  }

  // Method to sync teacher's courses array with actual course assignments
  async syncTeacherCourses(teacherId: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found. The teacher may have been deleted or moved.');
    }

    // Get all courses assigned to this teacher
    const assignedCourses = await this.courseRepository.find({
      where: { teacherId },
      select: ['id']
    });

    const courseIds = assignedCourses.map(course => course.id);

    // Update teacher's courses array
    teacher.courses = courseIds;
    return this.teacherRepository.save(teacher);
  }
}
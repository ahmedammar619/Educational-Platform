import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Class } from './entities/class.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { StudentsService } from '../students/students.service';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => CoursesService))
    private readonly coursesService: CoursesService,
    @Inject(forwardRef(() => StudentsService))
    private readonly studentsService: StudentsService,
  ) {}

  async createClass(createClassDto: CreateClassDto): Promise<Class> {
    const { startDate, endDate } = createClassDto;
    
    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const classEntity = this.classRepository.create({
      ...createClassDto,
      courseIds: [] // Initialize courseIds as empty array
    });
    return await this.classRepository.save(classEntity);
  }

  async findAllClasses(): Promise<any[]> {
    const classes = await this.classRepository.find({
      order: { createdAt: 'DESC' }
    });

    // Get student count and students for each class from the Student entity
    const classesWithStudentData = await Promise.all(
      classes.map(async (classEntity) => {
    // Get students enrolled in any course within this class
    const courseLevelStudents = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('courses', 'course', 'course.id::text = ANY(string_to_array(student.courseIds, \',\'))')
      .where('course.classId = :classId', { classId: classEntity.id })
      .select('student.id')
      .getMany();

    // Use only course-level enrollments
    const allStudentIds = new Set(courseLevelStudents.map(s => s.id));
        
        const studentCount = allStudentIds.size;
        const studentIds = Array.from(allStudentIds);
        
        return {
          ...classEntity,
          courseIds: classEntity.courseIds || [],
          students: studentIds,
          studentCount: studentCount
        };
      })
    );

    return classesWithStudentData;
  }

  async findClassById(id: string): Promise<any> {
    const classEntity = await this.classRepository.findOne({
      where: { id }
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Get students for this class from the Student entity
    const students = await this.studentRepository.find({
      where: { classId: classEntity.id }
    });
    
    const studentCount = students.length;
    
    // Return array of student IDs instead of full student objects
    const studentIds = students.map(student => student.id);

    // Ensure courseIds is always an array, not null
    return {
      ...classEntity,
      courseIds: classEntity.courseIds || [],
      students: studentIds,
      studentCount: studentCount
    };
  }

  async updateClass(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findClassById(id);
    
    if (updateClassDto.startDate && updateClassDto.endDate) {
      if (new Date(updateClassDto.startDate) >= new Date(updateClassDto.endDate)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async deleteClass(id: string): Promise<void> {
    const classEntity = await this.findClassById(id);
    
    console.log(`🗑️ Starting cascading deletion for class: ${classEntity.name} (${id})`);
    
    try {
      // Step 1: Remove all students from the class
      if (classEntity.students && classEntity.students.length > 0) {
        classEntity.students = [];
        await this.classRepository.save(classEntity);
        console.log('✅ Removed all students from class');
      }
      
      // Step 2: Delete all courses associated with this class using cascading deletion
      const courses = await this.courseRepository.find({ where: { classId: id } });
      console.log(`Found ${courses.length} courses to delete for class: ${classEntity.name}`);
      
      for (const course of courses) {
        await this.coursesService.deleteCourse(course.id);
        console.log(`✅ Deleted course with cascading: ${course.name}`);
      }
      
      // Step 3: Finally, delete the class itself
      await this.classRepository.delete(id);
      console.log(`✅ Successfully deleted class: ${classEntity.name}`);
      
    } catch (error) {
      console.error(`❌ Error during cascading deletion for class ${id}:`, error);
      throw new BadRequestException(`Failed to delete class and all related data: ${error.message}`);
    }
  }

  async enrollStudents(classId: string, enrollDto: EnrollStudentsDto): Promise<void> {
    const classEntity = await this.findClassById(classId);
    
    // Verify all students exist and are actually students
    const students = await this.userRepository.find({
      where: { 
        id: In(enrollDto.studentIds),
        role: Role.Student 
      }
    });

    if (students.length !== enrollDto.studentIds.length) {
      throw new BadRequestException('Some student IDs are invalid or not students');
    }

    // Get all courses in this class
    const classCourses = await this.courseRepository.find({
      where: { classId }
    });

    // Check which students are already enrolled in this class by checking if they have any course from this class
    const existingEnrolledStudents = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('courses', 'course', 'course.id::text = ANY(string_to_array(student.courseIds, \',\'))')
      .where('course.classId = :classId', { classId })
      .andWhere('student.id = ANY(:studentIds)', { studentIds: enrollDto.studentIds })
      .getMany();
    
    const existingStudentIds = existingEnrolledStudents.map(s => s.id);
    const newlyEnrolledStudentIds = enrollDto.studentIds.filter(
      studentId => !existingStudentIds.includes(studentId)
    );

    // Auto-enroll students in all class courses (no classId needed)
    for (const student of students) {
      
      // Auto-enroll student in all courses in this class
      for (const course of classCourses) {
        try {
          const studentEntity = await this.studentRepository.findOne({
            where: { id: student.id }
          });
          
          if (studentEntity) {
            const existingCourseIds = studentEntity.courseIds || [];
            if (!existingCourseIds.includes(course.id)) {
              studentEntity.courseIds = [...existingCourseIds, course.id];
              await this.studentRepository.save(studentEntity);
            }
          }
          
          // Also add student to course.students array
          const existingStudents = course.students || [];
          if (!existingStudents.includes(student.id)) {
            course.students = [...existingStudents, student.id];
            await this.courseRepository.save(course);
          }
        } catch (error) {
          console.error(`Failed to auto-enroll student ${student.id} in course ${course.id}:`, error);
          // Continue with other enrollments even if one fails
        }
      }
    }

    // No need to update class.students array since we removed it
    // Students are now tracked in individual course.students arrays

    // Send notifications for newly enrolled students only
    if (newlyEnrolledStudentIds.length > 0) {
      await this.sendNotificationsForEnrollment(newlyEnrolledStudentIds, classEntity.name);
    }

    // Auto-remove form completion records for newly enrolled students
    for (const studentId of newlyEnrolledStudentIds) {
      try {
        await this.studentsService.autoRemoveFormCompletionOnEnrollment(studentId);
      } catch (error) {
        console.error(`Failed to auto-remove form completion for student ${studentId}:`, error);
        // Continue with other students even if one fails
      }
    }

    // Students are now automatically enrolled in all courses within the class
    // Both through classId (for access control) and courseIds (for individual tracking)
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.findClassById(classId);
    
    // Get all courses in this class
    const classCourses = await this.courseRepository.find({
      where: { classId }
    });

    // Remove student from all class courses
    const studentEntity = await this.studentRepository.findOne({
      where: { id: studentId }
    });

    if (studentEntity) {
      const existingCourseIds = studentEntity.courseIds || [];
      const classCourseIds = classCourses.map(course => course.id);
      
      // Remove only the courses that belong to this class
      const updatedCourseIds = existingCourseIds.filter(courseId => !classCourseIds.includes(courseId));
      studentEntity.courseIds = updatedCourseIds;
      await this.studentRepository.save(studentEntity);
    }

    // Remove student from all class courses' students arrays
    for (const course of classCourses) {
      try {
        const existingStudents = course.students || [];
        course.students = existingStudents.filter(id => id !== studentId);
        await this.courseRepository.save(course);
      } catch (error) {
        console.error(`Failed to remove student ${studentId} from course ${course.id}:`, error);
      }
    }

    // No need to update classId since we're not using it anymore

    // No need to update class.students array since we removed it
    // Students are now tracked in individual course.students arrays
  }

  async getClassStudents(classId: string): Promise<Student[]> {
    console.log('🔍 Getting students for class:', classId);
    
    // Get students enrolled in any course within this class (no classId needed)
    const studentsFromCourses = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('courses', 'course', 'course.id::text = ANY(string_to_array(student.courseIds, \',\'))')
      .leftJoinAndSelect('student.user', 'user')
      .where('course.classId = :classId', { classId })
      .getMany();
    
    console.log('👥 Students from courses:', studentsFromCourses.length);
    
    // Remove duplicates
    const uniqueStudents = studentsFromCourses.filter((student, index, array) => 
      array.findIndex(s => s.id === student.id) === index
    );
    
    return uniqueStudents.filter(student => student.user !== null);
  }

  // Helper method to send notifications (both student and parent) when students are enrolled in a class
  private async sendNotificationsForEnrollment(studentIds: string[], className: string): Promise<void> {
    try {
      console.log(`📢 Sending notifications for ${studentIds.length} newly enrolled students in class: ${className}`);
      
      for (const studentId of studentIds) {
        // Get student information
        const student = await this.userRepository.findOne({
          where: { id: studentId },
          select: ['id', 'firstName', 'lastName']
        });

        if (!student) {
          console.warn(`Student not found for notification: ${studentId}`);
          continue;
        }

        const childName = `${student.firstName} ${student.lastName}`;

        // 1. Send notification to the student
        try {
          await this.notificationsService.createAddedToClassNotification(
            studentId,
            className,
            {
              classId: className, // Note: This should ideally be classId, but className is more readable
              enrollmentDate: new Date().toISOString()
            }
          );
          console.log(`✅ Sent class enrollment notification to student: ${childName}`);
        } catch (error) {
          console.error(`❌ Failed to send notification to student ${childName}:`, error);
        }

        // 2. Send notification to parents
        try {
          const parents = await this.getParentsOfStudent(studentId);
          
          if (parents.length > 0) {
            // Send notification to each parent
            for (const parent of parents) {
              await this.notificationsService.createChildAddedToClassNotification(
                parent.id,
                childName,
                className,
                {
                  studentId: studentId,
                  classId: className, // Note: This should ideally be classId, but className is more readable
                  enrollmentDate: new Date().toISOString()
                }
              );
            }
            
            console.log(`✅ Sent class enrollment notifications to ${parents.length} parents for student: ${childName}`);
          } else {
            console.log(`ℹ️ No parents found for student: ${childName}`);
          }
        } catch (error) {
          console.error(`❌ Failed to send parent notifications for student ${childName}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to send notifications for class enrollment:', error);
      // Don't throw error - notification failure shouldn't break the main enrollment operation
    }
  }

  // Helper method to get parents of a student
  private async getParentsOfStudent(studentId: string): Promise<User[]> {
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

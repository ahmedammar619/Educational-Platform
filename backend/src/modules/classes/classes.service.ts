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
        const students = await this.studentRepository.find({
          where: { classId: classEntity.id }
        });
        
        const studentCount = students.length;
        
        // Return array of student IDs instead of full student objects
        const studentIds = students.map(student => student.id);
        
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

    // Filter out students who are already enrolled in this class
    const existingStudents = classEntity.students || [];
    const newlyEnrolledStudentIds = enrollDto.studentIds.filter(
      studentId => !existingStudents.includes(studentId)
    );

    // Update student records with classId
    for (const student of students) {
      await this.studentRepository.update(student.id, { classId });
    }

    // Update the class's students array
    const newStudents = [...new Set([...existingStudents, ...enrollDto.studentIds])];
    await this.classRepository.update(classId, { students: newStudents });

    // Send notifications for newly enrolled students only
    if (newlyEnrolledStudentIds.length > 0) {
      await this.sendNotificationsForEnrollment(newlyEnrolledStudentIds, classEntity.name);
    }

    // Students are now automatically enrolled in all courses within the class
    // No need for individual course enrollment - class enrollment gives access to all courses
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.findClassById(classId);
    
    // Get all courses in this class
    const classCourses = await this.courseRepository.find({
      where: { classId }
    });

    // Student is automatically removed from all courses when removed from class
    // No need for individual course unenrollment

    // Update student record to remove classId
    await this.studentRepository.update(studentId, { classId: null });

    // Update the class's students array to remove the student
    const existingStudents = classEntity.students || [];
    const updatedStudents = existingStudents.filter(id => id !== studentId);
    await this.classRepository.update(classId, { students: updatedStudents });
  }

  async getClassStudents(classId: string): Promise<Student[]> {
    console.log('🔍 Getting students for class:', classId);
    
    // First, try to get students from the Student entity where classId matches
    const studentsFromStudentEntity = await this.studentRepository.find({
      where: { classId },
      relations: ['user']
    });
    
    console.log('👥 Students from Student entity:', studentsFromStudentEntity.length);
    
    if (studentsFromStudentEntity.length > 0) {
      return studentsFromStudentEntity.filter(student => student.user !== null);
    }
    
    // Fallback: Get student IDs from the Class entity's students array
    const classEntity = await this.classRepository.findOne({
      where: { id: classId }
    });
    
    if (!classEntity || !classEntity.students || classEntity.students.length === 0) {
      console.log('❌ No students found in class:', classId);
      return [];
    }
    
    console.log('👥 Students in class (raw):', classEntity.students);
    console.log('👥 Students type:', typeof classEntity.students);
    
    // Get full student data for each ID
    const studentIds = Array.isArray(classEntity.students) ? classEntity.students : [classEntity.students];
    const students = await this.studentRepository.find({
      where: { id: In(studentIds) },
      relations: ['user']
    });
    
    console.log('👥 Found students:', students.length);
    
    // Return the full student data with user information
    return students.filter(student => student.user !== null);
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

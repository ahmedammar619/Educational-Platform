import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { AssignmentSubmission } from '../materials/entities/assignment-submission.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { Invoice } from '../payments/entities/invoice.entity';
import { Program } from '../programs/entities/program.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async createStudent(createStudentDto: CreateStudentDto): Promise<Student> {
    const { email, password, firstName, lastName, birthDate, parentId, programIds, ...rest } = createStudentDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user first
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: Role.Student,
    });

    const savedUser = await this.userRepository.save(user);

    // Create student record with the same ID
    const student = this.studentRepository.create({
      id: savedUser.id,
      birthDate: new Date(birthDate),
      parentId,
      programIds: programIds,
      ...rest,
    });

    const savedStudent = await this.studentRepository.save(student);

    // Auto-enroll student in selected programs
    await this.enrollStudentInPrograms(savedStudent.id, programIds);

    return savedStudent;
  }

  async enrollStudentInPrograms(studentId: string, programIds: string[]): Promise<void> {
    for (const programId of programIds) {
      try {
        const program = await this.programRepository.findOne({ where: { id: programId } });
        if (program) {
          // Add student to program's studentIds if not already enrolled
          if (!program.studentIds.includes(studentId)) {
            program.studentIds = [...program.studentIds, studentId];
            await this.programRepository.save(program);
          }
        }
      } catch (error) {
        console.error(`Failed to enroll student ${studentId} in program ${programId}:`, error);
        // Continue with other programs even if one fails
      }
    }
  }

  async updateStudentProgramEnrollments(studentId: string, newProgramIds: string[]): Promise<void> {
    // Get current student to find existing program enrollments
    const student = await this.findOne(studentId);
    const currentProgramIds = student.programIds || [];

    // Find programs to remove (in current but not in new)
    const programsToRemove = currentProgramIds.filter(id => !newProgramIds.includes(id));
    
    // Find programs to add (in new but not in current)
    const programsToAdd = newProgramIds.filter(id => !currentProgramIds.includes(id));

    // Remove student from programs they're no longer enrolled in
    for (const programId of programsToRemove) {
      try {
        const program = await this.programRepository.findOne({ where: { id: programId } });
        if (program) {
          program.studentIds = program.studentIds.filter(id => id !== studentId);
          await this.programRepository.save(program);
        }
      } catch (error) {
        console.error(`Failed to remove student ${studentId} from program ${programId}:`, error);
      }
    }

    // Add student to new programs
    for (const programId of programsToAdd) {
      try {
        const program = await this.programRepository.findOne({ where: { id: programId } });
        if (program) {
          if (!program.studentIds.includes(studentId)) {
            program.studentIds = [...program.studentIds, studentId];
            await this.programRepository.save(program);
          }
        }
      } catch (error) {
        console.error(`Failed to enroll student ${studentId} in program ${programId}:`, error);
      }
    }

    // Update student's programIds
    await this.studentRepository.update(studentId, { programIds: newProgramIds });
  }

  async findAll(): Promise<any[]> {
    const students = await this.studentRepository.find({
      relations: ['user'],
    });
    
    // Transform to include user fields directly
    return students.map(student => ({
      id: student.id,
      firstName: student.user?.firstName,
      lastName: student.user?.lastName,
      email: student.user?.email,
      birthDate: student.birthDate,
      parentId: student.parentId,
      classId: student.classId,
      courseIds: student.courseIds,
      subscriptionStatus: student.subscriptionStatus,
      subscriptionEndDate: student.subscriptionEndDate,
      registrationFormCompleted: student.registrationFormCompleted,
      formCompletionDate: student.formCompletionDate,
      age: student.age
    }));
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByEmail(email: string): Promise<Student> {
    const user = await this.userRepository.findOne({
      where: { email, role: Role.Student },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt']
    });

    if (!user) {
      return null;
    }

    return this.studentRepository.findOne({
      where: { id: user.id },
      relations: ['user'],
      select: {
        id: true,
        birthDate: true,
        parentId: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        }
      }
    });
  }

  async findByParentId(parentId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { parentId },
      relations: ['user'],
    });
  }

  async updateStudent(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    if (updateStudentDto.password) {
      const passwordHash = await bcrypt.hash(updateStudentDto.password, 10);
      await this.userRepository.update(id, { passwordHash });
      delete updateStudentDto.password;
    }

    // Handle programIds separately to update program enrollments
    let programIds = null;
    if ('programIds' in updateStudentDto) {
      programIds = updateStudentDto.programIds;
      delete updateStudentDto.programIds;
    }

    // Update user fields if provided
    const userFields = ['firstName', 'lastName', 'email'];
    const userUpdateData = {};
    const studentUpdateData = {};

    Object.keys(updateStudentDto).forEach(key => {
      if (userFields.includes(key)) {
        userUpdateData[key] = updateStudentDto[key];
      } else {
        studentUpdateData[key] = updateStudentDto[key];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      await this.userRepository.update(id, userUpdateData);
    }

    if (Object.keys(studentUpdateData).length > 0) {
      // Handle birthDate conversion if it exists
      if ('birthDate' in studentUpdateData && studentUpdateData.birthDate) {
        const birthDateValue = studentUpdateData.birthDate as string | Date;
        studentUpdateData.birthDate = new Date(birthDateValue);
      }
      await this.studentRepository.update(id, studentUpdateData);
    }

    // Handle program enrollment updates
    if (programIds !== null) {
      await this.updateStudentProgramEnrollments(id, programIds);
    }

    const updatedStudent = await this.findOne(id);
    
    // Auto-remove form completion record when student is enrolled in a class
    if ('classId' in studentUpdateData && studentUpdateData.classId) {
      await this.autoRemoveFormCompletionOnEnrollment(id);
    }
    
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    const student = await this.findOne(id);
    
    // Clean up all related data before deleting the student
    
    // 1. Delete assignment submissions
    await this.assignmentSubmissionRepository.delete({ studentId: id });
    
    // 2. Delete attendance records
    await this.attendanceRepository.delete({ studentId: id });
    
    // 3. Delete subscriptions
    await this.subscriptionRepository.delete({ studentId: id });
    
    // 4. Delete invoices
    await this.invoiceRepository.delete({ studentId: id });
    
    // 5. Check if student has a parent and remove from parent's children array
    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId }
      });
      
      if (parent && parent.studentIds) {
        // Remove the student ID from parent's studentIds array
        parent.studentIds = parent.studentIds.filter(studentId => studentId !== id);
        await this.parentRepository.save(parent);
      }
    }
    
    // 6. Delete student record first
    await this.studentRepository.delete(id);
    
    // 7. Delete the corresponding user record
    await this.userRepository.delete(id);
  }

  // Method to safely remove a student from all parent relationships
  async removeFromAllParents(studentId: string): Promise<void> {
    const student = await this.findOne(studentId);
    
    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId }
      });
      
      if (parent && parent.studentIds) {
        parent.studentIds = parent.studentIds.filter(id => id !== studentId);
        await this.parentRepository.save(parent);
      }
      
      // Also update the student record
      student.parentId = null;
      await this.studentRepository.save(student);
    }
  }

  async linkToParent(studentId: string, parentId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    
    if (student.parentId) {
      throw new ConflictException('Student already has a parent');
    }

    student.parentId = parentId;
    return this.studentRepository.save(student);
  }

  async unlinkFromParent(studentId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    
    if (!student.parentId) {
      throw new ConflictException('Student does not have a parent');
    }

    // Remove student ID from parent's studentIds array
    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId }
      });
      
      if (parent && parent.studentIds) {
        parent.studentIds = parent.studentIds.filter(id => id !== studentId);
        await this.parentRepository.save(parent);
      }
    }

    student.parentId = null;
    return this.studentRepository.save(student);
  }

  // Method to create a student record from an existing user
  async createStudentFromUser(userId: string, birthDate: string, phone?: string, parentId?: string): Promise<Student> {
    // Check if student record already exists
    const existingStudent = await this.studentRepository.findOne({
      where: { id: userId }
    });

    if (existingStudent) {
      throw new ConflictException('Student record already exists for this user');
    }

    // Create student record with the existing user ID
    const student = this.studentRepository.create({
      id: userId,
      birthDate: new Date(birthDate),
      parentId: parentId || null, // Use provided parentId or null
    });

    const savedStudent = await this.studentRepository.save(student);

    // If parentId is provided, add the student to the parent's studentIds array
    if (parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: parentId }
      });
      
      if (parent) {
        parent.studentIds = [...(parent.studentIds || []), userId];
        await this.parentRepository.save(parent);
      }
    }

    return savedStudent;
  }

  async updateStudentFromUser(userId: string, updateData: { birthDate?: string; parentId?: string }): Promise<Student> {
    const student = await this.findOne(userId);
    
    // Update student-specific fields
    if (updateData.birthDate) {
      student.birthDate = new Date(updateData.birthDate);
    }
    
    if (updateData.parentId !== undefined) {
      // Handle parent relationship change
      const oldParentId = student.parentId;
      student.parentId = updateData.parentId || null;
      
      // Update parent relationships
      if (oldParentId && oldParentId !== updateData.parentId) {
        // Remove from old parent's studentIds array
        const oldParent = await this.parentRepository.findOne({
          where: { id: oldParentId }
        });
        if (oldParent && oldParent.studentIds) {
          oldParent.studentIds = oldParent.studentIds.filter(studentId => studentId !== userId);
          await this.parentRepository.save(oldParent);
        }
      }
      
      if (updateData.parentId) {
        // Add to new parent's studentIds array
        const newParent = await this.parentRepository.findOne({
          where: { id: updateData.parentId }
        });
        if (newParent) {
          newParent.studentIds = [...(newParent.studentIds || []), userId];
          await this.parentRepository.save(newParent);
        }
      }
    }
    
    return this.studentRepository.save(student);
  }

  async getStudentClasses(studentId: string): Promise<any[]> {
    // First, get the student to find their courseIds (no classId needed)
    const student = await this.findOne(studentId);
    
    const classesMap = new Map();

    // Get individual course enrollments (main enrollment method)
    if (student.courseIds && student.courseIds.length > 0) {
      const classEntity = await this.classRepository.findOne({
        where: { id: student.classId },
        relations: ['courses', 'courses.teacher']
      });

      if (classEntity) {
        // Get all unique students enrolled in this class (both class-level and individual course enrollments)
        const classLevelStudents = await this.studentRepository.find({
          where: { classId: student.classId },
          select: ['id']
        });

        // Get all students enrolled in any course within this class
        const courseLevelStudents = await this.studentRepository
          .createQueryBuilder('student')
          .innerJoin('courses', 'course', 'course.id::text = ANY(string_to_array(student.courseIds, \',\'))')
          .where('course.classId = :classId', { classId: student.classId })
          .select('student.id')
          .getMany();

        // Combine and deduplicate student IDs
        const allStudentIds = new Set([
          ...classLevelStudents.map(s => s.id),
          ...courseLevelStudents.map(s => s.id)
        ]);

        // Transform the data to match the frontend structure
        const transformedClass = {
          id: classEntity.id,
          name: classEntity.name,
          startDate: classEntity.startDate,
          endDate: classEntity.endDate,
          numberOfStudents: allStudentIds.size,
          status: 'active', // Default status since Class entity doesn't have status field
          courses: classEntity.courses?.map(course => ({
            id: course.id,
            name: course.name,
            startDate: classEntity.startDate, // Use class dates since courses don't have their own dates
            endDate: classEntity.endDate,
            teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'No Teacher Assigned',
            courseMaterial: course.name || 'No description available',
            sessionTime: course.sessions?.map(session => ({
              day: session.day,
              startTime: session.startTime,
              endTime: session.endTime
            })) || []
          })) || []
        };

        classesMap.set(classEntity.id, transformedClass);
      }
    }

    // Get individual course enrollments (if any)
    if (student.courseIds && student.courseIds.length > 0) {
      const individualCourses = await this.courseRepository.find({
        where: { id: In(student.courseIds) },
        relations: ['teacher', 'class']
      });

      // Group individual courses by their class
      const coursesByClass = {};
      individualCourses.forEach(course => {
        const classId = course.classId;
        if (!coursesByClass[classId]) {
          coursesByClass[classId] = {
            class: course.class,
            courses: []
          };
        }
        coursesByClass[classId].courses.push(course);
      });

      // Create or update class objects for individual course enrollments
      for (const classData of Object.values(coursesByClass) as any[]) {
        const { class: classEntity, courses } = classData;
        if (classesMap.has(classEntity.id)) {
          // Class already exists from class enrollment, just update the courses
          const existingClass = classesMap.get(classEntity.id);
          // Add individual courses to the existing class
          const individualCourseData = courses.map(course => ({
            id: course.id,
            name: course.name,
            startDate: classEntity.startDate,
            endDate: classEntity.endDate,
            teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'No Teacher Assigned',
            courseMaterial: course.name || 'No description available',
            sessionTime: course.sessions?.map(session => ({
              day: session.day,
              startTime: session.startTime,
              endTime: session.endTime
            })) || []
          }));
          
          // Merge courses, avoiding duplicates
          const existingCourseIds = existingClass.courses.map(c => c.id);
          const newCourses = individualCourseData.filter(c => !existingCourseIds.includes(c.id));
          existingClass.courses = [...existingClass.courses, ...newCourses];
        } else {
          // Create new class object for individual course enrollments
          // Get all unique students enrolled in this class (both class-level and individual course enrollments)
          const classLevelStudents = await this.studentRepository.find({
            where: { classId: classEntity.id },
            select: ['id']
          });

          // Get all students enrolled in any course within this class
          const courseLevelStudents = await this.studentRepository
            .createQueryBuilder('student')
            .innerJoin('courses', 'course', 'course.id::text = ANY(string_to_array(student.courseIds, \',\'))')
            .where('course.classId = :classId', { classId: classEntity.id })
            .select('student.id')
            .getMany();

          // Combine and deduplicate student IDs
          const allStudentIds = new Set([
            ...classLevelStudents.map(s => s.id),
            ...courseLevelStudents.map(s => s.id)
          ]);

          const transformedClass = {
            id: classEntity.id,
            name: classEntity.name,
            startDate: classEntity.startDate,
            endDate: classEntity.endDate,
            numberOfStudents: allStudentIds.size,
            status: 'active',
            courses: courses.map(course => ({
              id: course.id,
              name: course.name,
              startDate: classEntity.startDate,
              endDate: classEntity.endDate,
              teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'No Teacher Assigned',
              courseMaterial: course.name || 'No description available',
              sessionTime: course.sessions?.map(session => ({
                day: session.day,
                startTime: session.startTime,
                endTime: session.endTime
              })) || []
            }))
          };

          classesMap.set(classEntity.id, transformedClass);
        }
      }
    }

    return Array.from(classesMap.values());
  }

  // Individual course enrollment methods
  async enrollStudentInCourse(studentId: string, courseId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if student is already enrolled in this course
    const existingCourseIds = student.courseIds || [];
    if (existingCourseIds.includes(courseId)) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Add course to student's courseIds
    student.courseIds = [...existingCourseIds, courseId];
    
    // Also add student to course.students array
    const existingStudents = course.students || [];
    if (!existingStudents.includes(studentId)) {
      course.students = [...existingStudents, studentId];
      await this.courseRepository.save(course);
    }
    
    const savedStudent = await this.studentRepository.save(student);
    
    // Auto-remove form completion record when student is enrolled
    await this.autoRemoveFormCompletionOnEnrollment(studentId);
    
    return savedStudent;
  }

  async unenrollStudentFromCourse(studentId: string, courseId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    
    const existingCourseIds = student.courseIds || [];
    if (!existingCourseIds.includes(courseId)) {
      throw new NotFoundException('Student is not enrolled in this course');
    }

    // Remove course from student's courseIds
    student.courseIds = existingCourseIds.filter(id => id !== courseId);
    
    // Also remove student from course.students array
    if (course) {
      const existingStudents = course.students || [];
      course.students = existingStudents.filter(id => id !== studentId);
      await this.courseRepository.save(course);
    }

    // No need to check classId since we're only using course-level enrollment
    
    return this.studentRepository.save(student);
  }

  async getStudentCourseEnrollments(studentId: string): Promise<Course[]> {
    const student = await this.findOne(studentId);
    
    if (!student.courseIds || student.courseIds.length === 0) {
      return [];
    }

    return this.courseRepository.find({
      where: { id: In(student.courseIds) },
      relations: ['teacher', 'class']
    });
  }

  async isStudentEnrolledInCourse(studentId: string, courseId: string): Promise<boolean> {
    const student = await this.findOne(studentId);
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    
    if (!course) {
      return false;
    }

    // Check direct course enrollment (course.students array)
    const courseStudents = course.students || [];
    if (courseStudents.includes(studentId)) {
      return true;
    }
    
    // Check class enrollment
    if (student.classId) {
      if (course.classId === student.classId) {
        return true; // Student has access through class enrollment
      }
    }

    // Check individual course enrollment (student.courseIds)
    const courseIds = student.courseIds || [];
    return courseIds.includes(courseId);
  }

  async markFormCompleted(studentId: string) {
    const student = await this.findOne(studentId);
    
    if (student.registrationFormCompleted) {
      throw new ConflictException('Registration form has already been completed');
    }

    student.registrationFormCompleted = true;
    student.formCompletionDate = new Date();

    await this.studentRepository.save(student);

    return {
      message: 'Registration form marked as completed successfully',
      formCompleted: true,
      completionDate: student.formCompletionDate,
    };
  }

  async getFormStatus(studentId: string) {
    const student = await this.findOne(studentId);
    
    return {
      formCompleted: student.registrationFormCompleted,
      completionDate: student.formCompletionDate,
      hasClasses: !!student.classId,
    };
  }

  async getFormCompletions() {
    const students = await this.studentRepository.find({
      where: { registrationFormCompleted: true },
      relations: ['user'],
      select: {
        id: true,
        registrationFormCompleted: true,
        formCompletionDate: true,
        classId: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        }
      },
      order: { formCompletionDate: 'DESC' }
    });

    return students.map(student => ({
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      phone: student.user.phone,
      formCompletionDate: student.formCompletionDate,
      hasClasses: !!student.classId,
      createdAt: student.user.createdAt,
    }));
  }

  async resetFormCompletion(studentId: string) {
    const student = await this.findOne(studentId);
    
    if (!student.registrationFormCompleted) {
      throw new ConflictException('This student has not completed the registration form yet');
    }

    student.registrationFormCompleted = false;
    student.formCompletionDate = null;

    await this.studentRepository.save(student);

    return {
      message: 'Form completion status reset successfully. Student can now access the form again.',
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      resetAt: new Date(),
    };
  }

  /**
   * Automatically removes form completion record when a student is enrolled in a class or course
   * This ensures that pending form completions are cleared once the student is enrolled
   */
  async autoRemoveFormCompletionOnEnrollment(studentId: string): Promise<void> {
    try {
      const student = await this.findOne(studentId);
      
      // Only remove form completion if the student has completed the form and is now enrolled
      if (student.registrationFormCompleted && (student.classId || (student.courseIds && student.courseIds.length > 0))) {
        student.registrationFormCompleted = false;
        student.formCompletionDate = null;
        
        await this.studentRepository.save(student);
        
        console.log(`✅ Auto-removed form completion for student ${studentId} (${student.user.firstName} ${student.user.lastName}) - now enrolled in class/course`);
      }
    } catch (error) {
      console.error(`❌ Error auto-removing form completion for student ${studentId}:`, error);
      // Don't throw error to avoid breaking the enrollment process
    }
  }
}

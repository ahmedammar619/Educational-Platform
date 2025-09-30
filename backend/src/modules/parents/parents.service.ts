import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Program } from '../programs/entities/program.entity';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { AddChildDto } from './dto/add-child.dto';
import { CreateChildAccountDto } from './dto/create-child-account.dto';
import { Role } from '../../common/enums/role.enum';
import { StudentsService } from '../students/students.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly studentsService: StudentsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async createParent(createParentDto: CreateParentDto): Promise<Parent> {
    const { email, password, firstName, lastName, phone, ...rest } = createParentDto;

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
      role: Role.Parent,
      phone,
    });

    const savedUser = await this.userRepository.save(user);

    // Create parent record with the same ID
    const parent = this.parentRepository.create({
      id: savedUser.id,
      studentIds: [], // Start with empty array
    });

    return this.parentRepository.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentRepository.find({
      relations: ['user'],
      select: {
        id: true,
        studentIds: true,
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

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        id: true,
        studentIds: true,
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

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  async findByEmail(email: string): Promise<Parent> {
    const user = await this.userRepository.findOne({
      where: { email, role: Role.Parent },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt']
    });

    if (!user) {
      return null;
    }

    return this.parentRepository.findOne({
      where: { id: user.id },
      relations: ['user'],
      select: {
        id: true,
        studentIds: true,
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

  async updateParent(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.findOne(id);

    if (updateParentDto.password) {
      const passwordHash = await bcrypt.hash(updateParentDto.password, 10);
      await this.userRepository.update(id, { passwordHash });
      delete updateParentDto.password;
    }

    // Update user fields if provided
    const userFields = ['firstName', 'lastName', 'email'];
    const userUpdateData = {};
    const parentUpdateData = {};

    Object.keys(updateParentDto).forEach(key => {
      if (userFields.includes(key)) {
        userUpdateData[key] = updateParentDto[key];
      } else {
        parentUpdateData[key] = updateParentDto[key];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      await this.userRepository.update(id, userUpdateData);
    }

    if (Object.keys(parentUpdateData).length > 0) {
      await this.parentRepository.update(id, parentUpdateData);
    }

    return this.findOne(id);
  }

  async deleteParent(id: string): Promise<void> {
    console.log(`🗑️ Starting deletion of parent: ${id}`);
    
    // First check if parent record exists
    let parent;
    try {
      parent = await this.findOne(id);
      console.log(`📋 Parent found: ${parent.user.firstName} ${parent.user.lastName}`);
      console.log(`👶 Children to delete: ${JSON.stringify(parent.studentIds)}`);
    } catch (error) {
      if (error.message === 'Parent not found') {
        console.log(`⚠️ Parent record not found in parents table, checking if user exists with parent role...`);
        
        // Try to create missing parent record first
        const parent = await this.ensureParentRecordExists(id);
        
        if (parent) {
          console.log(`✅ Created missing parent record, proceeding with normal deletion...`);
          // Now proceed with normal deletion logic
          await this.deleteParentRecords(id, parent);
          return;
        }
        
        // If we can't create parent record, check if user exists with parent role
        const user = await this.userRepository.findOne({
          where: { id, role: Role.Parent }
        });
        
        if (!user) {
          throw new NotFoundException('Parent not found');
        }
        
        console.log(`✅ User found with parent role: ${user.firstName} ${user.lastName}`);
        console.log(`ℹ️ No parent record exists, proceeding with user deletion only`);
        
        // Just delete the user record since no parent record exists
        await this.userRepository.delete(id);
        console.log(`✅ User record deleted: ${id}`);
        return;
      } else {
        throw error;
      }
    }
    
    // Proceed with normal deletion logic
    await this.deleteParentRecords(id, parent);
  }

  // Helper method to handle the actual deletion of parent records and children
  private async deleteParentRecords(id: string, parent: Parent): Promise<void> {
    // Delete all students that have this parent (cascade delete)
    if (parent.studentIds && parent.studentIds.length > 0) {
      console.log(`🔄 Processing ${parent.studentIds.length} children...`);
      
      // Delete all students that belong to this parent
      for (const studentId of parent.studentIds) {
        try {
          console.log(`🔍 Checking student ${studentId} before deletion...`);
          
          // Check if student exists in students table
          const studentExists = await this.studentRepository.findOne({ where: { id: studentId } });
          console.log(`📊 Student exists in students table: ${!!studentExists}`);
          
          // Check if user exists in users table
          const userExists = await this.userRepository.findOne({ where: { id: studentId } });
          console.log(`👤 User exists in users table: ${!!userExists}`);
          
          if (studentExists) {
            console.log(`🗑️ Deleting student record: ${studentId}`);
            await this.studentRepository.delete(studentId);
            console.log(`✅ Student record deleted: ${studentId}`);
          } else {
            console.log(`⚠️ Student record not found: ${studentId}`);
          }
          
          if (userExists) {
            console.log(`🗑️ Deleting user record: ${studentId}`);
            await this.userRepository.delete(studentId);
            console.log(`✅ User record deleted: ${studentId}`);
          } else {
            console.log(`⚠️ User record not found: ${studentId}`);
          }
          
          console.log(`✅ Successfully processed student: ${studentId}`);
        } catch (error) {
          console.error(`❌ Error deleting student ${studentId}:`, error);
          console.error(`❌ Error details:`, {
            message: error.message,
            stack: error.stack
          });
          // Continue with other students even if one fails
        }
      }
    } else {
      console.log(`ℹ️ No children to delete for parent: ${id}`);
    }
    
    // Delete parent record first
    console.log(`🗑️ Deleting parent record: ${id}`);
    await this.parentRepository.delete(id);
    console.log(`✅ Parent record deleted: ${id}`);
    
    // Delete the corresponding user record manually (since cascade doesn't work in this direction)
    console.log(`🗑️ Deleting user record: ${id}`);
    await this.userRepository.delete(id);
    console.log(`✅ User record deleted: ${id}`);
    
    console.log(`🎉 Parent deletion completed: ${id}`);
  }

  async addChild(parentId: string, addChildDto: AddChildDto): Promise<Parent> {
    const parent = await this.findOne(parentId);
    const { studentId } = addChildDto;

    // Add child to parent_children table through the relationship
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Add student ID to parent's studentIds array
    if (!parent.studentIds.includes(studentId)) {
      parent.studentIds.push(studentId);
      const savedParent = await this.parentRepository.save(parent);
      
      // Send notification to parent about child being added
      try {
        await this.notificationsService.createAddedToClassNotification(
          parentId,
          'Your child has been added to your account',
          {
            childId: studentId,
            childName: `${student.firstName} ${student.lastName}`,
            parentId: parentId
          }
        );
        console.log('✅ Child added notification sent to parent:', parentId);
      } catch (error) {
        console.error('❌ Failed to send child added notification:', error);
      }
      
      return savedParent;
    }

    return parent;
  }

  async removeChild(parentId: string, studentId: string): Promise<Parent> {
    const parent = await this.findOne(parentId);
    
    // Verify the student exists and belongs to this parent
    if (!parent.studentIds.includes(studentId)) {
      throw new NotFoundException('Student not found in parent\'s children list');
    }

    // Check if student exists in users table
    const studentUser = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student }
    });

    if (!studentUser) {
      throw new NotFoundException('Student user not found');
    }

    // Remove student ID from parent's studentIds array
    parent.studentIds = parent.studentIds.filter(id => id !== studentId);
    await this.parentRepository.save(parent);

    // Delete the student user from users table
    // This will cascade delete the student record due to the CASCADE relationship
    await this.userRepository.delete(studentId);

    return parent;
  }

  async getChildren(parentId: string): Promise<any[]> {
    const parent = await this.findOne(parentId);
    
    if (parent.studentIds && parent.studentIds.length > 0) {
      // Fetch student details for each student ID using modern TypeORM syntax
      const students = await this.userRepository.find({
        where: parent.studentIds.map(id => ({ id })),
        select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
      });
      return students;
    }
    
    return [];
  }

  async getChildrenDetailed(parentId: string): Promise<any[]> {
    const parent = await this.findOne(parentId);
    
    if (parent.studentIds && parent.studentIds.length > 0) {
      // Fetch detailed student information including class data
      const detailedChildren = await Promise.all(
        parent.studentIds.map(async (studentId) => {
          try {
            // Get full student entity with user data
            const student = await this.studentsService.findOne(studentId);
            
            // Calculate age from birthDate
            let age = null;
            if (student.birthDate) {
              const birthDate = new Date(student.birthDate);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            // Get class information if classId exists
            let classInfo = null;
            if (student.classId) {
              try {
                                 classInfo = await this.classRepository.findOne({
                   where: { id: student.classId },
                   select: ['id', 'name']
                 });
              } catch (error) {
                console.error(`Failed to fetch class info for classId ${student.classId}:`, error);
              }
            }

            // Get program information if programIds exist
            let programInfo = [];
            if (student.programIds && student.programIds.length > 0) {
              try {
                const programs = await this.programRepository.find({
                  where: { id: In(student.programIds) },
                  select: ['id', 'name', 'price']
                });
                programInfo = programs || [];
              } catch (error) {
                console.error(`Failed to fetch program info for programIds ${student.programIds}:`, error);
              }
            }

            return {
              id: student.id,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              email: student.user.email,
              birthDate: student.birthDate,
              age: age,
              classId: student.classId,
                             className: classInfo?.name || 'Not specified',
              parentId: student.parentId,
              accountType: student.parentId ? 'Linked to Parent Account' : 'Individual Student Account',
              createdAt: student.user.createdAt,
              programs: programInfo
            };
          } catch (error) {
            console.error(`Failed to fetch detailed info for student ${studentId}:`, error);
            // Return basic info if detailed fetch fails
            const basicStudent = await this.userRepository.findOne({
              where: { id: studentId },
              select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
            });
            
            return {
              id: basicStudent?.id,
              firstName: basicStudent?.firstName,
              lastName: basicStudent?.lastName,
              email: basicStudent?.email,
              age: null,
              className: 'Not specified',
              accountType: 'Unknown',
              createdAt: basicStudent?.createdAt
            };
          }
        })
      );
      
      return detailedChildren;
    }
    
    return [];
  }

  async createChildAccount(parentId: string, createChildAccountDto: CreateChildAccountDto): Promise<any> {
    // Verify parent exists
    const parent = await this.findOne(parentId);
    
    // Create the student account
    const student = await this.studentsService.createStudent({
      ...createChildAccountDto,
      parentId: parentId,
    });
    
    // Fetch the student with user data loaded
    const studentWithUser = await this.studentsService.findOne(student.id);
    
    // Add student to parent's studentIds array
    if (!parent.studentIds.includes(student.id)) {
      parent.studentIds.push(student.id);
      await this.parentRepository.save(parent);
    }
    
    return {
      message: 'Child account created successfully',
      student: {
        id: studentWithUser.id,
        firstName: studentWithUser.user.firstName,
        lastName: studentWithUser.user.lastName,
        email: studentWithUser.user.email,
        birthDate: studentWithUser.birthDate,
        parentId: studentWithUser.parentId,
      },
      parent: {
        id: parent.id,
        name: `${parent.user.firstName} ${parent.user.lastName}`,
      }
    };
  }

  // Method to remove a specific student ID from all parents (useful for cleanup)
  async removeStudentFromAllParents(studentId: string): Promise<void> {
    // Find all parents that have this student ID in their studentIds array
    const parents = await this.parentRepository
      .createQueryBuilder('parent')
      .where(':studentId = ANY(parent.studentIds)', { studentId })
      .getMany();
    
    for (const parent of parents) {
      parent.studentIds = parent.studentIds.filter(id => id !== studentId);
      await this.parentRepository.save(parent);
    }
  }

  // Method to ensure a parent record exists for a given user ID
  async ensureParentRecordExists(userId: string): Promise<Parent | null> {
    // First check if parent record already exists
    let parent = await this.parentRepository.findOne({
      where: { id: userId },
      relations: ['user']
    });

    if (parent) {
      return parent;
    }

    // If no parent record exists, verify the user exists and has Parent role
    const user = await this.userRepository.findOne({
      where: { id: userId, role: Role.Parent }
    });

    if (!user) {
      return null; // User doesn't exist or doesn't have parent role
    }

    // Create the parent record
    console.log(`🔧 Creating missing parent record for user: ${user.firstName} ${user.lastName}`);
    parent = this.parentRepository.create({
      id: userId,
      studentIds: []
    });

    return this.parentRepository.save(parent);
  }

  // Method to create a parent record from an existing user (for auth service)
  async createParentFromUser(userId: string): Promise<Parent> {
    // Check if parent record already exists
    const existingParent = await this.parentRepository.findOne({
      where: { id: userId }
    });

    if (existingParent) {
      return existingParent;
    }

    // Create new parent record
    const parent = this.parentRepository.create({
      id: userId,
      studentIds: []
    });

    return this.parentRepository.save(parent);
  }

  // Child-specific methods
  async getChildProgress(parentId: string, childId: string): Promise<any> {
    // Verify parent exists and has access to this child
    const parent = await this.findOne(parentId);
    
    if (!parent.studentIds.includes(childId)) {
      throw new NotFoundException('Child not found or not associated with this parent');
    }

    // For now, return mock data structure - you can implement actual data fetching later
    return {
      courses: [],
      recentGrades: [],
      attendanceSummary: []
    };
  }

  async getChildAttendance(parentId: string, childId: string): Promise<any> {
    // Verify parent exists and has access to this child
    const parent = await this.findOne(parentId);
    
    if (!parent.studentIds.includes(childId)) {
      throw new NotFoundException('Child not found or not associated with this parent');
    }

    // For now, return mock data structure - you can implement actual data fetching later
    return {
      attendance: [],
      summary: {
        totalSessions: 0,
        attendedSessions: 0,
        attendanceRate: 0
      }
    };
  }

  async getChildGrades(parentId: string, childId: string): Promise<any> {
    // Verify parent exists and has access to this child
    const parent = await this.findOne(parentId);
    
    if (!parent.studentIds.includes(childId)) {
      throw new NotFoundException('Child not found or not associated with this parent');
    }

    // For now, return mock data structure - you can implement actual data fetching later
    return {
      grades: [],
      summary: {
        averageGrade: 0,
        totalAssignments: 0,
        completedAssignments: 0
      }
    };
  }

  async getChildrenTeachers(parentId: string): Promise<any> {
    // Verify parent exists
    const parent = await this.findOne(parentId);
    
    if (!parent.studentIds || parent.studentIds.length === 0) {
      return {
        teachers: [],
        children: []
      };
    }

    // Get all teachers for the parent's children based on their class assignments
    const teacherMap = new Map();
    const childrenData = [];

    for (const childId of parent.studentIds) {
      // Get child user data
      const childUser = await this.userRepository.findOne({
        where: { id: childId },
        select: ['id', 'firstName', 'lastName', 'email']
      });

      if (childUser) {
        childrenData.push({
          id: childUser.id,
          firstName: childUser.firstName,
          lastName: childUser.lastName,
          email: childUser.email
        });

        // Get child's enrolled courses and their details
        const student = await this.studentRepository.findOne({
          where: { id: childId },
          relations: ['class']
        });

        if (student && student.courseIds && student.courseIds.length > 0) {
          // Get only the courses the student is actually enrolled in
          const enrolledCourses = await this.courseRepository.find({
            where: { id: In(student.courseIds) },
            relations: ['teacher', 'class']
          });

          // Process each enrolled course to get teacher information
          for (const course of enrolledCourses) {
            if (course.teacher) {
              const teacherId = course.teacher.id;
              
              if (!teacherMap.has(teacherId)) {
                teacherMap.set(teacherId, {
                  id: teacherId,
                  firstName: course.teacher.firstName,
                  lastName: course.teacher.lastName,
                  email: course.teacher.email,
                  phone: course.teacher.phone,
                  courses: [],
                  children: []
                });
              }
              
              const teacher = teacherMap.get(teacherId);
              
              // Add course if not already present
              const courseExists = teacher.courses.find(c => c.id === course.id);
              if (!courseExists) {
                teacher.courses.push({
                  id: course.id,
                  name: course.name,
                  className: course.class ? course.class.name : 'Unknown Class'
                });
              }
              
              // Add child if not already present
              const childExists = teacher.children.find(c => c.id === childId);
              if (!childExists) {
                teacher.children.push({
                  id: childId,
                  firstName: childUser.firstName,
                  lastName: childUser.lastName,
                  courses: [{
                    id: course.id,
                    name: course.name,
                    className: course.class ? course.class.name : 'Unknown Class'
                  }]
                });
              } else {
                // Add course to existing child if not already present
                const childCourseExists = childExists.courses.find(c => c.id === course.id);
                if (!childCourseExists) {
                  childExists.courses.push({
                    id: course.id,
                    name: course.name,
                    className: course.class ? course.class.name : 'Unknown Class'
                  });
                }
              }
            }
          }
        }
      }
    }

    return {
      teachers: Array.from(teacherMap.values()),
      children: childrenData
    };
  }

  async getParentSchedule(parentId: string): Promise<any> {
    const parent = await this.findOne(parentId);
    
    console.log('Parent schedule request for parentId:', parentId);
    console.log('Parent studentIds:', parent.studentIds);
    
    if (!parent.studentIds || parent.studentIds.length === 0) {
      console.log('No student IDs found for parent');
      return {
        children: [],
        schedule: []
      };
    }

    // Get children with their class assignments and course schedules
    const childrenSchedule = await Promise.all(
      parent.studentIds.map(async (studentId) => {
        try {
          console.log(`Processing student: ${studentId}`);
          
          // Get student details
          const student = await this.userRepository.findOne({
            where: { id: studentId, role: Role.Student },
            select: ['id', 'firstName', 'lastName', 'email', 'createdAt']
          });

          if (!student) {
            console.log(`Student not found: ${studentId}`);
            return null;
          }

          console.log(`Found student: ${student.firstName} ${student.lastName}`);

          // Get student's classId from the students table
          const studentEntity = await this.studentsService.findOne(studentId);
          
          if (!studentEntity) {
            console.log(`Student entity not found: ${studentId}`);
            return null;
          }

          const classId = studentEntity.classId;
          console.log(`Student ${student.firstName} is in class: ${classId}`);

          // Check if student is enrolled in any class
          if (!classId) {
            console.log(`Student ${student.firstName} is not enrolled in any class`);
            return {
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              classesCount: 0,
              classes: []
            };
          }

          // Get the class first
          const classEntity = await this.classRepository.findOne({
            where: { id: classId }
          });

          if (!classEntity) {
            console.log(`Class not found: ${classId}`);
            return null;
          }

          console.log(`Class ${classEntity.name} found`);

          // First, let's check what courses exist in this class
          const coursesWithoutTeacher = await this.courseRepository.find({
            where: { classId: classId }
          });
          
          console.log(`Raw courses in class ${classId}:`, coursesWithoutTeacher.map(c => ({
            id: c.id,
            name: c.name,
            teacherId: c.teacherId
          })));

          // Get all courses in the class with their teachers
          const courses = await this.courseRepository.find({
            where: { classId: classId },
            relations: ['teacher']
          });

          console.log(`Found ${courses.length} courses in class ${classEntity.name}`);
          
          // Debug: Log course and teacher details
          courses.forEach(course => {
            console.log(`Course: ${course.name}, TeacherId: ${course.teacherId}, Teacher:`, course.teacher);
            if (course.teacher) {
              console.log(`Teacher details: firstName=${course.teacher.firstName}, lastName=${course.teacher.lastName}`);
            } else {
              console.log(`Teacher is null/undefined for course: ${course.name}`);
            }
          });

          const classes = await Promise.all(courses.map(async (course) => {
            let teacherName = 'Teacher TBD';
            
            if (course.teacher) {
              teacherName = `${course.teacher.firstName} ${course.teacher.lastName}`;
            } else if (course.teacherId) {
              // If relationship didn't load, try to fetch teacher manually
              try {
                const teacher = await this.userRepository.findOne({
                  where: { id: course.teacherId }
                });
                if (teacher) {
                  teacherName = `${teacher.firstName} ${teacher.lastName}`;
                  console.log(`Manually fetched teacher for ${course.name}: ${teacherName}`);
                }
              } catch (error) {
                console.log(`Error fetching teacher for course ${course.name}:`, error);
              }
            }
            
            console.log(`Mapping course ${course.name}: teacherName="${teacherName}"`);
            
            return {
              id: course.id,
              name: course.name || 'Unknown Course',
              description: `Course for ${course.name || 'Unknown Course'}`,
              teacherId: course.teacherId || null,
              teacher: teacherName,
              schedule: course.sessions || [],
              startDate: classEntity.startDate || new Date(),
              endDate: classEntity.endDate || new Date(),
              enrolledAt: new Date() // Since student is in the class, they're enrolled
            };
          }));

          console.log(`Student ${student.firstName} classes:`, classes.length, classes.map(c => ({ name: c.name, schedule: c.schedule })));

          return {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            age: this.calculateAge(student.createdAt),
            classesCount: classes.length,
            classes: classes
          };
        } catch (error) {
          console.error(`Error getting schedule for student ${studentId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validChildren = childrenSchedule.filter(child => child !== null);

    // Convert classes to schedule events
    const scheduleEvents = [];
    validChildren.forEach(child => {
      child.classes.forEach(classItem => {
        if (classItem.schedule && Array.isArray(classItem.schedule)) {
          classItem.schedule.forEach(session => {
            scheduleEvents.push({
              id: `class-${classItem.id}-${session.day}-${child.id}`,
              title: classItem.name,
              type: 'lecture',
              day: session.day,
              startTime: session.startTime,
              endTime: session.endTime,
              instructor: classItem.teacher,
              courseTitle: classItem.name,
              description: classItem.description,
              classId: classItem.id,
              childId: child.id,
              childName: child.name,
              enrolledAt: classItem.enrolledAt
            });
          });
        }
      });
    });

    return {
      children: validChildren,
      schedule: scheduleEvents
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Check if a student belongs to a parent
  async isChildOfParent(parentId: string, studentId: string): Promise<boolean> {
    const parent = await this.parentRepository.findOne({
      where: { id: parentId },
    });

    if (!parent) {
      return false;
    }

    return parent.studentIds.includes(studentId);
  }

  async getParentNotifications(parentId: string): Promise<any> {
    return this.notificationsService.findAll(parentId);
  }

  async markNotificationAsRead(notificationId: string, parentId: string): Promise<any> {
    return this.notificationsService.update(notificationId, parentId, { isRead: true });
  }

}

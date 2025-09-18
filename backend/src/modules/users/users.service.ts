import { Injectable, NotFoundException, ConflictException, ForbiddenException ,BadRequestException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { TeachersService } from '../teachers/teachers.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly teachersService: TeachersService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt'],
    });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Hash password only if provided (for teachers, password is optional)
    let passwordHash: string | undefined;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    } else if (userData.role === Role.Teacher) {
      // For teachers without password, we'll set it during email verification
      passwordHash = null;
    } else {
      throw new BadRequestException('Password is required for non-teacher roles');
    }

    // Create user
    const user = this.userRepository.create({
      ...userData,
      email,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Also create record in the appropriate separate table based on role
    try {
      if (savedUser.role === Role.Teacher) {
        await this.teachersService.createTeacherFromUser(savedUser.id);
        
        // Send verification email for teachers
        try {
          const verificationToken = crypto.randomBytes(32).toString('hex');
          const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Update user with verification token
          await this.userRepository.update(savedUser.id, {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
            lastVerificationEmailSent: new Date(),
          });

          // Send verification email
          await this.emailService.sendVerificationEmail(
            savedUser.email,
            verificationToken,
            savedUser.firstName
          );
          console.log('✅ Verification email sent to new teacher');
        } catch (error) {
          console.error('❌ Failed to send verification email to teacher:', error);
          // Don't fail user creation if email sending fails
        }
      } else if (savedUser.role === Role.Student) {
        // Extract student-specific data from the DTO
        const { birthDate, parentId } = createUserDto;
        if (!birthDate) {
          throw new Error('Birth date is required for students');
        }
        await this.studentsService.createStudentFromUser(savedUser.id, birthDate, savedUser.phone, parentId);
        
        // For students, mark email as verified by default
        await this.userRepository.update(savedUser.id, {
          emailVerified: true,
        });
        console.log('✅ Student email marked as verified by default');
      } else if (savedUser.role === Role.Parent) {
        // Create parent record for users with Parent role
        await this.parentsService.createParentFromUser(savedUser.id);
        
        // Send verification email for parents
        try {
          const verificationToken = crypto.randomBytes(32).toString('hex');
          const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Update user with verification token
          await this.userRepository.update(savedUser.id, {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
            lastVerificationEmailSent: new Date(),
          });

          // Send verification email
          await this.emailService.sendVerificationEmail(
            savedUser.email,
            verificationToken,
            savedUser.firstName
          );
          console.log('✅ Verification email sent to new parent');
        } catch (error) {
          console.error('❌ Failed to send verification email to parent:', error);
          // Don't fail user creation if email sending fails
        }
      }
    } catch (error) {
      // If creating in separate table fails, we should clean up the user
      // For now, just log the error - in production you might want to handle this differently
      console.error('Failed to create record in separate table:', error);
      // Note: The user account is still created in the users table
    }
    
    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Prevent role escalation - only allow role changes for admin users
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      throw new ForbiddenException('Role changes are restricted to administrators');
    }

    // Prepare update data
    const updateData: any = { ...updateUserDto };

    // Hash password if it's being updated (optimized: 10 rounds for better performance while maintaining security)
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, saltRounds);
      delete updateData.password;
    }

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);
    
    // Handle student-specific updates
    if (updatedUser.role === Role.Student && (updateUserDto.birthDate || updateUserDto.parentId !== undefined)) {
      try {
        await this.studentsService.updateStudentFromUser(id, {
          birthDate: updateUserDto.birthDate,
          parentId: updateUserDto.parentId
        });
      } catch (error) {
        console.error('Failed to update student record:', error);
        // Note: The user account is still updated
      }
    }

    // Handle role-specific record creation if role was changed
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      try {
        if (updateUserDto.role === Role.Teacher) {
          await this.teachersService.createTeacherFromUser(id);
        } else if (updateUserDto.role === Role.Student) {
          // For role change to student, we need birthDate
          if (!updateUserDto.birthDate) {
            throw new Error('Birth date is required when changing role to student');
          }
          await this.studentsService.createStudentFromUser(id, updateUserDto.birthDate, updatedUser.phone);
        } else if (updateUserDto.role === Role.Parent) {
          await this.parentsService.createParentFromUser(id);
        }
      } catch (error) {
        console.error('Failed to create role-specific record:', error);
        // Note: The user account is still updated
      }
    }
    
    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    
    console.log(`🔄 Starting deletion process for user: ${user.firstName} ${user.lastName} (${user.role})`);
    
    // ALWAYS clean up references first, regardless of role
    await this.cleanupUserReferences(id);
    
    // If the user is a parent, use the parent-specific deletion logic
    if (user.role === Role.Parent) {
      console.log(`🔄 User ${user.firstName} ${user.lastName} is a parent, using parent deletion logic`);
      await this.parentsService.deleteParent(id);
      return { message: 'Parent and all children deleted successfully' };
    }
    
    // If the user is a teacher, delete the teacher record first, then the user
    if (user.role === Role.Teacher) {
      console.log(`🔄 User ${user.firstName} ${user.lastName} is a teacher, cleaning up teacher record`);
      // Delete teacher record if it exists (this might cascade delete the user)
      try {
        await this.userRepository.query('DELETE FROM teachers WHERE id = $1', [id]);
        console.log('✅ Teacher record deleted');
      } catch (error) {
        console.log('⚠️ Teacher record may not exist or already deleted:', error.message);
      }
    }
    
    // Delete the user record (if not already deleted by cascade)
    try {
      const deleteResult = await this.userRepository.delete(id);
      if (deleteResult.affected && deleteResult.affected > 0) {
        console.log('✅ User record deleted');
      } else {
        console.log('⚠️ User record may have been already deleted by cascade');
      }
    } catch (error) {
      console.log('⚠️ User deletion error (may be expected if cascade deleted):', error.message);
    }
    
    return { message: 'User deleted successfully' };
  }

  private async cleanupUserReferences(userId: string): Promise<void> {
    console.log(`🧹 Cleaning up references for user: ${userId}`);
    
    try {
      // Use raw queries to avoid circular dependencies and ensure all references are cleaned up
      
      // 1. Unassign from courses (set teacherId to null)
      const coursesResult = await this.userRepository.query(
        'UPDATE courses SET "teacherId" = NULL WHERE "teacherId" = $1',
        [userId]
      );
      console.log(`📚 Unassigned user from ${coursesResult[1] || 0} courses`);
      
      // 2. Unassign from zoom meetings (set createdById to null)
      const zoomResult = await this.userRepository.query(
        'UPDATE zoom_meetings SET "createdById" = NULL WHERE "createdById" = $1',
        [userId]
      );
      console.log(`🎥 Unassigned user from ${zoomResult[1] || 0} zoom meetings`);
      
      // 3. Unassign from announcement meetings (set createdById to null)
      const announcementMeetingsResult = await this.userRepository.query(
        'UPDATE announcement_meetings SET "createdById" = NULL WHERE "createdById" = $1',
        [userId]
      );
      console.log(`📢 Unassigned user from ${announcementMeetingsResult[1] || 0} announcement meetings`);
      
      // 4. Unassign from attendance records (set markedBy to null)
      const attendanceResult = await this.userRepository.query(
        'UPDATE attendance SET "markedBy" = NULL WHERE "markedBy" = $1',
        [userId]
      );
      console.log(`✅ Unassigned user from ${attendanceResult[1] || 0} attendance records`);
      
      // 5. Unassign from announcement posts (set authorId to null)
      const announcementPostsResult = await this.userRepository.query(
        'UPDATE announcement_posts SET "authorId" = NULL WHERE "authorId" = $1',
        [userId]
      );
      console.log(`📝 Unassigned user from ${announcementPostsResult[1] || 0} announcement posts`);
      
      // 6. Unassign from files (set uploadedBy to null)
      const filesResult = await this.userRepository.query(
        'UPDATE files SET "uploadedBy" = NULL WHERE "uploadedBy" = $1',
        [userId]
      );
      console.log(`📁 Unassigned user from ${filesResult[1] || 0} files`);
      
      // 7. Unassign from posts (set authorId to null)
      const postsResult = await this.userRepository.query(
        'UPDATE posts SET "authorId" = NULL WHERE "authorId" = $1',
        [userId]
      );
      console.log(`📄 Unassigned user from ${postsResult[1] || 0} posts`);
      
      // 8. Unassign from assignments (set createdBy to null)
      const assignmentsResult = await this.userRepository.query(
        'UPDATE assignments SET "createdBy" = NULL WHERE "createdBy" = $1',
        [userId]
      );
      console.log(`📋 Unassigned user from ${assignmentsResult[1] || 0} assignments`);
      
      // 9. Unassign from folders (set createdBy to null)
      const foldersResult = await this.userRepository.query(
        'UPDATE folders SET "createdBy" = NULL WHERE "createdBy" = $1',
        [userId]
      );
      console.log(`📂 Unassigned user from ${foldersResult[1] || 0} folders`);
      
      // 10. Unassign from assignment submissions (set gradedBy to null, but keep studentId for record keeping)
      const submissionsResult = await this.userRepository.query(
        'UPDATE assignment_submissions SET "gradedBy" = NULL WHERE "gradedBy" = $1',
        [userId]
      );
      console.log(`📊 Unassigned user from ${submissionsResult[1] || 0} assignment submissions`);
      
      // 11. Clean up teacher courses array if user is a teacher
      const teacherResult = await this.userRepository.query(
        'UPDATE teachers SET courses = $1 WHERE id = $2',
        [[], userId]
      );
      console.log(`👨‍🏫 Cleaned up ${teacherResult[1] || 0} teacher course arrays`);
      
      console.log(`✅ Successfully cleaned up all references for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up references for user ${userId}:`, error);
      throw error;
    }
  }
}
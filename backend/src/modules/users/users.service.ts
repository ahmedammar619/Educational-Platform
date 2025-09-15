import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
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

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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

    // Hash password if it's being updated
    if (updateUserDto.password) {
      const saltRounds = 12;
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
    
    // If the user is a parent, use the parent-specific deletion logic
    if (user.role === Role.Parent) {
      console.log(`🔄 User ${user.firstName} ${user.lastName} is a parent, using parent deletion logic`);
      await this.parentsService.deleteParent(id);
      return { message: 'Parent and all children deleted successfully' };
    }
    
    // For other roles, just delete the user
    await this.userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }
}
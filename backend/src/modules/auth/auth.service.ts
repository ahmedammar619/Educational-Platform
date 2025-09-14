import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../../common/enums/role.enum';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role, ...userData } = registerDto;

    // Validate role - only allow student and parent registration
    if (role !== Role.Student && role !== Role.Parent) {
      throw new BadRequestException('Only students and parents can register through this endpoint');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Validate required fields based on role
    if (role === Role.Parent && !userData.phone) {
      throw new BadRequestException('Phone number is required for parents');
    }
    
    if (role === Role.Student && !userData.birthDate) {
      throw new BadRequestException('Birth date is required for students');
    }

    // Phone number is required for students when signing up publicly
    if (role === Role.Student && !userData.phone) {
      throw new BadRequestException('Phone number is required for students');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userDataToSave: any = {
      ...userData,
      email,
      passwordHash,
      role: role, // Role is already validated as Teacher or Student
    };

    // Convert birthdate string to Date object for students
    if (role === Role.Student && userData.birthDate) {
      userDataToSave.birthDate = new Date(userData.birthDate);
    }

    // Create user with proper role
    const user = new User();
    Object.assign(user, userDataToSave);

    const savedUser = await this.userRepository.save(user);

    // Also create record in the appropriate separate table
    try {
      if (role === Role.Student) {
        await this.studentsService.createStudentFromUser(
          savedUser.id,
          userData.birthDate,
          userData.phone
        );
      } else if (role === Role.Parent) {
        // Create parent record from the saved user
        await this.parentsService.createParentFromUser(savedUser.id);
      }
    } catch (error) {
      // If creating in separate table fails, we should clean up the user
      // For now, just log the error - in production you might want to handle this differently
      console.error('Failed to create record in separate table:', error);
      // Note: The user account is still created in the users table
    }

    // Notify all admins about the new user registration
    try {
      const adminUsers = await this.userRepository.find({
        where: { role: Role.Admin }
      });
      
      if (adminUsers.length > 0) {
        const adminIds = adminUsers.map(admin => admin.id);
        await this.notificationsService.createNewUserJoinedNotification(
          adminIds,
          `${savedUser.firstName} ${savedUser.lastName}`,
          savedUser.role,
          {
            userId: savedUser.id,
            email: savedUser.email
          }
        );
        console.log('✅ New user registration notification sent to admins');
      }
    } catch (error) {
      console.error('❌ Failed to send new user registration notification:', error);
    }

    // Generate JWT token
    const token = this.generateToken(savedUser);

    return {
      message: `${role === Role.Parent ? 'Parent' : 'Student'} account created successfully`,
      user: this.sanitizeUser(savedUser),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with password and include createdAt
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'createdAt'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      token,
    };
  }

  async logout(userId: string) {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    return {
      message: 'Logout successful',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate secure reset token using crypto.randomBytes
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in user entity
    await this.userRepository.update(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    // In production, send email with reset link
    // For now, just return the token (remove this in production)
    return {
      message: 'Password reset email sent',
      resetToken, // Remove this in production
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await this.userRepository.update(user.id, {
      passwordHash: newPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return {
      message: 'Password reset successful',
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'createdAt'],
    });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findById(userId);

    Object.assign(user, updateProfileDto);
    const updatedUser = await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      user: this.sanitizeUser(updatedUser),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    return {
      message: 'Password updated successfully',
    };
  }

  async deactivateAccount(userId: string) {
    // Since we removed isActive, we'll delete the user instead
    await this.userRepository.delete(userId);
    return {
      message: 'Account deleted successfully',
    };
  }

  private generateToken(user: Partial<User>): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload, {
      expiresIn: '24h',
      issuer: 'educational-platform',
      audience: 'educational-platform-users',
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
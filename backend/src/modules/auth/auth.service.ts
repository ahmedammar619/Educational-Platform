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
import { EmailRegisterDto } from './dto/email-register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../../common/enums/role.enum';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
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

    // Hash password (optimized: 10 rounds for better performance while maintaining security)
    const saltRounds = 10;
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
        console.log('✅ Parent record created successfully for user:', savedUser.id);
      }
    } catch (error) {
      // If creating in separate table fails, we should clean up the user
      console.error('❌ Failed to create record in separate table:', error);
      
      // Clean up the user record since the role-specific record creation failed
      try {
        await this.userRepository.remove(savedUser);
        console.log('✅ Cleaned up user record after role-specific creation failure');
      } catch (cleanupError) {
        console.error('❌ Failed to clean up user record:', cleanupError);
      }
      
      // Re-throw the original error to fail the registration
      throw new BadRequestException(`Failed to create ${role.toLowerCase()} account: ${error.message}`);
    }

    // Notify all admins about the new user registration (optimized query)
    try {
      // Only select the ID field for better performance
      const adminUsers = await this.userRepository.find({
        where: { role: Role.Admin },
        select: ['id']
      });
      
      if (adminUsers.length > 0) {
        const adminIds = adminUsers.map(admin => admin.id);
        // Send notification asynchronously to avoid blocking
        this.notificationsService.createNewUserJoinedNotification(
          adminIds,
          `${savedUser.firstName} ${savedUser.lastName}`,
          savedUser.role,
          {
            userId: savedUser.id,
            email: savedUser.email
          }
        ).then(() => {
          console.log('✅ New user registration notification sent to admins');
        }).catch(error => {
          console.error('❌ Failed to send new user registration notification:', error);
        });
      }
    } catch (error) {
      console.error('❌ Failed to send new user registration notification:', error);
    }

    // Send verification email for teachers and parents only
    if (role === Role.Parent) {
      try {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with verification token
        await this.userRepository.update(savedUser.id, {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        });

        // Send verification email asynchronously (non-blocking)
        this.emailService.sendVerificationEmail(
          savedUser.email,
          verificationToken,
          savedUser.firstName
        ).then(() => {
          console.log('✅ Verification email sent to new parent');
        }).catch(error => {
          console.error('❌ Failed to send verification email:', error);
        });
      } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        // Don't fail registration if email sending fails
      }
    } else {
      // For students, mark email as verified by default
      await this.userRepository.update(savedUser.id, {
        emailVerified: true,
      });
      console.log('✅ Student email marked as verified by default');
    }

    // Generate JWT token
    const token = this.generateToken(savedUser);

    return {
      message: `${role === Role.Parent ? 'Parent' : 'Student'} account created successfully.${role === Role.Parent ? ' Please check your email to verify your account.' : ''}`,
      user: this.sanitizeUser(savedUser),
      token,
      emailVerificationRequired: role === Role.Parent, // Only parents need email verification
    };
  }

  async registerWithEmailOnly(emailRegisterDto: EmailRegisterDto) {
    const { email } = emailRegisterDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Create a temporary user with minimal data
    const tempUser = this.userRepository.create({
      email,
      firstName: 'New', // Temporary placeholder
      lastName: 'User', // Temporary placeholder
      role: Role.Parent, // Default to parent role
      emailVerified: false,
      passwordHash: '', // Will be set during profile completion
    });

    const savedUser = await this.userRepository.save(tempUser);

    // Create parent record for email-only registration
    try {
      await this.parentsService.createParentFromUser(savedUser.id);
      console.log('✅ Parent record created successfully for email-only registration:', savedUser.id);
    } catch (error) {
      console.error('❌ Failed to create parent record for email-only registration:', error);
      
      // Clean up the user record since parent creation failed
      try {
        await this.userRepository.remove(savedUser);
        console.log('✅ Cleaned up user record after parent creation failure');
      } catch (cleanupError) {
        console.error('❌ Failed to clean up user record:', cleanupError);
      }
      
      throw new BadRequestException(`Failed to create parent account: ${error.message}`);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification token
    await this.userRepository.update(savedUser.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    // Send verification email asynchronously (non-blocking)
    this.emailService.sendVerificationEmail(
      savedUser.email,
      verificationToken,
      'New User' // Temporary name
    ).then(() => {
      console.log('✅ Email-only registration completed, verification email sent');
    }).catch(error => {
      console.error('❌ Failed to send verification email:', error);
    });

    return {
      message: 'Registration successful. Please check your email to verify your account and complete your profile.',
      user: this.sanitizeUser(savedUser),
      emailVerificationRequired: true,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Try to get user with emailVerified column first
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'emailVerified', 'createdAt'],
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if teacher doesn't have password set (needs to verify email first)
      if (user.role === Role.Teacher && !user.passwordHash) {
        throw new UnauthorizedException('Please check your email and complete the verification process to set up your account');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // For admins, always treat email as verified (skip all verification)
      if (user.role === Role.Admin) {
        user.emailVerified = true;
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        message: 'Login successful',
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      // If emailVerified column doesn't exist, try without it
      if (error.message && error.message.includes('emailVerified')) {
        console.log('⚠️ emailVerified column not found, fetching user without it');
        const user = await this.userRepository.findOne({
          where: { email },
          select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'createdAt'],
        });

        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }

        // Check if teacher doesn't have password set (needs to verify email first)
        if (user.role === Role.Teacher && !user.passwordHash) {
          throw new UnauthorizedException('Please check your email and complete the verification process to set up your account');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }

        // For admins, always treat email as verified (skip all verification)
        if (user.role === Role.Admin) {
          user.emailVerified = true;
        } else {
          // For other roles, assume email is not verified if column doesn't exist
          user.emailVerified = false;
        }

        // Generate JWT token
        const token = this.generateToken(user);

        return {
          message: 'Login successful',
          user: this.sanitizeUser(user),
          token,
        };
      }
      throw error;
    }
  }

  async logout(userId: string) {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    return {
      message: 'Logout successful',
    };
  }


  async getProfile(userId: string) {
    try {
      // Try to get user with emailVerified column first
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'emailVerified', 'createdAt'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // For admins, always treat email as verified (skip all verification)
      if (user.role === Role.Admin) {
        user.emailVerified = true;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      // If emailVerified column doesn't exist, try without it
      if (error.message && error.message.includes('emailVerified')) {
        console.log('⚠️ emailVerified column not found, fetching user without it');
        const user = await this.userRepository.findOne({
          where: { id: userId },
          select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'createdAt'],
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // For admins, always treat email as verified (skip all verification)
        if (user.role === Role.Admin) {
          user.emailVerified = true;
        } else {
          // For other roles, assume email is not verified if column doesn't exist
          user.emailVerified = false;
        }

        return this.sanitizeUser(user);
      }
      throw error;
    }
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
    try {
      // Try to get user with emailVerified column first
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'emailVerified', 'createdAt'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // For admins, always treat email as verified (skip all verification)
      if (user.role === Role.Admin) {
        user.emailVerified = true;
      }

      return user;
    } catch (error) {
      // If emailVerified column doesn't exist, try without it
      if (error.message && error.message.includes('emailVerified')) {
        console.log('⚠️ emailVerified column not found, fetching user without it');
        const user = await this.userRepository.findOne({
          where: { id },
          select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // For admins, always treat email as verified (skip all verification)
        if (user.role === Role.Admin) {
          user.emailVerified = true;
        } else {
          // For other roles, assume email is not verified if column doesn't exist
          user.emailVerified = false;
        }

        return user;
      }
      throw error;
    }
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

    // Hash new password (optimized: 10 rounds for better performance while maintaining security)
    const saltRounds = 10;
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
      emailVerified: user.emailVerified,
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

  // Email verification methods
  async sendVerificationEmail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if emailVerified column exists and user is already verified
    try {
      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified');
      }
    } catch (error) {
      // If emailVerified column doesn't exist, continue with sending verification
      console.log('⚠️ emailVerified column not found, proceeding with sending verification');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification token
    await this.userRepository.update(userId, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    // Send verification email asynchronously (non-blocking)
    this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName
    ).then(() => {
      console.log('✅ Verification email sent successfully');
    }).catch(error => {
      console.error('❌ Failed to send verification email:', error);
    });

    return {
      message: 'Verification email sent successfully',
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Check if emailVerified column exists and user is already verified
    try {
      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified');
      }
    } catch (error) {
      // If emailVerified column doesn't exist, continue with verification
      console.log('⚠️ emailVerified column not found, proceeding with verification');
    }

    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Update user as verified - handle missing emailVerified column
    try {
      await this.userRepository.update(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      });
    } catch (error) {
      // If emailVerified column doesn't exist, just clear the token
      if (error.message && error.message.includes('emailVerified')) {
        console.log('⚠️ emailVerified column not found, clearing verification token only');
        await this.userRepository.update(user.id, {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        });
      } else {
        throw error;
      }
    }

    // Get the updated user from database
    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    // Generate a new JWT token with updated emailVerified status
    const newToken = this.jwtService.sign(
      {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
      },
      {
        expiresIn: '24h',
        issuer: 'educational-platform',
        audience: 'educational-platform-users',
      }
    );

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(updatedUser),
      token: newToken,
    };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if emailVerified column exists and user is already verified
    try {
      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified');
      }
    } catch (error) {
      // If emailVerified column doesn't exist, continue with resending verification
      console.log('⚠️ emailVerified column not found, proceeding with resending verification');
    }

    // Check if we can resend (rate limiting - not too frequent)
    const now = new Date();
    const lastSent = user.lastVerificationEmailSent;
    
    if (lastSent && (now.getTime() - lastSent.getTime()) < 1 * 60 * 1000) { // 1 minute
      const waitTimeMs = 1 * 60 * 1000 - (now.getTime() - lastSent.getTime());
      const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
      throw new BadRequestException(`Please wait ${waitTimeSeconds} seconds before requesting another verification email. Rate limit: 1 email per minute.`);
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new verification token
    await this.userRepository.update(userId, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
      lastVerificationEmailSent: now,
    });

    // Send verification email asynchronously (non-blocking)
    this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName
    ).then(() => {
      console.log('✅ Verification email resent successfully');
    }).catch(error => {
      console.error('❌ Failed to resend verification email:', error);
    });

    return {
      message: 'Verification email resent successfully',
      email: user.email,
    };
  }

  // Send welcome email after profile completion
  async sendWelcomeEmailAfterProfileCompletion(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.firstName,
      user.lastName,
      user.role
    );

    return {
      message: 'Welcome email sent successfully',
      email: user.email,
    };
  }

  // Forgot Password functionality
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // First, validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    // Only allow password reset for teachers and parents
    if (user.role !== Role.Teacher && user.role !== Role.Parent) {
      if (user.role === Role.Student) {
        throw new BadRequestException('Students cannot reset their password directly. Please contact your parent to change your password.');
      } else if (user.role === Role.Admin) {
        throw new BadRequestException('Admin accounts cannot reset password via email. Please change your password directly from the database.');
      } else {
        throw new BadRequestException('Password reset is only available for teachers and parents');
      }
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await this.userRepository.save(user);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName
    );

    return {
      message: 'Password reset link has been sent to your email address',
      email: user.email,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Find user by reset token
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.userRepository.save(user);

    return {
      message: 'Password reset successfully',
    };
  }

  // Student password management for parents
  async getStudentPassword(parentId: string, studentId: string) {
    // Verify parent-child relationship
    const parent = await this.parentsService.findOne(parentId);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Get student details
    const student = await this.studentsService.findOne(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if this student belongs to the parent
    const isChildOfParent = await this.parentsService.isChildOfParent(parentId, studentId);
    if (!isChildOfParent) {
      throw new ForbiddenException('You can only view passwords for your own children');
    }

    // Get user details for the student
    const user = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!user) {
      throw new NotFoundException('Student user not found');
    }

    return {
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      // Note: We don't return the actual password hash for security
      hasPassword: !!user.passwordHash,
    };
  }

  async updateStudentPassword(parentId: string, studentId: string, newPassword: string) {
    // Verify parent-child relationship
    const parent = await this.parentsService.findOne(parentId);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Get student details
    const student = await this.studentsService.findOne(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if this student belongs to the parent
    const isChildOfParent = await this.parentsService.isChildOfParent(parentId, studentId);
    if (!isChildOfParent) {
      throw new ForbiddenException('You can only update passwords for your own children');
    }

    // Get user details for the student
    const user = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!user) {
      throw new NotFoundException('Student user not found');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update student password
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    return {
      message: 'Student password updated successfully',
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
    };
  }
}
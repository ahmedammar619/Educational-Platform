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
import { securityConfig } from '../../config/security.config';

import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Check if username already exists (for students)
    if (userData.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: userData.username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      ...userData,
      email,
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(savedUser);

    return {
      message: 'User created successfully',
      user: this.sanitizeUser(savedUser),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'isActive', 'failedLoginAttempts', 'lockedUntil'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      throw new ForbiddenException(`Account is locked. Try again in ${remainingTime} minutes.`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = null;

      // Lock account if max attempts reached
      if (newFailedAttempts >= securityConfig.lockout.maxFailedAttempts) {
        lockedUntil = new Date(Date.now() + securityConfig.lockout.lockoutDuration);
      }

      await this.userRepository.update(user.id, {
        failedLoginAttempts: newFailedAttempts,
        lockedUntil,
      });

      if (newFailedAttempts >= securityConfig.lockout.maxFailedAttempts) {
        throw new ForbiddenException(`Account locked due to too many failed attempts. Try again in ${Math.ceil(securityConfig.lockout.lockoutDuration / 1000 / 60)} minutes.`);
      }

      const remainingAttempts = securityConfig.lockout.maxFailedAttempts - newFailedAttempts;
      throw new UnauthorizedException(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
    }

    // Reset failed login attempts on successful login
    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      token,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'isActive', 'failedLoginAttempts', 'lockedUntil'],
    });

    if (user && user.isActive) {
      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.findById(userId);

    Object.assign(user, updateProfileDto);
    const updatedUser = await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      user: this.sanitizeUser(updatedUser),
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
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

  async deactivateAccount(userId: number) {
    await this.userRepository.update(userId, { isActive: false });
    return {
      message: 'Account deactivated successfully',
    };
  }

  async unlockAccount(userId: number) {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    return {
      message: 'Account unlocked successfully',
    };
  }

  private generateToken(user: Partial<User>): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (parseInt(securityConfig.jwt.expiresIn) * 60), // Convert minutes to seconds
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || securityConfig.jwt.secret,
      expiresIn: securityConfig.jwt.expiresIn,
      issuer: securityConfig.jwt.issuer,
      audience: securityConfig.jwt.audience,
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, failedLoginAttempts, lockedUntil, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import { TeachersService } from '../teachers/teachers.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly teachersService: TeachersService,
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
    
    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }
}
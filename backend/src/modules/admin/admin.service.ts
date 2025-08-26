import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalTeachers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: Role.Teacher } }),
    ]);

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return {
      totalUsers,
      totalTeachers,
      usersByRole,
      timestamp: new Date().toISOString(),
    };
  }

  async getRecentUsers(limit: number = 10) {
    const recentUsers = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.role', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return {
      users: recentUsers.map(user => ({
        ...user,
        status: 'active'
      }))
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, role } = createUserDto;

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
      ...createUserDto,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return {
      message: 'User created successfully',
      user: userWithoutPassword,
    };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return {
      message: 'User updated successfully',
      user: userWithoutPassword,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10, filters: any = {}) {
    const { role, search } = filters;
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTeachers(page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: Role.Teacher });

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [teachers, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUser(userId: string) {
    await this.userRepository.delete(userId);
    return { message: 'User deleted successfully' };
  }
}
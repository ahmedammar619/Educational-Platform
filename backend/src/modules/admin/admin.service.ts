import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalParents, totalStudents, totalTeachers] = await Promise.all([
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: Role.Parent, isActive: true } }),
      this.userRepository.count({ where: { role: Role.Student, isActive: true } }),
      this.userRepository.count({ where: { role: Role.Teacher, isActive: true } }),
    ]);

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.isActive = :isActive', { isActive: true })
      .groupBy('user.role')
      .getRawMany();

    return {
      totalUsers,
      totalParents,
      totalStudents,
      totalTeachers,
      usersByRole,
      timestamp: new Date().toISOString(),
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10, filters: any = {}) {
    const { role, search } = filters;
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

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

  async getAllStudents(page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: Role.Student })
      .andWhere('user.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.username ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [students, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deactivateUser(userId: number) {
    await this.userRepository.update(userId, { isActive: false });
    return { message: 'User deactivated successfully' };
  }

  async reactivateUser(userId: number) {
    await this.userRepository.update(userId, { isActive: true });
    return { message: 'User reactivated successfully' };
  }

  async unlockUser(userId: number) {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    return { message: 'User account unlocked successfully' };
  }

  async deleteUser(userId: number) {
    await this.userRepository.delete(userId);
    return { message: 'User deleted successfully' };
  }
}
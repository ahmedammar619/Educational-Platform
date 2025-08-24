import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getTeacherProfile(teacherId: string) {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: Role.Teacher },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async updateTeacherProfile(teacherId: string, updateData: Partial<User>) {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: Role.Teacher },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Only allow updating certain fields
    const allowedFields = ['firstName', 'lastName', 'phone'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    await this.userRepository.update(teacherId, filteredData);
    return this.getTeacherProfile(teacherId);
  }

  async getTeacherClasses(teacherId: string) {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: Role.Teacher },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Mock data for now - replace with actual database queries
    return [
      {
        id: 1,
        name: 'Quran Memorization - Juz 1',
        students: 8,
        nextSession: '2025-02-16 16:00',
        progress: 85
      },
      {
        id: 2,
        name: 'Arabic Language Basics',
        students: 12,
        nextSession: '2025-02-17 15:00',
        progress: 78
      }
    ];
  }
}
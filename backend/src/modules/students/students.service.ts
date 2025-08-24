import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getStudentProfile(studentId: string) {
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student },
      select: ['id', 'firstName', 'lastName', 'email', 'username', 'birthDate', 'createdAt'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async updateStudentProfile(studentId: string, updateData: Partial<User>) {
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Only allow updating certain fields
    const allowedFields = ['firstName', 'lastName', 'username'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    await this.userRepository.update(studentId, filteredData);
    return this.getStudentProfile(studentId);
  }

  async getStudentClasses(studentId: string) {
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student },
      select: ['id', 'firstName', 'lastName', 'email', 'username', 'birthDate', 'createdAt'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Mock data for now - replace with actual database queries
    return [
      {
        id: 1,
        name: 'Quran Memorization - Juz 1',
        teacher: 'Sheikh Abdullah Al-Mahmoud',
        progress: 85,
        nextSession: '2025-02-16 16:00'
      },
      {
        id: 2,
        name: 'Arabic Language Basics',
        teacher: 'Ustadha Aisha Al-Zahra',
        progress: 88,
        nextSession: '2025-02-17 15:00'
      }
    ];
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { NotFoundException } from '@nestjs/common';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getTeacherProfile(teacherId: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      id: teacher.id,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      courses: teacher.courses,
      createdAt: teacher.user.createdAt,
    };
  }

  async updateTeacher(teacherId: string, updateData: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Only allow updating courses array
    if (updateData.courses) {
      await this.teacherRepository.update(teacherId, { courses: updateData.courses });
    }

    return this.findOne(teacherId);
  }

  async getTeacherClasses(teacherId: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
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

  async createTeacher(teacherData: { id: string; courses: string[] }) {
    const teacher = this.teacherRepository.create({
      id: teacherData.id,
      courses: teacherData.courses,
    });

    return this.teacherRepository.save(teacher);
  }

  async findAll(): Promise<Teacher[]> {
    return this.teacherRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async deleteTeacher(id: string): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.teacherRepository.remove(teacher);
  }

  // Method to create a teacher record from an existing user
  async createTeacherFromUser(userId: string): Promise<Teacher> {
    // Check if teacher record already exists
    const existingTeacher = await this.teacherRepository.findOne({
      where: { id: userId }
    });

    if (existingTeacher) {
      throw new Error('Teacher record already exists for this user');
    }

    // Create teacher record with the existing user ID
    const teacher = this.teacherRepository.create({
      id: userId,
      courses: [], // Start with empty courses array
    });

    return this.teacherRepository.save(teacher);
  }
}
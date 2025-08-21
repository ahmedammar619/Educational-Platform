import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getTeacherProfile(teacherId: number) {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: Role.Teacher },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'],
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return teacher;
  }

  async updateTeacherProfile(teacherId: number, updateData: Partial<User>) {
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
}
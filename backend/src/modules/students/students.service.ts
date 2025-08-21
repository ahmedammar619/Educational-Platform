import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getStudentProfile(studentId: number) {
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: Role.Student },
      select: ['id', 'firstName', 'lastName', 'username', 'email', 'birthDate', 'createdAt'],
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  async updateStudentProfile(studentId: number, updateData: Partial<User>) {
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
}
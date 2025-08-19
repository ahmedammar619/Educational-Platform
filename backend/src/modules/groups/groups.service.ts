import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupStudent } from './entities/group_student.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupStudent) private readonly groupStudentRepo: Repository<GroupStudent>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // Create a group with initial students
  async createGroup(name: string, teacherId: number, studentIds: number[]): Promise<Group> {
    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (teacher.role !== Role.Teacher) {
      throw new BadRequestException('Assigned instructor must have Teacher role');
    }

    const uniqueStudentIds = Array.from(new Set(studentIds || []));
    if (uniqueStudentIds.length < 5 || uniqueStudentIds.length > 10) {
      throw new BadRequestException('Group must have between 5 and 10 students');
    }

    // Validate students exist and have Student role
    const students = await this.userRepo.find({ where: { id: In(uniqueStudentIds) } });
    if (students.length !== uniqueStudentIds.length) {
      throw new BadRequestException('One or more student IDs are invalid');
    }
    const invalidRole = students.find((u) => u.role !== Role.Student);
    if (invalidRole) {
      throw new BadRequestException('All assigned users must have Student role');
    }

    const group = this.groupRepo.create({ name, teacher });
    await this.groupRepo.save(group);

    await this.assignStudentsToGroup(group.id, uniqueStudentIds);

    return this.groupRepo.findOne({
      where: { id: group.id },
      relations: ['teacher', 'groupStudents', 'groupStudents.student'],
    });
  }

  // Assign students to an existing group
  async assignStudentsToGroup(groupId: number, studentIds: number[]): Promise<GroupStudent[]> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const uniqueStudentIds = Array.from(new Set(studentIds || []));
    if (!uniqueStudentIds.length) {
      throw new BadRequestException('No student IDs provided');
    }

    // Load current memberships for capacity validation
    const existingMemberships = await this.groupStudentRepo.find({
      where: { group: { id: groupId } },
      relations: ['student', 'group'],
    });
    const existingStudentIds = existingMemberships.map((gs) => gs.student.id);

    // Validate students exist, have Student role, and are not duplicates
    const students = await this.userRepo.find({ where: { id: In(uniqueStudentIds) } });
    if (!students.length) throw new NotFoundException('No students found for the given IDs');
    const invalidRole = students.find((u) => u.role !== Role.Student);
    if (invalidRole) {
      throw new BadRequestException('All assigned users must have Student role');
    }

    const filteredNewStudents = students.filter((s) => !existingStudentIds.includes(s.id));
    const resultingCount = existingStudentIds.length + filteredNewStudents.length;
    if (resultingCount > 10) {
      throw new BadRequestException('Group cannot exceed 10 students');
    }

    const newMemberships = filteredNewStudents.map((student) =>
      this.groupStudentRepo.create({ group, student }),
    );

    return this.groupStudentRepo.save(newMemberships);
  }

  async findAll(): Promise<Group[]> {
    return this.groupRepo.find({ relations: ['teacher', 'groupStudents', 'groupStudents.student'] });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['teacher', 'groupStudents', 'groupStudents.student'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }
}

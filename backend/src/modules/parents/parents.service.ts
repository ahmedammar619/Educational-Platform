import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { ParentSignupDto } from './dto/parent-signup.dto';
import { AddChildDto } from './dto/add-child.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import { Attendance } from '../sessions/entities/attendance.entity';
import { Submission } from '../assignments/entities/submission.entity';
import { Assignment } from '../assignments/entities/assignment.entity';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent) private readonly parentRepo: Repository<Parent>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Attendance) private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Assignment) private readonly assignmentRepo: Repository<Assignment>,
    private readonly authService: AuthService,
  ) {}

  // Optional convenience: allow a dedicated signup route for parents
  async signupParent(dto: ParentSignupDto) {
    return this.authService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      role: Role.Parent,   // ✅ changed to Role
    } as any);
  }

  // Parent adds an existing child (student) by ID
  async addChild(parentUserId: number, dto: AddChildDto): Promise<Parent> {
    const parentUser = await this.userRepo.findOne({ where: { id: parentUserId } });
    if (!parentUser || parentUser.role !== Role.Parent) {
      throw new ForbiddenException('Only parents can add children.');
    }

    const childUser = await this.userRepo.findOne({ where: { id: dto.childId } });
    if (!childUser || childUser.role !== Role.Student) {
      throw new NotFoundException('Child student not found.');
    }

    // Prevent duplicate parent-child link
    const existing = await this.parentRepo.findOne({
      where: { parent: { id: parentUserId }, child: { id: childUser.id } },
      relations: ['parent', 'child'],
    });
    if (existing) return existing;

    const record = this.parentRepo.create({
      parent: parentUser,
      child: childUser,
      childAge: dto.childAge,
      paymentInfo: null,
    });

    return this.parentRepo.save(record);
  }

  async updatePayment(parentUserId: number, parentRecordId: number, dto: UpdatePaymentDto): Promise<Parent> {
    const record = await this.parentRepo.findOne({
      where: { id: parentRecordId },
      relations: ['parent', 'child'],
    });

    if (!record) throw new NotFoundException('Parent record not found.');
    if (record.parent.id !== parentUserId) {
      throw new ForbiddenException('You can update only your own payment info.');
    }

    record.paymentInfo = dto.paymentInfo;
    return this.parentRepo.save(record);
  }

  async getMyChildren(parentUserId: number): Promise<Parent[]> {
    return this.parentRepo.find({
      where: { parent: { id: parentUserId } },
      relations: ['child'],
      order: { id: 'ASC' },
    });
  }

  private async assertParentOfChild(parentUserId: number, childId: number) {
    const link = await this.parentRepo.findOne({
      where: { parent: { id: parentUserId }, child: { id: childId } },
      relations: ['parent', 'child'],
    });
    if (!link) {
      throw new ForbiddenException('Not authorized to access this child data');
    }
    return link;
  }

  async getChildAttendance(parentUserId: number, childId: number) {
    await this.assertParentOfChild(parentUserId, childId);

    const records = await this.attendanceRepo.find({
      where: { studentId: childId },
      relations: ['session', 'session.course'],
      order: { createdAt: 'DESC' },
    });

    return { attendance: records };
  }

  async getChildGrades(parentUserId: number, childId: number, filters: { courseId?: number } = {}) {
    await this.assertParentOfChild(parentUserId, childId);

    const { courseId } = filters;
    let qb = this.submissionRepo
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.assignment', 'assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .leftJoinAndSelect('submission.gradedBy', 'grader')
      .where('submission.studentId = :childId', { childId })
      .andWhere('submission.grade IS NOT NULL');

    if (courseId) {
      qb = qb.andWhere('course.id = :courseId', { courseId });
    }

    const grades = await qb.orderBy('submission.gradedAt', 'DESC').getMany();
    return { grades };
  }
}

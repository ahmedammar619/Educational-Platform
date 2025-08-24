import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'birthDate', 'createdAt', 'lastLogin'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'birthDate', 'createdAt', 'lastLogin'],
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
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'birthDate', 'createdAt', 'lastLogin'],
    });
  }

  async getActiveUsers(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      order: { createdAt: 'DESC' },
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

    // Role-based validation
    if (userData.role === Role.Student) {
      if (!userData.birthDate) {
        throw new ConflictException('Birth date is required for students');
      }
      if (userData.phone) {
        throw new ConflictException('Phone number is not allowed for students');
      }
    } else if (userData.role === Role.Teacher || userData.role === Role.Parent) {
      if (!userData.phone) {
        throw new ConflictException('Phone number is required for teachers and parents');
      }
      if (userData.birthDate) {
        throw new ConflictException('Birth date is not allowed for teachers and parents');
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with proper typing
    const userDataToSave = {
      ...userData,
      email,
      passwordHash,
    };

    const user = this.userRepository.create(userDataToSave);
    const savedUser = await this.userRepository.save(user);
    
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
        throw new ConflictException('User already exists with this email');
      }
    }

    // Role-based validation for updates
    const targetRole = updateUserDto.role || user.role;
    
    if (targetRole === Role.Student) {
      if (updateUserDto.phone) {
        throw new ConflictException('Phone number is not allowed for students');
      }
      // If role is being changed to student, ensure birthDate is provided
      if (updateUserDto.role === Role.Student && !updateUserDto.birthDate && !user.birthDate) {
        throw new ConflictException('Birth date is required for students');
      }
    } else if (targetRole === Role.Teacher || targetRole === Role.Parent) {
      if (updateUserDto.birthDate) {
        throw new ConflictException('Birth date is not allowed for teachers and parents');
      }
      // If role is being changed to teacher/parent, ensure phone is provided
      if ((updateUserDto.role === Role.Teacher || updateUserDto.role === Role.Parent) && !updateUserDto.phone && !user.phone) {
        throw new ConflictException('Phone number is required for teachers and parents');
      }
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
    
    // Check if user has related data that would prevent deletion
    const relatedDataInfo = await this.checkUserRelatedData(id);
    
    if (relatedDataInfo.hasRelatedData) {
      const dataTypes = relatedDataInfo.dataTypes.join(', ');
      throw new ConflictException(
        `Cannot delete user. User has related data: ${dataTypes}. ` +
        'Please remove all related data first or consider deactivating the user instead.'
      );
    }
    
    // Delete the user
    await this.userRepository.remove(user);
    
    return { message: 'User deleted successfully' };
  }

  // Helper method to get user relationship details (for debugging)
  async getUserRelationshipDetails(id: string): Promise<{ 
    canBeDeleted: boolean; 
    reasons: string[]; 
    details: any 
  }> {
    const user = await this.findOne(id);
    const relatedDataInfo = await this.checkUserRelatedData(id);
    
    const reasons = [];
    if (!relatedDataInfo.hasRelatedData) {
      reasons.push('No related data found - user can be deleted');
    } else {
      reasons.push(`Has related data: ${relatedDataInfo.dataTypes.join(', ')}`);
    }
    
    // Get specific details about relationships
    const details = await this.getDetailedUserRelationships(id);
    
    return {
      canBeDeleted: !relatedDataInfo.hasRelatedData,
      reasons,
      details
    };
  }

  private async getDetailedUserRelationships(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'children',
        'parents',
        'taughtCourses',
        'enrollments',
        'attendances',
        'authoredMaterials',
        'uploadedFiles',
        'createdFolders'
      ]
    });

    if (!user) return null;

    return {
      children: user.children?.length || 0,
      parents: user.parents?.length || 0,
      taughtCourses: user.taughtCourses?.length || 0,
      enrollments: user.enrollments?.length || 0,
      attendances: user.attendances?.length || 0,
      authoredMaterials: user.authoredMaterials?.length || 0,
      uploadedFiles: user.uploadedFiles?.length || 0,
      createdFolders: user.createdFolders?.length || 0
    };
  }

  private async checkUserRelatedData(userId: string): Promise<{ hasRelatedData: boolean; dataTypes: string[] }> {
    // Check for various types of related data
    const [
      taughtCourses,
      enrollments,
      attendances,
      authoredMaterials,
      uploadedFiles,
      createdFolders,
      parentRelationships,
      childRelationships
    ] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.taughtCourses', 'course')
        .where('user.id = :userId', { userId })
        .andWhere('course.id IS NOT NULL')
        .getCount(),
      
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.enrollments', 'enrollment')
        .where('user.id = :userId', { userId })
        .andWhere('enrollment.id IS NOT NULL')
        .getCount(),
      
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.attendances', 'attendance')
        .where('user.id = :userId', { userId })
        .andWhere('attendance.id IS NOT NULL')
        .getCount(),
      
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.authoredMaterials', 'material')
        .where('user.id = :userId', { userId })
        .andWhere('material.id IS NOT NULL')
        .getCount(),
      
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.uploadedFiles', 'file')
        .where('user.id = :userId', { userId })
        .andWhere('file.id IS NOT NULL')
        .getCount(),
      
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.createdFolders', 'folder')
        .where('user.id = :userId', { userId })
        .andWhere('folder.id IS NOT NULL')
        .getCount(),

      // Check parent relationships (if this user is a parent)
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.children', 'parentRelation')
        .where('user.id = :userId', { userId })
        .andWhere('parentRelation.id IS NOT NULL')
        .getCount(),

      // Check child relationships (if this user is a child)
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.parents', 'childRelation')
        .where('user.id = :userId', { userId })
        .andWhere('childRelation.id IS NOT NULL')
        .getCount(),
    ]);

    const dataTypes = [];
    if (taughtCourses > 0) dataTypes.push('courses');
    if (enrollments > 0) dataTypes.push('enrollments');
    if (attendances > 0) dataTypes.push('attendance records');
    if (authoredMaterials > 0) dataTypes.push('course materials');
    if (uploadedFiles > 0) dataTypes.push('uploaded files');
    if (createdFolders > 0) dataTypes.push('created folders');
    if (parentRelationships > 0) dataTypes.push('children relationships');
    if (childRelationships > 0) dataTypes.push('parent relationships');

    return {
      hasRelatedData: dataTypes.length > 0,
      dataTypes
    };
  }
}
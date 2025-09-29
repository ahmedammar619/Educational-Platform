import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { Class } from '../classes/entities/class.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createProgramDto: CreateProgramDto): Promise<Program> {
    const program = this.programRepository.create(createProgramDto);
    return await this.programRepository.save(program);
  }

  async findAll(): Promise<Program[]> {
    return await this.programRepository.find({
      relations: ['classes'],
    });
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['classes', 'classes.courses'],
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    return program;
  }

  async update(id: string, updateProgramDto: UpdateProgramDto): Promise<Program> {
    const program = await this.findOne(id);
    
    // Update class relationships if classIds are provided
    if (updateProgramDto.classIds) {
      const classes = await this.classRepository.findByIds(updateProgramDto.classIds);
      if (classes.length !== updateProgramDto.classIds.length) {
        throw new BadRequestException('One or more classes not found');
      }
      
      // Update classes to reference this program
      for (const classEntity of classes) {
        classEntity.programId = id;
        await this.classRepository.save(classEntity);
      }
    }

    Object.assign(program, updateProgramDto);
    return await this.programRepository.save(program);
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    
    // Remove program reference from all classes
    const classes = await this.classRepository.find({ where: { programId: id } });
    for (const classEntity of classes) {
      classEntity.programId = null;
      await this.classRepository.save(classEntity);
    }

    await this.programRepository.remove(program);
  }

  async enrollStudents(id: string, enrollStudentsDto: EnrollStudentsDto): Promise<Program> {
    const program = await this.findOne(id);
    
    // Add new students to the program
    const existingStudentIds = new Set(program.studentIds);
    const newStudentIds = enrollStudentsDto.studentIds.filter(
      studentId => !existingStudentIds.has(studentId)
    );
    
    program.studentIds = [...program.studentIds, ...newStudentIds];
    
    // Enroll students in all classes of the program
    if (program.classIds.length > 0) {
      const classes = await this.classRepository.findByIds(program.classIds);
      for (const classEntity of classes) {
        // This would need to be implemented based on how course enrollment works
        // For now, we'll just update the program
      }
    }

    return await this.programRepository.save(program);
  }

  async removeStudent(id: string, studentId: string): Promise<Program> {
    const program = await this.findOne(id);
    
    program.studentIds = program.studentIds.filter(id => id !== studentId);
    
    // Remove student from all classes of the program
    if (program.classIds.length > 0) {
      const classes = await this.classRepository.findByIds(program.classIds);
      for (const classEntity of classes) {
        // This would need to be implemented based on how course enrollment works
        // For now, we'll just update the program
      }
    }

    return await this.programRepository.save(program);
  }
}

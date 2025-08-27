import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostAttachment } from './entities/post-attachment.entity';
import { Folder } from './entities/folder.entity';
import { File } from './entities/file.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Attendance } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/posts/create-post.dto';
import { UpdatePostDto } from './dto/posts/update-post.dto';
import { CreateFolderDto } from './dto/files/create-folder.dto';
import { CreateAssignmentDto } from './dto/assignments/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/assignments/update-assignment.dto';
import { GradeAssignmentDto } from './dto/assignments/grade-assignment.dto';
import { MarkAttendanceDto } from './dto/attendance/mark-attendance.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostAttachment)
    private readonly postAttachmentRepository: Repository<PostAttachment>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Posts
  async createPost(courseId: string, createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const post = this.postRepository.create({
      ...createPostDto,
      courseId,
      authorId
    });

    return await this.postRepository.save(post);
  }

  async getCoursePosts(courseId: string): Promise<Post[]> {
    return await this.postRepository.find({
      where: { courseId },
      relations: ['author', 'attachments'],
      order: { createdAt: 'DESC' }
    });
  }

  async updatePost(postId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    Object.assign(post, updatePostDto);
    return await this.postRepository.save(post);
  }

  async deletePost(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    await this.postRepository.remove(post);
  }

  // Files and Folders
  async createFolder(courseId: string, createFolderDto: CreateFolderDto, userId: string): Promise<Folder> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if parent folder exists and belongs to the same course
    if (createFolderDto.parentFolderId) {
      const parentFolder = await this.folderRepository.findOne({
        where: { id: createFolderDto.parentFolderId, courseId }
      });
      if (!parentFolder) {
        throw new BadRequestException('Parent folder not found or does not belong to this course');
      }
    }

    const folder = this.folderRepository.create({
      ...createFolderDto,
      courseId,
      createdBy: userId
    });

    return await this.folderRepository.save(folder);
  }

  async uploadFile(courseId: string, file: Express.Multer.File, folderId?: string, userId?: string): Promise<File> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if folder exists and belongs to the same course
    if (folderId) {
      const folder = await this.folderRepository.findOne({
        where: { id: folderId, courseId }
      });
      if (!folder) {
        throw new BadRequestException('Folder not found or does not belong to this course');
      }
    }

    const fileEntity = this.fileRepository.create({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      courseId,
      folderId,
      uploadedBy: userId
    });

    return await this.fileRepository.save(fileEntity);
  }

  async getCourseFiles(courseId: string, folderId?: string): Promise<File[]> {
    const whereCondition: any = { courseId };
    if (folderId) {
      whereCondition.folderId = folderId;
    }

    return await this.fileRepository.find({
      where: whereCondition,
      relations: ['uploader', 'folder'],
      order: { uploadedAt: 'DESC' }
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    await this.fileRepository.remove(file);
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['files', 'subFolders']
    });
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`);
    }

    // Check if folder has files or subfolders
    if (folder.files && folder.files.length > 0) {
      throw new BadRequestException('Cannot delete folder with files. Please delete all files first.');
    }

    if (folder.subFolders && folder.subFolders.length > 0) {
      throw new BadRequestException('Cannot delete folder with subfolders. Please delete all subfolders first.');
    }

    await this.folderRepository.remove(folder);
  }

  // Assignments
  async createAssignment(courseId: string, createAssignmentDto: CreateAssignmentDto, userId: string): Promise<Assignment> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const assignment = this.assignmentRepository.create({
      ...createAssignmentDto,
      courseId,
      createdBy: userId
    });

    return await this.assignmentRepository.save(assignment);
  }

  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { courseId },
      relations: ['creator', 'submissions'],
      order: { dueDate: 'ASC' }
    });
  }

  async submitAssignment(assignmentId: string, file: Express.Multer.File, studentId: string): Promise<AssignmentSubmission> {
    const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Check if student is already submitted
    const existingSubmission = await this.assignmentSubmissionRepository.findOne({
      where: { assignmentId, studentId }
    });

    if (existingSubmission) {
      throw new BadRequestException('Assignment already submitted');
    }

    const submission = this.assignmentSubmissionRepository.create({
      assignmentId,
      studentId,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    return await this.assignmentSubmissionRepository.save(submission);
  }

  async gradeAssignment(submissionId: string, gradeDto: GradeAssignmentDto, graderId: string): Promise<AssignmentSubmission> {
    const submission = await this.assignmentSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment']
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    submission.grade = gradeDto.grade;
    submission.feedback = gradeDto.feedback;
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();

    return await this.assignmentSubmissionRepository.save(submission);
  }

  // Attendance
  async markAttendance(courseId: string, attendanceDto: MarkAttendanceDto, markerId: string): Promise<Attendance> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        courseId,
        studentId: attendanceDto.studentId,
        date: new Date(attendanceDto.date)
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = attendanceDto.status;
      existingAttendance.notes = attendanceDto.notes;
      existingAttendance.markedBy = markerId;
      existingAttendance.markedAt = new Date();
      return await this.attendanceRepository.save(existingAttendance);
    }

    const attendance = this.attendanceRepository.create({
      ...attendanceDto,
      courseId,
      markedBy: markerId,
      date: new Date(attendanceDto.date)
    });

    return await this.attendanceRepository.save(attendance);
  }

  async getCourseAttendance(courseId: string, date?: string): Promise<Attendance[]> {
    const whereCondition: any = { courseId };
    if (date) {
      whereCondition.date = new Date(date);
    }

    return await this.attendanceRepository.find({
      where: whereCondition,
      relations: ['student', 'marker'],
      order: { date: 'DESC' }
    });
  }

  async getStudentAttendance(courseId: string, studentId: string): Promise<Attendance[]> {
    return await this.attendanceRepository.find({
      where: { courseId, studentId },
      relations: ['marker'],
      order: { date: 'DESC' }
    });
  }
}

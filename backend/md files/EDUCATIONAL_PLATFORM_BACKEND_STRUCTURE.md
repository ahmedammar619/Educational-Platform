# Educational Platform Backend Structure

## Overview
This document outlines the complete backend structure for the Educational Platform, including database design, module organization, entities, DTOs, services, and controllers.

## Database Schema

### Core Tables

#### 1. Classes Table
```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Courses Table
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Course Sessions Table
```sql
CREATE TABLE course_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL, -- 'Sunday', 'Monday', etc.
    start_time VARCHAR(5) NOT NULL, -- '10:00', '14:30', etc.
    end_time VARCHAR(5) NOT NULL, -- '11:30', '15:30', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Class Students Table (Many-to-Many)
```sql
CREATE TABLE class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);
```

#### 5. Posts Table
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Post Attachments Table
```sql
CREATE TABLE post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Folders Table
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. Files Table
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. Assignments Table
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    due_time TIME NOT NULL,
    marks INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. Assignment Submissions Table
```sql
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    graded_at TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);
```

#### 11. Attendance Table
```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(course_id, student_id, date)
);
```

## Backend Module Structure

### 1. Classes Module
```
src/modules/classes/
├── classes.module.ts
├── classes.controller.ts
├── classes.service.ts
├── entities/
│   └── class.entity.ts
└── dto/
    ├── create-class.dto.ts
    ├── update-class.dto.ts
    ├── enroll-students.dto.ts
    └── class-response.dto.ts
```

### 2. Courses Module
```
src/modules/courses/
├── courses.module.ts
├── courses.controller.ts
├── courses.service.ts
├── entities/
│   ├── course.entity.ts
│   └── course-session.entity.ts
└── dto/
    ├── create-course.dto.ts
    ├── update-course.dto.ts
    ├── create-session.dto.ts
    └── course-response.dto.ts
```

### 3. Materials Module
```
src/modules/materials/
├── materials.module.ts
├── materials.controller.ts
├── materials.service.ts
├── entities/
│   ├── post.entity.ts
│   ├── post-attachment.entity.ts
│   ├── folder.entity.ts
│   ├── file.entity.ts
│   ├── assignment.entity.ts
│   ├── assignment-submission.entity.ts
│   └── attendance.entity.ts
└── dto/
    ├── posts/
    │   ├── create-post.dto.ts
    │   ├── update-post.dto.ts
    │   └── post-response.dto.ts
    ├── files/
    │   ├── create-folder.dto.ts
    │   ├── upload-file.dto.ts
    │   └── file-response.dto.ts
    ├── assignments/
    │   ├── create-assignment.dto.ts
    │   ├── update-assignment.dto.ts
    │   ├── submit-assignment.dto.ts
    │   ├── grade-assignment.dto.ts
    │   └── assignment-response.dto.ts
    └── attendance/
        ├── mark-attendance.dto.ts
        └── attendance-response.dto.ts
```

## Entity Definitions

### Class Entity
```typescript
@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Course, course => course.class)
  courses: Course[];

  @ManyToMany(() => User, user => user.enrolledClasses)
  @JoinTable({
    name: 'class_students',
    joinColumn: { name: 'class_id' },
    inverseJoinColumn: { name: 'student_id' }
  })
  students: User[];
}
```

### Course Entity
```typescript
@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('uuid')
  teacherId: string;

  @Column('uuid')
  classId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Class, classEntity => classEntity.courses)
  @JoinColumn({ name: 'classId' })
  class: Class;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @OneToMany(() => CourseSession, session => session.course)
  sessions: CourseSession[];

  @OneToMany(() => Post, post => post.course)
  posts: Post[];

  @OneToMany(() => Folder, folder => folder.course)
  folders: Folder[];

  @OneToMany(() => File, file => file.course)
  files: File[];

  @OneToMany(() => Assignment, assignment => assignment.course)
  assignments: Assignment[];

  @OneToMany(() => Attendance, attendance => attendance.course)
  attendance: Attendance[];
}
```

### Course Session Entity
```typescript
@Entity('course_sessions')
export class CourseSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column({ length: 20 })
  day: string;

  @Column({ length: 5 })
  startTime: string;

  @Column({ length: 5 })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Course, course => course.sessions)
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
```

### Post Entity
```typescript
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid')
  authorId: string;

  @Column({ length: 255 })
  subject: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Course, course => course.posts)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => PostAttachment, attachment => attachment.post)
  attachments: PostAttachment[];
}
```

### Post Attachment Entity
```typescript
@Entity('post_attachments')
export class PostAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relationships
  @ManyToOne(() => Post, post => post.attachments)
  @JoinColumn({ name: 'postId' })
  post: Post;
}
```

### Folder Entity
```typescript
@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid', { nullable: true })
  parentFolderId: string;

  @Column({ length: 255 })
  name: string;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Course, course => course.folders)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => Folder, folder => folder.subFolders, { nullable: true })
  @JoinColumn({ name: 'parentFolderId' })
  parentFolder: Folder;

  @OneToMany(() => Folder, folder => folder.parentFolder)
  subFolders: Folder[];

  @OneToMany(() => File, file => file.folder)
  files: File[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
```

### File Entity
```typescript
@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid', { nullable: true })
  folderId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @Column('uuid')
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relationships
  @ManyToOne(() => Course, course => course.files)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => Folder, folder => folder.files, { nullable: true })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User;
}
```

### Assignment Entity
```typescript
@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid')
  createdBy: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'time' })
  dueTime: string;

  @Column('int')
  marks: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Course, course => course.assignments)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => AssignmentSubmission, submission => submission.assignment)
  submissions: AssignmentSubmission[];
}
```

### Assignment Submission Entity
```typescript
@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  assignmentId: string;

  @Column('uuid')
  studentId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column('int', { nullable: true })
  grade: number;

  @Column('text', { nullable: true })
  feedback: string;

  @Column('uuid', { nullable: true })
  gradedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  // Relationships
  @ManyToOne(() => Assignment, assignment => assignment.submissions)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'gradedBy' })
  grader: User;
}
```

### Attendance Entity
```typescript
@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid')
  studentId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late'],
    default: 'absent'
  })
  status: 'present' | 'absent' | 'late';

  @Column('uuid')
  markedBy: string;

  @CreateDateColumn()
  markedAt: Date;

  @Column('text', { nullable: true })
  notes: string;

  // Relationships
  @ManyToOne(() => Course, course => course.attendance)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'markedBy' })
  marker: User;
}
```

## DTO Definitions

### Create Class DTO
```typescript
export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### Create Course DTO
```typescript
export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsUUID()
  teacherId: string;

  @IsUUID()
  classId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionDto)
  sessions: CreateSessionDto[];
}

export class CreateSessionDto {
  @IsString()
  @IsIn(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
  day: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string; // Format: '10:00', '14:30', etc.

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string; // Format: '11:30', '15:30', etc.
}
```

### Create Post DTO
```typescript
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentFileNames?: string[];
}
```

### Create Assignment DTO
```typescript
export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  dueTime: string; // Format: '23:59', '14:30', etc.

  @IsNumber()
  @Min(1)
  marks: number;
}
```

### Mark Attendance DTO
```typescript
export class MarkAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsDateString()
  date: string;

  @IsEnum(['present', 'absent', 'late'])
  status: 'present' | 'absent' | 'late';

  @IsOptional()
  @IsString()
  notes?: string;
}
```

## Service Methods

### Classes Service
```typescript
@Injectable()
export class ClassesService {
  // Class management
  async createClass(createClassDto: CreateClassDto): Promise<Class>
  async findAllClasses(): Promise<Class[]>
  async findClassById(id: string): Promise<Class>
  async updateClass(id: string, updateClassDto: UpdateClassDto): Promise<Class>
  async deleteClass(id: string): Promise<void>
  
  // Student enrollment
  async enrollStudents(classId: string, studentIds: string[]): Promise<void>
  async removeStudentFromClass(classId: string, studentId: string): Promise<void>
  async getClassStudents(classId: string): Promise<User[]>
}
```

### Courses Service
```typescript
@Injectable()
export class CoursesService {
  // Course management
  async createCourse(createCourseDto: CreateCourseDto): Promise<Course>
  async findAllCourses(): Promise<Course[]>
  async findCourseById(id: string): Promise<Course>
  async findCoursesByClass(classId: string): Promise<Course[]>
  async updateCourse(id: string, updateCourseDto: UpdateCourseDto): Promise<Course>
  async deleteCourse(id: string): Promise<void>
  
  // Session management
  async addSession(courseId: string, sessionDto: CreateSessionDto): Promise<CourseSession>
  async updateSession(sessionId: string, sessionDto: UpdateSessionDto): Promise<CourseSession>
  async removeSession(sessionId: string): Promise<void>
}
```

### Materials Service
```typescript
@Injectable()
export class MaterialsService {
  // Posts
  async createPost(courseId: string, createPostDto: CreatePostDto, authorId: string): Promise<Post>
  async getCoursePosts(courseId: string): Promise<Post[]>
  async updatePost(postId: string, updatePostDto: UpdatePostDto): Promise<Post>
  async deletePost(postId: string): Promise<void>
  
  // Files and Folders
  async createFolder(courseId: string, createFolderDto: CreateFolderDto, userId: string): Promise<Folder>
  async uploadFile(courseId: string, file: Express.Multer.File, folderId?: string, userId?: string): Promise<File>
  async getCourseFiles(courseId: string, folderId?: string): Promise<File[]>
  async deleteFile(fileId: string): Promise<void>
  async deleteFolder(folderId: string): Promise<void>
  
  // Assignments
  async createAssignment(courseId: string, createAssignmentDto: CreateAssignmentDto, userId: string): Promise<Assignment>
  async getCourseAssignments(courseId: string): Promise<Assignment[]>
  async submitAssignment(assignmentId: string, file: Express.Multer.File, studentId: string): Promise<AssignmentSubmission>
  async gradeAssignment(submissionId: string, gradeDto: GradeAssignmentDto, graderId: string): Promise<AssignmentSubmission>
  
  // Attendance
  async markAttendance(courseId: string, attendanceDto: MarkAttendanceDto, markerId: string): Promise<Attendance>
  async getCourseAttendance(courseId: string, date?: string): Promise<Attendance[]>
  async getStudentAttendance(courseId: string, studentId: string): Promise<Attendance[]>
}
```

## Controller Endpoints

### Classes Controller
```typescript
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  @Post()
  @Roles(Role.Admin)
  async createClass(@Body() createClassDto: CreateClassDto): Promise<ClassResponseDto>

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  async findAllClasses(): Promise<ClassResponseDto[]>

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher)
  async findClassById(@Param('id') id: string): Promise<ClassResponseDto>

  @Put(':id')
  @Roles(Role.Admin)
  async updateClass(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto): Promise<ClassResponseDto>

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteClass(@Param('id') id: string): Promise<void>

  @Post(':id/enroll')
  @Roles(Role.Admin)
  async enrollStudents(@Param('id') classId: string, @Body() enrollDto: EnrollStudentsDto): Promise<void>

  @Delete(':id/students/:studentId')
  @Roles(Role.Admin)
  async removeStudentFromClass(@Param('id') classId: string, @Param('studentId') studentId: string): Promise<void>
}
```

### Courses Controller
```typescript
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  @Post()
  @Roles(Role.Admin)
  async createCourse(@Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto>

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  async findAllCourses(): Promise<CourseResponseDto[]>

  @Get('class/:classId')
  @Roles(Role.Admin, Role.Teacher)
  async findCoursesByClass(@Param('classId') classId: string): Promise<CourseResponseDto[]>

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async findCourseById(@Param('id') id: string): Promise<CourseResponseDto>

  @Put(':id')
  @Roles(Role.Admin)
  async updateCourse(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto): Promise<CourseResponseDto>

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteCourse(@Param('id') id: string): Promise<void>
}
```

### Materials Controller
```typescript
@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  // Posts
  @Post('courses/:courseId/posts')
  @Roles(Role.Admin, Role.Teacher)
  async createPost(@Param('courseId') courseId: string, @Body() createPostDto: CreatePostDto, @Req() req): Promise<PostResponseDto>

  @Get('courses/:courseId/posts')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getCoursePosts(@Param('courseId') courseId: string): Promise<PostResponseDto[]>

  // Files
  @Post('courses/:courseId/folders')
  @Roles(Role.Admin, Role.Teacher)
  async createFolder(@Param('courseId') courseId: string, @Body() createFolderDto: CreateFolderDto, @Req() req): Promise<FolderResponseDto>

  @Post('courses/:courseId/files')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Admin, Role.Teacher)
  async uploadFile(@Param('courseId') courseId: string, @UploadedFile() file: Express.Multer.File, @Body('folderId') folderId?: string, @Req() req?): Promise<FileResponseDto>

  // Assignments
  @Post('courses/:courseId/assignments')
  @Roles(Role.Admin, Role.Teacher)
  async createAssignment(@Param('courseId') courseId: string, @Body() createAssignmentDto: CreateAssignmentDto, @Req() req): Promise<AssignmentResponseDto>

  @Post('assignments/:assignmentId/submit')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.Student)
  async submitAssignment(@Param('assignmentId') assignmentId: string, @UploadedFile() file: Express.Multer.File, @Req() req): Promise<AssignmentSubmissionResponseDto>

  // Attendance
  @Post('courses/:courseId/attendance')
  @Roles(Role.Admin, Role.Teacher)
  async markAttendance(@Param('courseId') courseId: string, @Body() attendanceDto: MarkAttendanceDto, @Req() req): Promise<AttendanceResponseDto>
}
```

## Module Imports and Dependencies

### App Module Updates
```typescript
// Add to app.module.ts imports
import { ClassesModule } from './modules/classes/classes.module';
import { CoursesModule } from './modules/courses/courses.module';
import { MaterialsModule } from './modules/materials/materials.module';

// Add to entities array
import { Class } from './modules/classes/entities/class.entity';
import { Course } from './modules/courses/entities/course.entity';
import { CourseSession } from './modules/courses/entities/course-session.entity';
import { Post } from './modules/materials/entities/post.entity';
import { PostAttachment } from './modules/materials/entities/post-attachment.entity';
import { Folder } from './modules/materials/entities/folder.entity';
import { File } from './modules/materials/entities/file.entity';
import { Assignment } from './modules/materials/entities/assignment.entity';
import { AssignmentSubmission } from './modules/materials/entities/assignment-submission.entity';
import { Attendance } from './modules/materials/entities/attendance.entity';
```

## File Upload Configuration

### Uploads Folder Structure
The uploads folder should be organized in a hierarchical structure for optimal file management and security:

```
uploads/
├── courses/
│   ├── {courseId}/
│   │   ├── posts/
│   │   │   ├── {postId}/
│   │   │   │   ├── attachments/
│   │   │   │   │   ├── {year}/
│   │   │   │   │   │   ├── {month}/
│   │   │   │   │   │   │   ├── {filename}
│   │   │   │   │   │   │   └── thumbnails/
│   │   │   │   │   │   │       └── {filename}
│   │   │   │   │   │   └── {month}/
│   │   │   │   │   └── {year}/
│   │   │   │   └── {postId}/
│   │   │   └── {postId}/
│   │   ├── materials/
│   │   │   ├── folders/
│   │   │   │   ├── {folderId}/
│   │   │   │   │   ├── {year}/
│   │   │   │   │   │   ├── {month}/
│   │   │   │   │   │   │   ├── {filename}
│   │   │   │   │   │   │   └── thumbnails/
│   │   │   │   │   │   │       └── {filename}
│   │   │   │   │   │   └── {month}/
│   │   │   │   │   └── {year}/
│   │   │   │   └── {folderId}/
│   │   │   └── root/
│   │   │       ├── {year}/
│   │   │       │   ├── {month}/
│   │   │       │   │   ├── {filename}
│   │   │       │   │   └── thumbnails/
│   │   │       │   │       └── {filename}
│   │   │       │   └── {month}/
│   │   │       └── {year}/
│   │   ├── assignments/
│   │   │   ├── {assignmentId}/
│   │   │   │   ├── submissions/
│   │   │   │   │   ├── {studentId}/
│   │   │   │   │   │   ├── {year}/
│   │   │   │   │   │   │   ├── {month}/
│   │   │   │   │   │   │   │   ├── {filename}
│   │   │   │   │   │   │   │   └── feedback/
│   │   │   │   │   │   │   │       └── {filename}
│   │   │   │   │   │   │   └── {month}/
│   │   │   │   │   │   └── {year}/
│   │   │   │   │   └── {studentId}/
│   │   │   │   └── {assignmentId}/
│   │   │   └── {assignmentId}/
│   │   └── {courseId}/
│   └── courses/
├── profile-pictures/
│   ├── {userId}/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   ├── {filename}
│   │   │   │   └── thumbnails/
│   │   │   │       ├── small_{filename}
│   │   │   │       ├── medium_{filename}
│   │   │   │       └── large_{filename}
│   │   │   └── {month}/
│   │   └── {year}/
│   └── {userId}/
├── temp/
│   ├── {sessionId}/
│   │   ├── {filename}
│   │   └── {sessionId}/
│   └── temp/
├── backups/
│   ├── {year}/
│   │   ├── {month}/
│   │   │   ├── {day}/
│   │   │   │   ├── course_{courseId}_{timestamp}.zip
│   │   │   │   └── {day}/
│   │   │   └── {month}/
│   │   └── {year}/
│   └── backups/
└── logs/
    ├── uploads/
    │   ├── {year}/
    │   │   ├── {month}/
    │   │   │   ├── upload_{date}.log
    │   │   │   └── {month}/
    │   │   └── {year}/
    │   └── uploads/
    └── logs/
```

### File Naming Convention
```
{originalName}_{timestamp}_{randomString}.{extension}
Example: calculus_notes_1709123456789_a1b2c3d4.pdf
```

### Multer Configuration with Enhanced Structure
```typescript
// In materials.module.ts
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const createUploadPath = (req: any, file: Express.Multer.File) => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  let basePath = './uploads';
  
  // Determine upload type and create appropriate path
  if (req.route?.path?.includes('posts')) {
    basePath = join(basePath, 'courses', req.params.courseId, 'posts', req.params.postId || 'temp', 'attachments');
  } else if (req.route?.path?.includes('assignments')) {
    if (req.route?.path?.includes('submit')) {
      basePath = join(basePath, 'courses', req.params.courseId, 'assignments', req.params.assignmentId, 'submissions', req.user.id);
    } else {
      basePath = join(basePath, 'courses', req.params.courseId, 'assignments', req.params.assignmentId);
    }
  } else if (req.route?.path?.includes('profile')) {
    basePath = join(basePath, 'profile-pictures', req.user.id);
  } else if (req.route?.path?.includes('materials')) {
    if (req.body.folderId) {
      basePath = join(basePath, 'courses', req.params.courseId, 'materials', 'folders', req.body.folderId);
    } else {
      basePath = join(basePath, 'courses', req.params.courseId, 'materials', 'root');
    }
  } else {
    basePath = join(basePath, 'temp', req.sessionID || 'temp');
  }
  
  const fullPath = join(basePath, year, month);
  
  // Create directory if it doesn't exist
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
  
  return fullPath;
};

MulterModule.register({
  storage: diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = createUploadPath(req, file);
      callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const extension = extname(file.originalname);
      const nameWithoutExt = originalName.replace(extension, '');
      
      const filename = `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Define allowed file types by upload context
    const allowedMimeTypes = {
      posts: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      assignments: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      materials: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      profile: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    };
    
    let context = 'materials'; // default
    if (req.route?.path?.includes('posts')) context = 'posts';
    else if (req.route?.path?.includes('assignments')) context = 'assignments';
    else if (req.route?.path?.includes('profile')) context = 'profile';
    
    if (allowedMimeTypes[context].includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`File type ${file.mimetype} not allowed for ${context} uploads`), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files per request
  },
})
```

### File Management Service
```typescript
// file-management.service.ts
@Injectable()
export class FileManagementService {
  async createThumbnail(filePath: string, sizes: string[] = ['small', 'medium', 'large']): Promise<string[]> {
    // Implementation for creating thumbnails
    // Returns array of thumbnail paths
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    // Implementation for moving files between directories
  }

  async deleteFile(filePath: string): Promise<void> {
    // Implementation for safe file deletion
  }

  async createBackup(courseId: string): Promise<string> {
    // Implementation for creating course backups
  }

  async cleanupTempFiles(): Promise<void> {
    // Implementation for cleaning up temporary files
  }

  async getFileStats(filePath: string): Promise<FileStats> {
    // Implementation for getting file statistics
  }
}
```

### Security Considerations for File Uploads
1. **File Type Validation**: Strict MIME type checking
2. **File Size Limits**: Different limits for different file types
3. **Virus Scanning**: Integration with antivirus software
4. **Path Traversal Protection**: Prevent directory traversal attacks
5. **Access Control**: Role-based file access permissions
6. **Audit Logging**: Track all file operations
7. **Backup Strategy**: Regular automated backups
8. **Cleanup Policies**: Automatic cleanup of temporary and orphaned files

## Security Considerations

1. **File Upload Security**: Implement file type validation, virus scanning, and secure file storage
2. **Access Control**: Use role-based guards for all endpoints
3. **Data Validation**: Comprehensive DTO validation for all inputs
4. **Audit Logging**: Track all administrative actions
5. **Rate Limiting**: Implement rate limiting for file uploads and API calls

## Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_classes_start_date ON classes(start_date);
CREATE INDEX idx_courses_class_id ON courses(class_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX idx_class_students_class_id ON class_students(class_id);
CREATE INDEX idx_class_students_student_id ON class_students(student_id);
CREATE INDEX idx_posts_course_id ON posts(course_id);
CREATE INDEX idx_files_course_id ON files(course_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_attendance_course_date ON attendance(course_id, date);
CREATE INDEX idx_attendance_student_course ON attendance(student_id, course_id);
```

This structure provides a comprehensive foundation for your educational platform with proper separation of concerns, security, and scalability considerations.

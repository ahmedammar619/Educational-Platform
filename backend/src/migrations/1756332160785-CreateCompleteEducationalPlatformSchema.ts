import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompleteEducationalPlatformSchema1756332160785 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop all existing tables in the correct order (respecting foreign key constraints)
        console.log('Dropping existing tables...');
        
        // Drop tables that have foreign keys first
        await queryRunner.query(`DROP TABLE IF EXISTS "session_attendance" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "session_materials" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "material_attachments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "folder_files" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "file_folders" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_files" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_folders" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_materials" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_schedules" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_enrollments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_sessions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_students" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "courses" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "parents" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "students" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "teachers" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

        console.log('Creating new schema...');

        // Create users table (base table for all user types)
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "email" character varying(255) NOT NULL,
                "passwordHash" character varying(255) NOT NULL,
                "firstName" character varying(255) NOT NULL,
                "lastName" character varying(255) NOT NULL,
                "phone" character varying(20),
                "role" character varying(20) NOT NULL DEFAULT 'teacher',
                "resetToken" character varying(255),
                "resetTokenExpiry" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

        // Create students table
        await queryRunner.query(`
            CREATE TABLE "students" (
                "id" uuid NOT NULL,
                "birthDate" date NOT NULL,
                "parentId" uuid,
                CONSTRAINT "PK_students_id" PRIMARY KEY ("id")
            )
        `);

        // Create teachers table
        await queryRunner.query(`
            CREATE TABLE "teachers" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courses" text[] DEFAULT '{}',
                CONSTRAINT "PK_teachers_id" PRIMARY KEY ("id")
            )
        `);

        // Create parents table
        await queryRunner.query(`
            CREATE TABLE "parents" (
                "id" uuid NOT NULL,
                "studentIds" text[] DEFAULT '{}',
                CONSTRAINT "PK_parents_id" PRIMARY KEY ("id")
            )
        `);

        // Create classes table
        await queryRunner.query(`
            CREATE TABLE "classes" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" character varying(255) NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "description" text,
                "maxStudents" integer DEFAULT 30,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_classes_id" PRIMARY KEY ("id")
            )
        `);

        // Create courses table
        await queryRunner.query(`
            CREATE TABLE "courses" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "teacherId" uuid NOT NULL,
                "classId" uuid NOT NULL,
                "subject" character varying(100),
                "level" character varying(50),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_courses_id" PRIMARY KEY ("id")
            )
        `);

        // Create course_sessions table
        await queryRunner.query(`
            CREATE TABLE "course_sessions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courseId" uuid NOT NULL,
                "day" character varying(20) NOT NULL,
                "startTime" character varying(5) NOT NULL,
                "endTime" character varying(5) NOT NULL,
                "room" character varying(50),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_course_sessions_id" PRIMARY KEY ("id")
            )
        `);

        // Create class_students table (many-to-many)
        await queryRunner.query(`
            CREATE TABLE "class_students" (
                "class_id" uuid NOT NULL,
                "student_id" uuid NOT NULL,
                CONSTRAINT "PK_class_students" PRIMARY KEY ("class_id", "student_id")
            )
        `);

        // Create posts table
        await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courseId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "subject" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "type" character varying(20) NOT NULL DEFAULT 'announcement',
                "isPinned" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_posts_id" PRIMARY KEY ("id")
            )
        `);

        // Create post_attachments table
        await queryRunner.query(`
            CREATE TABLE "post_attachments" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "postId" uuid NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "filePath" character varying(500) NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying(100) NOT NULL,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_post_attachments_id" PRIMARY KEY ("id")
            )
        `);

        // Create folders table
        await queryRunner.query(`
            CREATE TABLE "folders" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courseId" uuid NOT NULL,
                "parentFolderId" uuid,
                "name" character varying(255) NOT NULL,
                "description" text,
                "createdBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_folders_id" PRIMARY KEY ("id")
            )
        `);

        // Create files table
        await queryRunner.query(`
            CREATE TABLE "files" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courseId" uuid NOT NULL,
                "folderId" uuid,
                "fileName" character varying(255) NOT NULL,
                "filePath" character varying(500) NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying(100) NOT NULL,
                "uploadedBy" uuid NOT NULL,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isPublic" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_files_id" PRIMARY KEY ("id")
            )
        `);

        // Create assignments table
        await queryRunner.query(`
            CREATE TABLE "assignments" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courseId" uuid NOT NULL,
                "createdBy" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "dueDate" date NOT NULL,
                "dueTime" time NOT NULL,
                "marks" integer NOT NULL,
                "type" character varying(50) NOT NULL DEFAULT 'homework',
                "isPublished" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_assignments_id" PRIMARY KEY ("id")
            )
        `);

        // Create assignment_submissions table
        await queryRunner.query(`
            CREATE TABLE "assignment_submissions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "assignmentId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "filePath" character varying(500) NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying(100) NOT NULL,
                "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "grade" integer,
                "feedback" text,
                "gradedBy" uuid,
                "gradedAt" TIMESTAMP,
                "status" character varying(20) NOT NULL DEFAULT 'submitted',
                CONSTRAINT "PK_assignment_submissions_id" PRIMARY KEY ("id")
            )
        `);

        // Create attendance table
        await queryRunner.query(`
            CREATE TABLE "attendance" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "courseId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "date" date NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'absent',
                "markedBy" uuid NOT NULL,
                "markedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "notes" text,
                CONSTRAINT "PK_attendance_id" PRIMARY KEY ("id")
            )
        `);

        console.log('Adding foreign key constraints...');

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "students" 
            ADD CONSTRAINT "FK_students_id" 
            FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "students" 
            ADD CONSTRAINT "FK_students_parentId" 
            FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "teachers" 
            ADD CONSTRAINT "FK_teachers_id" 
            FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "parents" 
            ADD CONSTRAINT "FK_parents_id" 
            FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "courses" 
            ADD CONSTRAINT "FK_courses_teacherId" 
            FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "courses" 
            ADD CONSTRAINT "FK_courses_classId" 
            FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "course_sessions" 
            ADD CONSTRAINT "FK_course_sessions_courseId" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "class_students" 
            ADD CONSTRAINT "FK_class_students_class_id" 
            FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "class_students" 
            ADD CONSTRAINT "FK_class_students_student_id" 
            FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "posts" 
            ADD CONSTRAINT "FK_posts_courseId" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "posts" 
            ADD CONSTRAINT "FK_posts_authorId" 
            FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "post_attachments" 
            ADD CONSTRAINT "FK_post_attachments_postId" 
            FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "folders" 
            ADD CONSTRAINT "FK_folders_courseId" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "folders" 
            ADD CONSTRAINT "FK_folders_parentFolderId" 
            FOREIGN KEY ("parentFolderId") REFERENCES "folders"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "folders" 
            ADD CONSTRAINT "FK_folders_createdBy" 
            FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "files" 
            ADD CONSTRAINT "FK_files_courseId" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "files" 
            ADD CONSTRAINT "FK_files_folderId" 
            FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "files" 
            ADD CONSTRAINT "FK_files_uploadedBy" 
            FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assignments" 
            ADD CONSTRAINT "FK_assignments_courseId" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assignments" 
            ADD CONSTRAINT "FK_assignments_createdBy" 
            FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assignment_submissions" 
            ADD CONSTRAINT "FK_assignment_submissions_assignmentId" 
            FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assignment_submissions" 
            ADD CONSTRAINT "FK_assignment_submissions_studentId" 
            FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assignment_submissions" 
            ADD CONSTRAINT "FK_assignment_submissions_gradedBy" 
            FOREIGN KEY ("gradedBy") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "attendance" 
            ADD CONSTRAINT "FK_attendance_courseId" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "attendance" 
            ADD CONSTRAINT "FK_attendance_studentId" 
            FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "attendance" 
            ADD CONSTRAINT "FK_attendance_markedBy" 
            FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        console.log('Adding unique constraints...');

        // Add unique constraints
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "UQ_users_email" 
            UNIQUE ("email")
        `);

        await queryRunner.query(`
            ALTER TABLE "class_students" 
            ADD CONSTRAINT "UQ_class_students_class_student" 
            UNIQUE ("class_id", "student_id")
        `);

        await queryRunner.query(`
            ALTER TABLE "assignment_submissions" 
            ADD CONSTRAINT "UQ_assignment_submissions_assignment_student" 
            UNIQUE ("assignmentId", "studentId")
        `);

        await queryRunner.query(`
            ALTER TABLE "attendance" 
            ADD CONSTRAINT "UQ_attendance_course_student_date" 
            UNIQUE ("courseId", "studentId", "date")
        `);

        console.log('Adding check constraints...');

        // Add check constraints
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "CHK_users_role" 
            CHECK ("role" IN ('admin', 'teacher', 'student', 'parent'))
        `);

        await queryRunner.query(`
            ALTER TABLE "attendance" 
            ADD CONSTRAINT "CHK_attendance_status" 
            CHECK ("status" IN ('present', 'absent', 'late', 'excused'))
        `);



        await queryRunner.query(`
            ALTER TABLE "assignment_submissions" 
            ADD CONSTRAINT "CHK_assignment_submissions_status" 
            CHECK ("status" IN ('submitted', 'graded', 'returned'))
        `);

        console.log('Creating indexes...');

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);

        await queryRunner.query(`CREATE INDEX "IDX_classes_start_date" ON "classes" ("startDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_courses_classId" ON "courses" ("classId")`);
        await queryRunner.query(`CREATE INDEX "IDX_courses_teacherId" ON "courses" ("teacherId")`);
        await queryRunner.query(`CREATE INDEX "IDX_course_sessions_courseId" ON "course_sessions" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_class_students_class_id" ON "class_students" ("class_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_class_students_student_id" ON "class_students" ("student_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_courseId" ON "posts" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_authorId" ON "posts" ("authorId")`);
        await queryRunner.query(`CREATE INDEX "IDX_files_courseId" ON "files" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_files_folderId" ON "files" ("folderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_assignments_courseId" ON "assignments" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_attendance_course_date" ON "attendance" ("courseId", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_attendance_student_course" ON "attendance" ("studentId", "courseId")`);

        console.log('Schema creation completed successfully!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Dropping all tables...');
        
        // Drop all tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "attendance" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "assignment_submissions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "assignments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "files" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "folders" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "post_attachments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "posts" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "class_students" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "course_sessions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "courses" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "classes" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "parents" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "teachers" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "students" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
        
        console.log('All tables dropped successfully!');
    }

}

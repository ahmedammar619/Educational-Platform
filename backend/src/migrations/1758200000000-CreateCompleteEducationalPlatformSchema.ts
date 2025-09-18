import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompleteEducationalPlatformSchema1758200000000 implements MigrationInterface {
    name = 'CreateCompleteEducationalPlatformSchema1758200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM types first
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'teacher', 'parent', 'student')`);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('present', 'absent')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('assignment_published', 'assignment_graded', 'zoom_session_published', 'zoom_session_started', 'new_post', 'added_to_class', 'marked_absent', 'child_absent', 'child_added_to_class', 'assignment_submitted', 'added_to_course', 'new_user_joined', 'announcement_meeting', 'announcement_post')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "firstName" character varying(255) NOT NULL,
                "lastName" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "passwordHash" character varying,
                "phone" character varying(20),
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'teacher',
                "resetToken" character varying(255),
                "resetTokenExpiry" TIMESTAMP,
                "stripe_customer_id" character varying(64),
                "emailVerified" boolean NOT NULL DEFAULT false,
                "emailVerificationToken" character varying(255),
                "emailVerificationExpiry" TIMESTAMP,
                "lastVerificationEmailSent" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create parents table
        await queryRunner.query(`
            CREATE TABLE "parents" (
                "id" uuid NOT NULL,
                "studentIds" text array NOT NULL DEFAULT '{}',
                CONSTRAINT "PK_parents" PRIMARY KEY ("id")
            )
        `);

        // Create teachers table
        await queryRunner.query(`
            CREATE TABLE "teachers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courses" text array NOT NULL DEFAULT '{}',
                CONSTRAINT "PK_teachers" PRIMARY KEY ("id")
            )
        `);

        // Create classes table
        await queryRunner.query(`
            CREATE TABLE "classes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "courseIds" text NOT NULL DEFAULT '',
                "students" text NOT NULL DEFAULT '',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_classes" PRIMARY KEY ("id")
            )
        `);

        // Create students table
        await queryRunner.query(`
            CREATE TABLE "students" (
                "id" uuid NOT NULL,
                "birthDate" date NOT NULL,
                "parentId" uuid,
                "classId" uuid,
                "subscription_status" character varying(50) NOT NULL DEFAULT 'inactive',
                "subscription_end_date" TIMESTAMP,
                "registration_form_completed" boolean NOT NULL DEFAULT false,
                "form_completion_date" TIMESTAMP,
                CONSTRAINT "PK_students" PRIMARY KEY ("id")
            )
        `);

        // Create courses table
        await queryRunner.query(`
            CREATE TABLE "courses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "teacherId" uuid,
                "classId" uuid NOT NULL,
                "sessions" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_courses" PRIMARY KEY ("id")
            )
        `);

        // Create posts table
        await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "subject" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_posts" PRIMARY KEY ("id")
            )
        `);

        // Create post_attachments table
        await queryRunner.query(`
            CREATE TABLE "post_attachments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "postId" uuid NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "filePath" character varying(500) NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying(100) NOT NULL,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_post_attachments" PRIMARY KEY ("id")
            )
        `);

        // Create folders table
        await queryRunner.query(`
            CREATE TABLE "folders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" uuid NOT NULL,
                "parentFolderId" uuid,
                "name" character varying(255) NOT NULL,
                "createdBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_folders" PRIMARY KEY ("id")
            )
        `);

        // Create files table
        await queryRunner.query(`
            CREATE TABLE "files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" uuid NOT NULL,
                "folderId" uuid,
                "fileName" character varying(255) NOT NULL,
                "filePath" character varying(1000) NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying(100) NOT NULL,
                "uploadedBy" uuid NOT NULL,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_files" PRIMARY KEY ("id")
            )
        `);

        // Create assignments table
        await queryRunner.query(`
            CREATE TABLE "assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" uuid NOT NULL,
                "createdBy" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "dueDate" date NOT NULL,
                "dueTime" time NOT NULL,
                "marks" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_assignments" PRIMARY KEY ("id")
            )
        `);

        // Create assignment_submissions table
        await queryRunner.query(`
            CREATE TABLE "assignment_submissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
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
                CONSTRAINT "PK_assignment_submissions" PRIMARY KEY ("id")
            )
        `);

        // Create attendance table
        await queryRunner.query(`
            CREATE TABLE "attendance" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "date" date NOT NULL,
                "day" character varying(20),
                "time" character varying(20),
                "meetingId" uuid,
                "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'absent',
                "markedBy" uuid NOT NULL,
                "markedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "notes" text,
                CONSTRAINT "PK_attendance" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_attendance_course_student_meeting" UNIQUE ("courseId", "studentId", "meetingId")
            )
        `);

        // Create webhook_events table
        await queryRunner.query(`
            CREATE TABLE "webhook_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "stripe_event_id" character varying(64) NOT NULL,
                "type" character varying(100) NOT NULL,
                "payload" jsonb NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_webhook_events_stripe_event_id" UNIQUE ("stripe_event_id"),
                CONSTRAINT "PK_webhook_events" PRIMARY KEY ("id")
            )
        `);

        // Create subscriptions table
        await queryRunner.query(`
            CREATE TABLE "subscriptions" (
                "id" bigserial NOT NULL,
                "user_id" uuid NOT NULL,
                "student_id" uuid NOT NULL,
                "student_name" character varying(255),
                "stripe_subscription_id" character varying(64),
                "stripe_customer_id" character varying(64),
                "status" character varying(50) NOT NULL,
                "current_period_start" TIMESTAMP,
                "current_period_end" TIMESTAMP,
                "cancel_at" TIMESTAMP,
                "canceled_at" TIMESTAMP,
                "amount" bigint NOT NULL DEFAULT 0,
                "currency" character varying(10) NOT NULL DEFAULT 'usd',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
            )
        `);

        // Create invoices table
        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" bigserial NOT NULL,
                "user_id" uuid NOT NULL,
                "student_id" uuid NOT NULL,
                "student_name" character varying(255),
                "subscription_id" bigint,
                "stripe_invoice_id" character varying(64) NOT NULL,
                "stripe_subscription_id" character varying(64),
                "amount_paid" bigint NOT NULL,
                "currency" character varying(10) NOT NULL,
                "status" character varying(50) NOT NULL,
                "paid_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
            )
        `);

        // Create zoom_meetings table
        await queryRunner.query(`
            CREATE TABLE "zoom_meetings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "invitationLink" text NOT NULL,
                "zoomMeetingId" character varying(50),
                "zoomPassword" character varying(10),
                "zoomStartUrl" text,
                "date" date,
                "time" character varying(10),
                "period" character varying(2) NOT NULL DEFAULT 'AM',
                "joinCount" integer NOT NULL DEFAULT 0,
                "status" character varying(50) NOT NULL DEFAULT 'scheduled',
                "recordingStatus" character varying(50) NOT NULL DEFAULT 'pending',
                "recordingUrl" text,
                "youtubeVideoId" character varying(100),
                "youtubeUrl" text,
                "recordingCompletedAt" TIMESTAMP,
                "r2RecordingKey" character varying(500),
                "r2RecordingUrl" text,
                "createdById" uuid,
                "courseId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_zoom_meetings" PRIMARY KEY ("id")
            )
        `);

        // Create app_config table
        await queryRunner.query(`
            CREATE TABLE "app_config" (
                "key" character varying NOT NULL,
                "value" text,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_app_config" PRIMARY KEY ("key")
            )
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'medium',
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "metadata" json,
                "relatedId" character varying,
                "isRead" boolean NOT NULL DEFAULT false,
                "isArchived" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "readAt" TIMESTAMP,
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);

        // Create announcement_posts table
        await queryRunner.query(`
            CREATE TABLE "announcement_posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "authorId" uuid NOT NULL,
                "subject" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_announcement_posts" PRIMARY KEY ("id")
            )
        `);

        // Create announcement_post_attachments table
        await queryRunner.query(`
            CREATE TABLE "announcement_post_attachments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "postId" uuid NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "filePath" character varying(500) NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying(100) NOT NULL,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_announcement_post_attachments" PRIMARY KEY ("id")
            )
        `);

        // Create announcement_meetings table
        await queryRunner.query(`
            CREATE TABLE "announcement_meetings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "invitationLink" text NOT NULL,
                "zoomMeetingId" character varying(50),
                "zoomPassword" character varying(10),
                "zoomStartUrl" text,
                "date" date,
                "time" character varying(10),
                "period" character varying(2) NOT NULL DEFAULT 'AM',
                "joinCount" integer NOT NULL DEFAULT 0,
                "status" character varying(50) NOT NULL DEFAULT 'scheduled',
                "recordingStatus" character varying(50) NOT NULL DEFAULT 'pending',
                "recordingUrl" text,
                "youtubeVideoId" character varying(100),
                "youtubeUrl" text,
                "recordingCompletedAt" TIMESTAMP,
                "r2RecordingKey" character varying(500),
                "r2RecordingUrl" text,
                "createdById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_announcement_meetings" PRIMARY KEY ("id")
            )
        `);

        // Add Foreign Key Constraints
        await queryRunner.query(`ALTER TABLE "parents" ADD CONSTRAINT "FK_parents_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teachers" ADD CONSTRAINT "FK_teachers_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_parent" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_teacher" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_attachments" ADD CONSTRAINT "FK_post_attachments_post" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_folders_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_folders_parent" FOREIGN KEY ("parentFolderId") REFERENCES "folders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_folders_creator" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_files_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_files_folder" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_files_uploader" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_creator" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" ADD CONSTRAINT "FK_assignment_submissions_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" ADD CONSTRAINT "FK_assignment_submissions_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" ADD CONSTRAINT "FK_assignment_submissions_grader" FOREIGN KEY ("gradedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_marker" FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_meeting" FOREIGN KEY ("meetingId") REFERENCES "zoom_meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "zoom_meetings" ADD CONSTRAINT "FK_zoom_meetings_creator" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "zoom_meetings" ADD CONSTRAINT "FK_zoom_meetings_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcement_posts" ADD CONSTRAINT "FK_announcement_posts_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcement_post_attachments" ADD CONSTRAINT "FK_announcement_post_attachments_post" FOREIGN KEY ("postId") REFERENCES "announcement_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcement_meetings" ADD CONSTRAINT "FK_announcement_meetings_creator" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Create Performance Indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        await queryRunner.query(`CREATE INDEX "IDX_students_parent_id" ON "students" ("parentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_students_class_id" ON "students" ("classId")`);
        await queryRunner.query(`CREATE INDEX "IDX_courses_teacher_id" ON "courses" ("teacherId")`);
        await queryRunner.query(`CREATE INDEX "IDX_courses_class_id" ON "courses" ("classId")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_course_id" ON "posts" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_author_id" ON "posts" ("authorId")`);
        await queryRunner.query(`CREATE INDEX "IDX_folders_course_id" ON "folders" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_folders_parent_folder_id" ON "folders" ("parentFolderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_files_course_id" ON "files" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_files_folder_id" ON "files" ("folderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_assignments_course_id" ON "assignments" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_assignment_submissions_assignment_id" ON "assignment_submissions" ("assignmentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_assignment_submissions_student_id" ON "assignment_submissions" ("studentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_attendance_course_id" ON "attendance" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_attendance_student_id" ON "attendance" ("studentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_attendance_date" ON "attendance" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_student_id" ON "subscriptions" ("student_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_user_id" ON "invoices" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_student_id" ON "invoices" ("student_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_zoom_meetings_course_id" ON "zoom_meetings" ("courseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_zoom_meetings_date" ON "zoom_meetings" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_type" ON "notifications" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("isRead")`);
        await queryRunner.query(`CREATE INDEX "IDX_announcement_posts_author_id" ON "announcement_posts" ("authorId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_announcement_posts_author_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_is_read"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_zoom_meetings_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_zoom_meetings_course_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invoices_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invoices_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_attendance_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_attendance_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_attendance_course_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_assignment_submissions_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_assignment_submissions_assignment_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_assignments_course_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_folder_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_course_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_folders_parent_folder_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_folders_course_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_author_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_course_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_courses_class_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_courses_teacher_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_students_class_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_students_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);

        // Drop all foreign key constraints
        await queryRunner.query(`ALTER TABLE "announcement_meetings" DROP CONSTRAINT "FK_announcement_meetings_creator"`);
        await queryRunner.query(`ALTER TABLE "announcement_post_attachments" DROP CONSTRAINT "FK_announcement_post_attachments_post"`);
        await queryRunner.query(`ALTER TABLE "announcement_posts" DROP CONSTRAINT "FK_announcement_posts_author"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "zoom_meetings" DROP CONSTRAINT "FK_zoom_meetings_course"`);
        await queryRunner.query(`ALTER TABLE "zoom_meetings" DROP CONSTRAINT "FK_zoom_meetings_creator"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_subscription"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_student"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_user"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_student"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_meeting"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_marker"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_student"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_course"`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" DROP CONSTRAINT "FK_assignment_submissions_grader"`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" DROP CONSTRAINT "FK_assignment_submissions_student"`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" DROP CONSTRAINT "FK_assignment_submissions_assignment"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_assignments_creator"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_assignments_course"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_uploader"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_folder"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_course"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_folders_creator"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_folders_parent"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_folders_course"`);
        await queryRunner.query(`ALTER TABLE "post_attachments" DROP CONSTRAINT "FK_post_attachments_post"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_author"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_course"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_class"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_teacher"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_class"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_parent"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_user"`);
        await queryRunner.query(`ALTER TABLE "teachers" DROP CONSTRAINT "FK_teachers_user"`);
        await queryRunner.query(`ALTER TABLE "parents" DROP CONSTRAINT "FK_parents_user"`);

        // Drop all tables
        await queryRunner.query(`DROP TABLE "announcement_meetings"`);
        await queryRunner.query(`DROP TABLE "announcement_post_attachments"`);
        await queryRunner.query(`DROP TABLE "announcement_posts"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "app_config"`);
        await queryRunner.query(`DROP TABLE "zoom_meetings"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TABLE "assignment_submissions"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TABLE "folders"`);
        await queryRunner.query(`DROP TABLE "post_attachments"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP TABLE "teachers"`);
        await queryRunner.query(`DROP TABLE "parents"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop ENUM types
        await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}

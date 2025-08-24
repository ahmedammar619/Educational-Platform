import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEntitiesToUUID1709123456790 implements MigrationInterface {
  name = 'UpdateEntitiesToUUID1709123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update courses table
    await queryRunner.query(`
      ALTER TABLE "courses" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      DROP COLUMN IF EXISTS "maxStudents",
      DROP COLUMN IF EXISTS "currentStudents",
      DROP COLUMN IF EXISTS "isPublished",
      DROP COLUMN IF EXISTS "category",
      DROP COLUMN IF EXISTS "level",
      DROP COLUMN IF EXISTS "location",
      DROP COLUMN IF EXISTS "requirements",
      DROP COLUMN IF EXISTS "learningOutcomes",
      DROP COLUMN IF EXISTS "updatedAt"
    `);

    // Update course_sessions table
    await queryRunner.query(`
      ALTER TABLE "course_sessions" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid,
      DROP COLUMN IF EXISTS "location"
    `);

    // Update course_enrollments table
    await queryRunner.query(`
      ALTER TABLE "course_enrollments" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
    `);

    // Update course_materials table
    await queryRunner.query(`
      ALTER TABLE "course_materials" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid,
      DROP COLUMN IF EXISTS "isPublished"
    `);

    // Update course_files table
    await queryRunner.query(`
      ALTER TABLE "course_files" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
    `);

    // Update course_folders table
    await queryRunner.query(`
      ALTER TABLE "course_folders" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid,
      ALTER COLUMN "parentFolderId" TYPE uuid USING parentFolderId::uuid
    `);

    // Update course_schedules table
    await queryRunner.query(`
      ALTER TABLE "course_schedules" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid,
      DROP COLUMN IF EXISTS "location"
    `);

    // Update session_attendance table
    await queryRunner.query(`
      ALTER TABLE "session_attendance" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "sessionId" TYPE uuid USING sessionId::uuid
    `);

    // Update session_materials table
    await queryRunner.query(`
      ALTER TABLE "session_materials" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "sessionId" TYPE uuid USING sessionId::uuid,
      ALTER COLUMN "materialId" TYPE uuid USING materialId::uuid
    `);

    // Update material_attachments table
    await queryRunner.query(`
      ALTER TABLE "material_attachments" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "materialId" TYPE uuid USING materialId::uuid,
      ALTER COLUMN "fileId" TYPE uuid USING fileId::uuid
    `);

    // Update parent_children table
    await queryRunner.query(`
      ALTER TABLE "parent_children" 
      ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
    `);

    // Update users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "isActive",
      DROP COLUMN IF EXISTS "failedLoginAttempts",
      DROP COLUMN IF EXISTS "lockedUntil"
    `);

    // Update foreign key constraints for course-related tables
    await queryRunner.query(`
      ALTER TABLE "course_sessions" 
      DROP CONSTRAINT IF EXISTS "FK_course_sessions_course",
      ADD CONSTRAINT "FK_course_sessions_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_enrollments" 
      DROP CONSTRAINT IF EXISTS "FK_course_enrollments_course",
      ADD CONSTRAINT "FK_course_enrollments_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_materials" 
      DROP CONSTRAINT IF EXISTS "FK_course_materials_course",
      ADD CONSTRAINT "FK_course_materials_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_files" 
      DROP CONSTRAINT IF EXISTS "FK_course_files_course",
      ADD CONSTRAINT "FK_course_files_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_folders" 
      DROP CONSTRAINT IF EXISTS "FK_course_folders_course",
      ADD CONSTRAINT "FK_course_folders_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_schedules" 
      DROP CONSTRAINT IF EXISTS "FK_course_schedules_course",
      ADD CONSTRAINT "FK_course_schedules_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "session_attendance" 
      DROP CONSTRAINT IF EXISTS "FK_session_attendance_session",
      ADD CONSTRAINT "FK_session_attendance_session" 
      FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "session_materials" 
      DROP CONSTRAINT IF EXISTS "FK_session_materials_session",
      ADD CONSTRAINT "FK_session_materials_session" 
      FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "session_materials" 
      DROP CONSTRAINT IF EXISTS "FK_session_materials_material",
      ADD CONSTRAINT "FK_session_materials_material" 
      FOREIGN KEY ("materialId") REFERENCES "course_materials"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "material_attachments" 
      DROP CONSTRAINT IF EXISTS "FK_material_attachments_material",
      ADD CONSTRAINT "FK_material_attachments_material" 
      FOREIGN KEY ("materialId") REFERENCES "course_materials"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "material_attachments" 
      DROP CONSTRAINT IF EXISTS "FK_material_attachments_file",
      ADD CONSTRAINT "FK_material_attachments_file" 
      FOREIGN KEY ("fileId") REFERENCES "course_files"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert all changes - this is complex and may require manual intervention
    // For now, we'll just log that this migration cannot be easily reverted
    console.log('This migration cannot be easily reverted. Manual intervention required.');
  }
}

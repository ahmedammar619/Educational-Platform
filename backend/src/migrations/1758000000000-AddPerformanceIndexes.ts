import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1758000000000 implements MigrationInterface {
    name = 'AddPerformanceIndexes1758000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add indexes for frequently queried fields to improve performance
        
        // Index for email lookups (most common query)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`);
        
        // Index for role-based queries
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")`);
        
        // Index for email verification status
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email_verified" ON "users" ("emailVerified")`);
        
        // Index for email verification token lookups
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email_verification_token" ON "users" ("emailVerificationToken")`);
        
        // Index for reset token lookups
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_reset_token" ON "users" ("resetToken")`);
        
        // Index for created_at for sorting and filtering
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("createdAt")`);
        
        // Composite index for role + emailVerified (common combination)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_role_email_verified" ON "users" ("role", "emailVerified")`);
        
        // Index for students table - parentId lookups
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_students_parent_id" ON "students" ("parentId")`);
        
        // Index for students table - classId lookups
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_students_class_id" ON "students" ("classId")`);
        
        // Index for parents table - studentIds array operations (PostgreSQL specific)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_parents_student_ids" ON "parents" USING GIN ("studentIds")`);
        
        // Index for courses table - classId lookups
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_courses_class_id" ON "courses" ("classId")`);
        
        // Index for courses table - teacherId lookups
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_courses_teacher_id" ON "courses" ("teacherId")`);
        
        // Index for classes table - startDate and endDate for filtering
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_classes_start_date" ON "classes" ("startDate")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_classes_end_date" ON "classes" ("endDate")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all the indexes we created
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_verified"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_verification_token"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_reset_token"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role_email_verified"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_parent_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_class_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_parents_student_ids"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_courses_class_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_courses_teacher_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_classes_start_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_classes_end_date"`);
    }
}

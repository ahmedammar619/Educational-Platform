import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteForStudentReferences1758000000001 implements MigrationInterface {
    name = 'AddCascadeDeleteForStudentReferences1758000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign key constraints and recreate them with CASCADE DELETE
        
        // Update assignment_submissions table
        await queryRunner.query(`ALTER TABLE "assignment_submissions" DROP CONSTRAINT IF EXISTS "FK_dfb5017c979e0e8e47659b0da24"`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" ADD CONSTRAINT "FK_dfb5017c979e0e8e47659b0da24" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        // Update attendance table
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_84f6551ba4610265a246ef6f387"`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_84f6551ba4610265a246ef6f387" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        // Update subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_student_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        // Update invoices table
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_student_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes by removing CASCADE DELETE
        
        // Revert assignment_submissions table
        await queryRunner.query(`ALTER TABLE "assignment_submissions" DROP CONSTRAINT IF EXISTS "FK_dfb5017c979e0e8e47659b0da24"`);
        await queryRunner.query(`ALTER TABLE "assignment_submissions" ADD CONSTRAINT "FK_dfb5017c979e0e8e47659b0da24" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Revert attendance table
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_84f6551ba4610265a246ef6f387"`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_84f6551ba4610265a246ef6f387" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Revert subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_student_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Revert invoices table
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_student_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}

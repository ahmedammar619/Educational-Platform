import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentNameToPayments1757184000000 implements MigrationInterface {
    name = 'AddStudentNameToPayments1757184000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add student_name column to subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "student_name" character varying(255)`);
        
        // Add student_name column to invoices table
        await queryRunner.query(`ALTER TABLE "invoices" ADD "student_name" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove student_name column from invoices table
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "student_name"`);
        
        // Remove student_name column from subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "student_name"`);
    }
}

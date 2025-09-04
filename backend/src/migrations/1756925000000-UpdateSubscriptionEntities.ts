import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSubscriptionEntities1756925000000 implements MigrationInterface {
    name = 'UpdateSubscriptionEntities1756925000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add student_id column to subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "student_id" uuid NOT NULL`);
        
        // Add foreign key constraint for student_id
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE`);
        
        // Add new columns to subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "stripe_customer_id" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "stripe_price_id" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "amount" bigint DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "currency" character varying(10) DEFAULT 'usd'`);
        
        // Add student_id column to invoices table
        await queryRunner.query(`ALTER TABLE "invoices" ADD "student_id" uuid NOT NULL`);
        
        // Add foreign key constraint for student_id in invoices
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE`);
        
        // Add subscription_id column to invoices table
        await queryRunner.query(`ALTER TABLE "invoices" ADD "subscription_id" bigint`);
        
        // Add foreign key constraint for subscription_id in invoices
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL`);
        
        // Add subscription status columns to students table
        await queryRunner.query(`ALTER TABLE "students" ADD "subscription_status" character varying(50) DEFAULT 'inactive'`);
        await queryRunner.query(`ALTER TABLE "students" ADD "subscription_end_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from students table
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "subscription_end_date"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "subscription_status"`);
        
        // Remove foreign key constraints and columns from invoices table
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_subscription_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "subscription_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_student_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "student_id"`);
        
        // Remove new columns from subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "stripe_price_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "stripe_customer_id"`);
        
        // Remove foreign key constraint and student_id column from subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_student_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "student_id"`);
    }
}

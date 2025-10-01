import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStripeIdLengths1727658000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update student_subscriptions table
        await queryRunner.query(`ALTER TABLE "student_subscriptions" ALTER COLUMN "stripe_subscription_id" TYPE varchar(255)`);
        await queryRunner.query(`ALTER TABLE "student_subscriptions" ALTER COLUMN "stripe_customer_id" TYPE varchar(255)`);

        // Update payments table
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "stripe_payment_intent_id" TYPE varchar(255)`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "stripe_invoice_id" TYPE varchar(255)`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "stripe_charge_id" TYPE varchar(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes
        await queryRunner.query(`ALTER TABLE "student_subscriptions" ALTER COLUMN "stripe_subscription_id" TYPE varchar(64)`);
        await queryRunner.query(`ALTER TABLE "student_subscriptions" ALTER COLUMN "stripe_customer_id" TYPE varchar(64)`);

        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "stripe_payment_intent_id" TYPE varchar(64)`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "stripe_invoice_id" TYPE varchar(64)`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "stripe_charge_id" TYPE varchar(64)`);
    }
}

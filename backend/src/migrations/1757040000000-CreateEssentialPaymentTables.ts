import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEssentialPaymentTables1757040000000 implements MigrationInterface {
    name = 'CreateEssentialPaymentTables1757040000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create webhook_events table for tracking Stripe events
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "webhook_events" (
                "id" BIGSERIAL PRIMARY KEY,
                "stripe_event_id" VARCHAR(64) UNIQUE NOT NULL,
                "type" VARCHAR(100) NOT NULL,
                "payload" JSONB NOT NULL,
                "created_at" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create subscriptions table for tracking user subscriptions
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscriptions" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
                "student_id" uuid REFERENCES students(id) ON DELETE CASCADE,
                "stripe_subscription_id" VARCHAR(64) NOT NULL,
                "stripe_customer_id" VARCHAR(64),
                "status" VARCHAR(50) NOT NULL,
                "current_period_start" TIMESTAMP,
                "current_period_end" TIMESTAMP,
                "cancel_at" TIMESTAMP,
                "canceled_at" TIMESTAMP,
                "amount" BIGINT DEFAULT 0,
                "currency" VARCHAR(10) DEFAULT 'usd',
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create invoices table for tracking payments
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "invoices" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
                "student_id" uuid REFERENCES students(id) ON DELETE CASCADE,
                "subscription_id" BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
                "stripe_invoice_id" VARCHAR(64) NOT NULL,
                "stripe_subscription_id" VARCHAR(64),
                "amount_paid" BIGINT NOT NULL,
                "currency" VARCHAR(10) NOT NULL,
                "status" VARCHAR(50) NOT NULL,
                "paid_at" TIMESTAMP,
                "created_at" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Add indexes for better performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhook_events_stripe_event_id" ON "webhook_events" ("stripe_event_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhook_events_type" ON "webhook_events" ("type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_student_id" ON "subscriptions" ("student_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_stripe_subscription_id" ON "subscriptions" ("stripe_subscription_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoices_user_id" ON "invoices" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoices_student_id" ON "invoices" ("student_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoices_subscription_id" ON "invoices" ("subscription_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_subscription_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_student_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_stripe_subscription_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_student_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_events_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_events_stripe_event_id"`);

        // Drop tables (in reverse order due to foreign keys)
        await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "webhook_events"`);
    }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentsTables1756594881121 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create webhook_events table
        await queryRunner.query(`
            CREATE TABLE "webhook_events" (
                "id" BIGSERIAL PRIMARY KEY,
                "stripe_event_id" VARCHAR(64) UNIQUE NOT NULL,
                "type" VARCHAR(100) NOT NULL,
                "payload" JSONB NOT NULL,
                "created_at" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create invoices table
        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
                "stripe_invoice_id" VARCHAR(64) NOT NULL,
                "stripe_subscription_id" VARCHAR(64),
                "amount_paid" BIGINT NOT NULL,
                "currency" VARCHAR(10) NOT NULL,
                "status" VARCHAR(50) NOT NULL,
                "paid_at" TIMESTAMP,
                "created_at" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create subscriptions table
        await queryRunner.query(`
            CREATE TABLE "subscriptions" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
                "stripe_subscription_id" VARCHAR(64) NOT NULL,
                "status" VARCHAR(50) NOT NULL,
                "current_period_start" TIMESTAMP,
                "current_period_end" TIMESTAMP,
                "cancel_at" TIMESTAMP,
                "canceled_at" TIMESTAMP,
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Add indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_webhook_events_stripe_event_id" ON "webhook_events" ("stripe_event_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_user_id" ON "invoices" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_stripe_invoice_id" ON "invoices" ("stripe_invoice_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_stripe_subscription_id" ON "subscriptions" ("stripe_subscription_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_subscriptions_stripe_subscription_id"`);
        await queryRunner.query(`DROP INDEX "IDX_subscriptions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_invoices_stripe_invoice_id"`);
        await queryRunner.query(`DROP INDEX "IDX_invoices_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_webhook_events_stripe_event_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
    }
}

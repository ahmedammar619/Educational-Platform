import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWebhookEventsTableId1757100000000 implements MigrationInterface {
    name = 'FixWebhookEventsTableId1757100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing webhook_events table and recreate with UUID primary key
        await queryRunner.query(`DROP TABLE IF EXISTS "webhook_events"`);
        await queryRunner.query(`CREATE TABLE "webhook_events" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "stripe_event_id" character varying(64) NOT NULL,
            "type" character varying(100) NOT NULL,
            "payload" jsonb NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_webhook_events_stripe_event_id" UNIQUE ("stripe_event_id"),
            CONSTRAINT "PK_webhook_events" PRIMARY KEY ("id")
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to bigint if needed
        await queryRunner.query(`DROP TABLE IF EXISTS "webhook_events"`);
        await queryRunner.query(`CREATE TABLE "webhook_events" (
            "id" bigint NOT NULL,
            "stripe_event_id" character varying(64) NOT NULL,
            "type" character varying(100) NOT NULL,
            "payload" jsonb NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_webhook_events_stripe_event_id" UNIQUE ("stripe_event_id"),
            CONSTRAINT "PK_webhook_events" PRIMARY KEY ("id")
        )`);
    }
}

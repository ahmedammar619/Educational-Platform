import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeStripeSubscriptionIdNullable1757040000001 implements MigrationInterface {
    name = 'MakeStripeSubscriptionIdNullable1757040000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "stripe_subscription_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "stripe_subscription_id" SET NOT NULL`);
    }
}

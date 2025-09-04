import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStripeCustomerIdToUsers1757030000000 implements MigrationInterface {
    name = 'AddStripeCustomerIdToUsers1757030000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add stripe_customer_id column to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "stripe_customer_id" character varying(64)`);
        
        // Add index for better performance
        await queryRunner.query(`CREATE INDEX "IDX_users_stripe_customer_id" ON "users" ("stripe_customer_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the index
        await queryRunner.query(`DROP INDEX "IDX_users_stripe_customer_id"`);
        
        // Remove the column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripe_customer_id"`);
    }
}

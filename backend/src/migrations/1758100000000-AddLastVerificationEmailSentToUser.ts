import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastVerificationEmailSentToUser1758100000000 implements MigrationInterface {
    name = 'AddLastVerificationEmailSentToUser1758100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD "lastVerificationEmailSent" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "lastVerificationEmailSent"
        `);
    }
}

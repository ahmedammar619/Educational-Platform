import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationFields1758000000000 implements MigrationInterface {
    name = 'AddEmailVerificationFields1758000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationExpiry" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
    }
}

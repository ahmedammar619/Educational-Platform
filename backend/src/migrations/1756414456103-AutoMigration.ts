import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1756414456103 implements MigrationInterface {
    name = 'AutoMigration1756414456103'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" ADD "sessions" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "sessions"`);
    }

}

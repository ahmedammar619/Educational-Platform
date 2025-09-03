import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFilePathLengthForR21756920000000 implements MigrationInterface {
    name = 'UpdateFilePathLengthForR21756920000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, update any NULL values to empty string (or you could set a default)
        await queryRunner.query(`UPDATE "files" SET "filePath" = '' WHERE "filePath" IS NULL`);
        
        // Then change the column type and length
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" TYPE character varying(1000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" TYPE character varying(500)`);
    }
}

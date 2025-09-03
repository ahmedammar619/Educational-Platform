import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFilePathLengthForR21756920000000 implements MigrationInterface {
    name = 'UpdateFilePathLengthForR21756920000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, update any NULL filePath values to a placeholder
        await queryRunner.query(`UPDATE "files" SET "filePath" = 'legacy-file-missing-path' WHERE "filePath" IS NULL`);
        
        // Then change the column type and make it NOT NULL
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" TYPE character varying(1000)`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Allow NULL values again
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" DROP NOT NULL`);
        
        // Change back to original length
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" TYPE character varying(500)`);
    }
}

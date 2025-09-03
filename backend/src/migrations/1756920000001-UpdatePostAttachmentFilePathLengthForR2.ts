import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostAttachmentFilePathLengthForR21756920000001 implements MigrationInterface {
    name = 'UpdatePostAttachmentFilePathLengthForR21756920000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, update any NULL filePath values to a placeholder
        await queryRunner.query(`UPDATE "post_attachments" SET "filePath" = 'legacy-attachment-missing-path' WHERE "filePath" IS NULL`);
        
        // Then change the column type and make it NOT NULL
        await queryRunner.query(`ALTER TABLE "post_attachments" ALTER COLUMN "filePath" TYPE character varying(1000)`);
        await queryRunner.query(`ALTER TABLE "post_attachments" ALTER COLUMN "filePath" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Allow NULL values again
        await queryRunner.query(`ALTER TABLE "post_attachments" ALTER COLUMN "filePath" DROP NOT NULL`);
        
        // Change back to original length
        await queryRunner.query(`ALTER TABLE "post_attachments" ALTER COLUMN "filePath" TYPE character varying(500)`);
    }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFilePathLengthForR21756920000000 implements MigrationInterface {
    name = 'UpdateFilePathLengthForR21756920000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" TYPE character varying(1000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "filePath" TYPE character varying(500)`);
    }
}

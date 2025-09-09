import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1757417735152 implements MigrationInterface {
    name = 'AutoMigration1757417735152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "app_config" ("key" character varying NOT NULL, "value" text, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e53f3c7882ebd6e79931e0fa959" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "app_config"`);
    }

}

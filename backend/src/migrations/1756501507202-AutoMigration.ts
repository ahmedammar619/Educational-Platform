import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1756501507202 implements MigrationInterface {
    name = 'AutoMigration1756501507202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "students" ADD "classId" uuid`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_575e5ce508ee1275f45cb7c4c32" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_575e5ce508ee1275f45cb7c4c32"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "classId"`);
    }

}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCourseTeacherIdNullable1757040000000 implements MigrationInterface {
  name = 'MakeCourseTeacherIdNullable1757040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make teacherId nullable in courses table
    await queryRunner.query(
      `ALTER TABLE "courses" ALTER COLUMN "teacherId" DROP NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert teacherId to NOT NULL (but first update any null values)
    await queryRunner.query(
      `UPDATE "courses" SET "teacherId" = '00000000-0000-0000-0000-000000000000' WHERE "teacherId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ALTER COLUMN "teacherId" SET NOT NULL`
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToStudents1709123456798 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add phone column to students table
    await queryRunner.query(`
      ALTER TABLE "students" 
      ADD COLUMN "phone" VARCHAR(20);
    `);

    // Create index on phone field for better performance
    await queryRunner.query(`
      CREATE INDEX "idx_students_phone" ON "students" ("phone");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX "idx_students_phone";
    `);

    // Drop phone column
    await queryRunner.query(`
      ALTER TABLE "students" DROP COLUMN "phone";
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParentStudentTables1709123456797 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create parents table
    await queryRunner.query(`
      CREATE TABLE "parents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "phone" VARCHAR(20),
        "role" VARCHAR(20) NOT NULL DEFAULT 'parent',
        "resetToken" VARCHAR(255),
        "resetTokenExpiry" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "childrenIds" TEXT[] DEFAULT '{}'
      );
    `);

    // Create students table
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" VARCHAR(20) NOT NULL DEFAULT 'student',
        "resetToken" VARCHAR(255),
        "resetTokenExpiry" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "birthDate" DATE NOT NULL,
        "parentId" UUID
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_parents_email" ON "parents" ("email");
      CREATE INDEX "idx_students_email" ON "students" ("email");
      CREATE INDEX "idx_students_parent_id" ON "students" ("parentId");
      CREATE INDEX "idx_students_birth_date" ON "students" ("birthDate");
    `);

    // Add foreign key constraint for students.parentId -> parents.id
    await queryRunner.query(`
      ALTER TABLE "students" ADD CONSTRAINT "fk_students_parent_id" 
      FOREIGN KEY ("parentId") REFERENCES "parents" ("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "students" DROP CONSTRAINT "fk_students_parent_id";
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_parents_email";
      DROP INDEX "idx_students_email";
      DROP INDEX "idx_students_parent_id";
      DROP INDEX "idx_students_birth_date";
    `);

    // Drop tables
    await queryRunner.query(`
      DROP TABLE "students";
      DROP TABLE "parents";
    `);
  }
}

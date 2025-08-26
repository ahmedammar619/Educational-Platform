import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureAllEntitiesToOneToOne1709123456801 implements MigrationInterface {
  name = 'RestructureAllEntitiesToOneToOne1709123456801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add phone column to users table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'phone') THEN
          ALTER TABLE "users" ADD COLUMN "phone" character varying(20);
        END IF;
      END $$;
    `);

    // Step 2: Drop ALL existing tables with duplicate data (including teachers)
    await queryRunner.query(`DROP TABLE IF EXISTS "students" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teachers" CASCADE`);

    // Step 3: Create new parents table - simplified with only studentIds array
    await queryRunner.query(`
      CREATE TABLE "parents" (
        "id" uuid NOT NULL,
        "studentIds" text[] DEFAULT '{}',
        CONSTRAINT "PK_parents" PRIMARY KEY ("id")
      )
    `);

    // Step 4: Create new students table - simplified with only birthDate and parentId
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid NOT NULL,
        "birthDate" date NOT NULL,
        "parentId" uuid,
        CONSTRAINT "PK_students" PRIMARY KEY ("id")
      )
    `);

    // Step 5: Create new teachers table - simplified with only subjects array
    await queryRunner.query(`
      CREATE TABLE "teachers" (
        "id" uuid NOT NULL,
        "subjects" text[] DEFAULT '{}',
        CONSTRAINT "PK_teachers" PRIMARY KEY ("id")
      )
    `);

    // Step 6: Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "parents" 
      ADD CONSTRAINT "FK_parents_user" 
      FOREIGN KEY ("id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "students" 
      ADD CONSTRAINT "FK_students_user" 
      FOREIGN KEY ("id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "teachers" 
      ADD CONSTRAINT "FK_teachers_user" 
      FOREIGN KEY ("id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "students" 
      ADD CONSTRAINT "FK_students_parent" 
      FOREIGN KEY ("parentId") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Step 7: Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_students_birthDate" ON "students" ("birthDate");
      CREATE INDEX "IDX_students_parentId" ON "students" ("parentId");
      CREATE INDEX "IDX_parents_studentIds" ON "parents" USING GIN ("studentIds");
      CREATE INDEX "IDX_teachers_subjects" ON "teachers" USING GIN ("subjects");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_students_birthDate";
      DROP INDEX IF EXISTS "IDX_students_parentId";
      DROP INDEX IF EXISTS "IDX_parents_studentIds";
      DROP INDEX IF EXISTS "IDX_teachers_subjects";
    `);

    // Step 2: Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_students_parent";
      ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "FK_teachers_user";
      ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_students_user";
      ALTER TABLE "parents" DROP CONSTRAINT IF EXISTS "FK_parents_user";
    `);

    // Step 3: Drop new tables
    await queryRunner.query(`
      DROP TABLE IF EXISTS "teachers";
      DROP TABLE IF EXISTS "students";
      DROP TABLE IF EXISTS "parents";
    `);

    // Step 4: Recreate old tables (if needed for rollback)
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
      )
    `);

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
        "parentId" UUID,
        "phone" VARCHAR(20)
      )
    `);

    // Step 5: Remove phone column from users table
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";
    `);
  }
}

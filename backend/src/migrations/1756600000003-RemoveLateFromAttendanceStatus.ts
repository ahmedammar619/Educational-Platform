import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLateFromAttendanceStatus1756600000003 implements MigrationInterface {
  name = 'RemoveLateFromAttendanceStatus1756600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing 'late' records to 'absent'
    await queryRunner.query(`UPDATE "attendance" SET "status" = 'absent' WHERE "status" = 'late'`);
    
    // Drop the existing enum
    await queryRunner.query(`DROP TYPE IF EXISTS "attendance_status_enum"`);
    
    // Create the new enum without 'late'
    await queryRunner.query(`CREATE TYPE "attendance_status_enum" AS ENUM('present', 'absent')`);
    
    // Update the column to use the new enum
    await queryRunner.query(`ALTER TABLE "attendance" ALTER COLUMN "status" TYPE "attendance_status_enum" USING "status"::"attendance_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the current enum
    await queryRunner.query(`DROP TYPE IF EXISTS "attendance_status_enum"`);
    
    // Create the old enum with 'late'
    await queryRunner.query(`CREATE TYPE "attendance_status_enum" AS ENUM('present', 'absent', 'late')`);
    
    // Update the column to use the old enum
    await queryRunner.query(`ALTER TABLE "attendance" ALTER COLUMN "status" TYPE "attendance_status_enum" USING "status"::"attendance_status_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupDuplicateAttendanceRecords1756600000004 implements MigrationInterface {
  name = 'CleanupDuplicateAttendanceRecords1756600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, remove duplicate attendance records, keeping only the latest one for each student/meeting combination
    await queryRunner.query(`
      DELETE FROM attendance 
      WHERE id NOT IN (
        SELECT DISTINCT ON (course_id, student_id, meeting_id) id
        FROM attendance 
        WHERE meeting_id IS NOT NULL
        ORDER BY course_id, student_id, meeting_id, marked_at DESC
      )
    `);

    // Add unique constraint to prevent future duplicates
    await queryRunner.query(`
      ALTER TABLE "attendance" 
      ADD CONSTRAINT "UQ_attendance_course_student_meeting" 
      UNIQUE ("courseId", "studentId", "meetingId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique constraint
    await queryRunner.query(`
      ALTER TABLE "attendance" 
      DROP CONSTRAINT "UQ_attendance_course_student_meeting"
    `);
  }
}

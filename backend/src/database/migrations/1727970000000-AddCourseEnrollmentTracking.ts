import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCourseEnrollmentTracking1727970000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add enrollment tracking columns to student_subscriptions table
    await queryRunner.addColumn(
      'student_subscriptions',
      new TableColumn({
        name: 'is_enrolled',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'student_subscriptions',
      new TableColumn({
        name: 'enrolled_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'student_subscriptions',
      new TableColumn({
        name: 'course_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'student_subscriptions',
      new TableColumn({
        name: 'enrollment_status',
        type: 'varchar',
        length: '50',
        default: "'pending'",
      }),
    );

    // Create foreign key for course_id
    await queryRunner.query(`
      ALTER TABLE student_subscriptions
      ADD CONSTRAINT fk_student_subscriptions_course
      FOREIGN KEY (course_id) REFERENCES courses(id)
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE student_subscriptions
      DROP CONSTRAINT IF EXISTS fk_student_subscriptions_course
    `);

    // Drop columns
    await queryRunner.dropColumn('student_subscriptions', 'enrollment_status');
    await queryRunner.dropColumn('student_subscriptions', 'course_id');
    await queryRunner.dropColumn('student_subscriptions', 'enrolled_at');
    await queryRunner.dropColumn('student_subscriptions', 'is_enrolled');
  }
}

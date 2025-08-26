import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMissingStudentRecords1709123456804 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find all users with role 'student' that don't have corresponding student records
    const missingStudents = await queryRunner.query(`
      SELECT u.id, u.email, u."firstName", u."lastName", u."createdAt"
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      WHERE u.role = 'student' AND s.id IS NULL
    `);

    console.log(`Found ${missingStudents.length} students without student records`);

    // Create student records for each missing student
    for (const student of missingStudents) {
      // Set a default birth date (you might want to adjust this logic)
      const defaultBirthDate = new Date('2000-01-01');
      
      await queryRunner.query(`
        INSERT INTO students (id, "birthDate", "parentId")
        VALUES ($1, $2, $3)
      `, [student.id, defaultBirthDate, null]);
      
      console.log(`Created student record for ${student.email}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be safely reversed as it creates data
    // If needed, you would need to manually identify and remove the created records
    console.log('Migration cannot be safely reversed. Manual cleanup required if needed.');
  }
}

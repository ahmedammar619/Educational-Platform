import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMissingTeacherRecords1709123456805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find all users with role 'teacher' that don't have corresponding teacher records
    const missingTeachers = await queryRunner.query(`
      SELECT u.id, u.email, u."firstName", u."lastName", u."createdAt"
      FROM users u
      LEFT JOIN teachers t ON u.id = t.id
      WHERE u.role = 'teacher' AND t.id IS NULL
    `);

    console.log(`Found ${missingTeachers.length} teachers without teacher records`);

    // Create teacher records for each missing teacher
    for (const teacher of missingTeachers) {
      await queryRunner.query(`
        INSERT INTO teachers (id, courses)
        VALUES ($1, $2)
      `, [teacher.id, []]); // Empty array as default
      
      console.log(`Created teacher record for ${teacher.email}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be safely reversed as it creates data
    // If needed, you would need to manually identify and remove the created records
    console.log('Migration cannot be safely reversed. Manual cleanup required if needed.');
  }
}

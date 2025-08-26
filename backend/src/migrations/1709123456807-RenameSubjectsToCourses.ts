import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSubjectsToCourses1709123456807 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check what columns exist in the teachers table
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teachers' AND table_schema = 'public'
    `);
    
    console.log('Available columns in teachers table:', columns.map(c => c.column_name));
    
    // Check if subjects column exists
    const hasSubjects = columns.some(c => c.column_name === 'subjects');
    // Check if courses column already exists
    const hasCourses = columns.some(c => c.column_name === 'courses');
    
    if (hasSubjects && !hasCourses) {
      // Rename subjects to courses
      await queryRunner.query(`
        ALTER TABLE teachers 
        RENAME COLUMN subjects TO courses
      `);
      
      // Also rename the index if it exists
      try {
        await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_teachers_subjects"
        `);
        
        await queryRunner.query(`
          CREATE INDEX "IDX_teachers_courses" ON "teachers" USING GIN ("courses")
        `);
      } catch (error) {
        console.log('Index operations failed, continuing...', error.message);
      }
      
      console.log('Successfully renamed subjects column to courses in teachers table');
    } else if (hasCourses) {
      console.log('Courses column already exists, no rename needed');
    } else {
      console.log('Neither subjects nor courses column found, table structure may be different');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check what columns exist
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teachers' AND table_schema = 'public'
    `);
    
    const hasCourses = columns.some(c => c.column_name === 'courses');
    const hasSubjects = columns.some(c => c.column_name === 'subjects');
    
    if (hasCourses && !hasSubjects) {
      // Revert the change: rename courses back to subjects
      await queryRunner.query(`
        ALTER TABLE teachers 
        RENAME COLUMN courses TO subjects
      `);
      
      // Revert the index
      try {
        await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_teachers_courses"
        `);
        
        await queryRunner.query(`
          CREATE INDEX "IDX_teachers_subjects" ON "teachers" USING GIN ("subjects")
        `);
      } catch (error) {
        console.log('Index operations failed during rollback, continuing...', error.message);
      }
      
      console.log('Successfully reverted courses column back to subjects in teachers table');
    } else {
      console.log('No rollback needed - courses column does not exist or subjects already exists');
    }
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureEmailUniqueConstraint1709123456802 implements MigrationInterface {
  name = 'EnsureEmailUniqueConstraint1709123456802';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the unique constraint already exists
    const constraintExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'UQ_users_email' 
      AND table_name = 'users'
    `);

    if (constraintExists.length === 0) {
      // Create unique constraint on email column
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
      `);
      console.log('✅ Added unique constraint on users.email');
    } else {
      console.log('ℹ️  Unique constraint on users.email already exists');
    }

    // Create index for better performance on email lookups
    const indexExists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'IDX_users_email' 
      AND tablename = 'users'
    `);

    if (indexExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_email" ON "users" ("email")
      `);
      console.log('✅ Added index on users.email');
    } else {
      console.log('ℹ️  Index on users.email already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"
    `);

    // Drop the index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_email"
    `);

    console.log('✅ Removed unique constraint and index on users.email');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateFieldsFromUsers1709123456803 implements MigrationInterface {
  name = 'RemoveDuplicateFieldsFromUsers1709123456803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove duplicate columns from users table
    // These fields are properly stored in the role-specific tables
    
    // Remove birthDate column from users table (it's in students table)
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'birthDate') THEN
          ALTER TABLE "users" DROP COLUMN "birthDate";
          RAISE NOTICE 'Removed birthDate column from users table';
        ELSE
          RAISE NOTICE 'birthDate column does not exist in users table';
        END IF;
      END $$;
    `);

    // Remove parentId column from users table (it's in students table)
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'parentId') THEN
          ALTER TABLE "users" DROP COLUMN "parentId";
          RAISE NOTICE 'Removed parentId column from users table';
        ELSE
          RAISE NOTICE 'parentId column does not exist in users table';
        END IF;
      END $$;
    `);

    // Drop the parent_children junction table if it exists (no longer needed)
    await queryRunner.query(`
      DROP TABLE IF EXISTS "parent_children" CASCADE;
    `);

    console.log('✅ Cleaned up duplicate fields from users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the columns if rollback is needed
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthDate" date;
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "parentId" uuid;
    `);

    // Recreate the parent_children junction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_children" (
        "parentId" uuid NOT NULL,
        "childId" uuid NOT NULL,
        CONSTRAINT "PK_parent_children" PRIMARY KEY ("parentId", "childId")
      );
    `);

    console.log('✅ Restored duplicate fields to users table (rollback)');
  }
}

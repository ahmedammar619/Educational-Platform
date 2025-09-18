import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserReferencesNullable1757050000000 implements MigrationInterface {
  name = 'MakeUserReferencesNullable1757050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make createdById nullable in zoom_meetings table
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" ALTER COLUMN "createdById" DROP NOT NULL`
    );

    // Make createdById nullable in announcement_meetings table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "announcement_meetings" ALTER COLUMN "createdById" DROP NOT NULL`
    ).catch(() => {
      console.log('announcement_meetings table or createdById column does not exist, skipping...');
    });

    // Make markedBy nullable in attendance table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "markedBy" DROP NOT NULL`
    ).catch(() => {
      console.log('attendance table or markedBy column does not exist, skipping...');
    });

    // Make authorId nullable in announcement_posts table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "announcement_posts" ALTER COLUMN "authorId" DROP NOT NULL`
    ).catch(() => {
      console.log('announcement_posts table or authorId column does not exist, skipping...');
    });

    // Make uploadedBy nullable in files table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "uploadedBy" DROP NOT NULL`
    ).catch(() => {
      console.log('files table or uploadedBy column does not exist, skipping...');
    });

    // Make authorId nullable in posts table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "authorId" DROP NOT NULL`
    ).catch(() => {
      console.log('posts table or authorId column does not exist, skipping...');
    });

    // Make createdBy nullable in assignments table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "assignments" ALTER COLUMN "createdBy" DROP NOT NULL`
    ).catch(() => {
      console.log('assignments table or createdBy column does not exist, skipping...');
    });

    // Make createdBy nullable in folders table (if it exists)
    await queryRunner.query(
      `ALTER TABLE "folders" ALTER COLUMN "createdBy" DROP NOT NULL`
    ).catch(() => {
      console.log('folders table or createdBy column does not exist, skipping...');
    });

    console.log('✅ Successfully made user references nullable for safe deletion');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Reverting these changes could cause issues if there are null values
    // We'll set a placeholder UUID for null values before making them NOT NULL again
    
    const placeholderUserId = '00000000-0000-0000-0000-000000000000';
    
    // Revert zoom_meetings
    await queryRunner.query(
      `UPDATE "zoom_meetings" SET "createdById" = $1 WHERE "createdById" IS NULL`,
      [placeholderUserId]
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" ALTER COLUMN "createdById" SET NOT NULL`
    );

    // Revert other tables (with error handling)
    await queryRunner.query(
      `UPDATE "announcement_meetings" SET "createdById" = $1 WHERE "createdById" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "announcement_meetings" ALTER COLUMN "createdById" SET NOT NULL`
    ).catch(() => {});

    await queryRunner.query(
      `UPDATE "attendance" SET "markedBy" = $1 WHERE "markedBy" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "markedBy" SET NOT NULL`
    ).catch(() => {});

    await queryRunner.query(
      `UPDATE "announcement_posts" SET "authorId" = $1 WHERE "authorId" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "announcement_posts" ALTER COLUMN "authorId" SET NOT NULL`
    ).catch(() => {});

    await queryRunner.query(
      `UPDATE "files" SET "uploadedBy" = $1 WHERE "uploadedBy" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "uploadedBy" SET NOT NULL`
    ).catch(() => {});

    await queryRunner.query(
      `UPDATE "posts" SET "authorId" = $1 WHERE "authorId" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "authorId" SET NOT NULL`
    ).catch(() => {});

    await queryRunner.query(
      `UPDATE "assignments" SET "createdBy" = $1 WHERE "createdBy" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "assignments" ALTER COLUMN "createdBy" SET NOT NULL`
    ).catch(() => {});

    await queryRunner.query(
      `UPDATE "folders" SET "createdBy" = $1 WHERE "createdBy" IS NULL`,
      [placeholderUserId]
    ).catch(() => {});
    await queryRunner.query(
      `ALTER TABLE "folders" ALTER COLUMN "createdBy" SET NOT NULL`
    ).catch(() => {});

    console.log('⚠️  Reverted user references to NOT NULL (with placeholder values)');
  }
}

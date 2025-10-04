import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatorTimezoneToAnnouncementPosts1759338000000 implements MigrationInterface {
    name = 'AddCreatorTimezoneToAnnouncementPosts1759338000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add creatorTimezone column to announcement_posts table
        await queryRunner.query(`ALTER TABLE "announcement_posts" ADD "creatorTimezone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove creatorTimezone column from announcement_posts table
        await queryRunner.query(`ALTER TABLE "announcement_posts" DROP COLUMN "creatorTimezone"`);
    }
}

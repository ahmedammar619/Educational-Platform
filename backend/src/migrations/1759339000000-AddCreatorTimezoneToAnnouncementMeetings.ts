import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatorTimezoneToAnnouncementMeetings1759339000000 implements MigrationInterface {
    name = 'AddCreatorTimezoneToAnnouncementMeetings1759339000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add creatorTimezone column to announcement_meetings table
        await queryRunner.query(`ALTER TABLE "announcement_meetings" ADD "creatorTimezone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove creatorTimezone column from announcement_meetings table
        await queryRunner.query(`ALTER TABLE "announcement_meetings" DROP COLUMN "creatorTimezone"`);
    }
}

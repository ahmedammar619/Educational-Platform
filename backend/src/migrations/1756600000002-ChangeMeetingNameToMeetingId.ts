import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeMeetingNameToMeetingId1756600000002 implements MigrationInterface {
  name = 'ChangeMeetingNameToMeetingId1756600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if meetingName column exists before dropping it
    const meetingNameColumnExists = await queryRunner.hasColumn('attendance', 'meetingName');
    const meetingIdColumnExists = await queryRunner.hasColumn('attendance', 'meetingId');

    if (meetingNameColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "meetingName"`);
    }

    if (!meetingIdColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN "meetingId" UUID`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before dropping/adding them
    const meetingIdColumnExists = await queryRunner.hasColumn('attendance', 'meetingId');
    const meetingNameColumnExists = await queryRunner.hasColumn('attendance', 'meetingName');

    if (meetingIdColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "meetingId"`);
    }

    if (!meetingNameColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN "meetingName" VARCHAR(255)`);
    }
  }
}

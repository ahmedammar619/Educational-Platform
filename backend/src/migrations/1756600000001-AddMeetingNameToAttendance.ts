import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetingNameToAttendance1756600000001 implements MigrationInterface {
  name = 'AddMeetingNameToAttendance1756600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists before adding it
    const meetingNameColumnExists = await queryRunner.hasColumn('attendance', 'meetingName');

    if (!meetingNameColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN "meetingName" VARCHAR(255)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping it
    const meetingNameColumnExists = await queryRunner.hasColumn('attendance', 'meetingName');

    if (meetingNameColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "meetingName"`);
    }
  }
}

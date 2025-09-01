import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAttendanceTable1756600000000 implements MigrationInterface {
  name = 'UpdateAttendanceTable1756600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    const dayColumnExists = await queryRunner.hasColumn('attendance', 'day');
    const timeColumnExists = await queryRunner.hasColumn('attendance', 'time');

    if (!dayColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN "day" VARCHAR(20)`);
    }

    if (!timeColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN "time" VARCHAR(20)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before dropping them
    const dayColumnExists = await queryRunner.hasColumn('attendance', 'day');
    const timeColumnExists = await queryRunner.hasColumn('attendance', 'time');

    if (dayColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "day"`);
    }

    if (timeColumnExists) {
      await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "time"`);
    }
  }
}

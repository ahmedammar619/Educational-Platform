import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCourseIdToZoomMeetings1757200000000 implements MigrationInterface {
  name = 'AddCourseIdToZoomMeetings1757200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add courseId column to zoom_meetings table
    await queryRunner.addColumn('zoom_meetings', new TableColumn({
      name: 'courseId',
      type: 'uuid',
      isNullable: false,
    }));

    // Add foreign key constraint
    await queryRunner.createForeignKey('zoom_meetings', new TableForeignKey({
      columnNames: ['courseId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'courses',
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    const table = await queryRunner.getTable('zoom_meetings');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('courseId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('zoom_meetings', foreignKey);
    }

    // Remove courseId column
    await queryRunner.dropColumn('zoom_meetings', 'courseId');
  }
}

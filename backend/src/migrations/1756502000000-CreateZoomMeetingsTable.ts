import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateZoomMeetingsTable1756502000000 implements MigrationInterface {
  name = 'CreateZoomMeetingsTable1756502000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'zoom_meetings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'invitationLink',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'time',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'period',
            type: 'varchar',
            length: '2',
            default: "'AM'",
          },
          {
            name: 'joinCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'scheduled'",
          },
          {
            name: 'createdById',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['createdById'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Indexes can be added later if needed for performance
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('zoom_meetings');
  }
}

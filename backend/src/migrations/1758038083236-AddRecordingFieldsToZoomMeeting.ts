import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRecordingFieldsToZoomMeeting1758038083236 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('zoom_meetings', [
            new TableColumn({
                name: 'recordingStatus',
                type: 'varchar',
                length: '50',
                default: "'pending'",
                isNullable: false,
            }),
            new TableColumn({
                name: 'recordingUrl',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'youtubeVideoId',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
            new TableColumn({
                name: 'youtubeUrl',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'recordingCompletedAt',
                type: 'timestamp',
                isNullable: true,
            }),
            new TableColumn({
                name: 'r2RecordingKey',
                type: 'varchar',
                length: '500',
                isNullable: true,
            }),
            new TableColumn({
                name: 'r2RecordingUrl',
                type: 'text',
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('zoom_meetings', [
            'recordingStatus',
            'recordingUrl',
            'youtubeVideoId',
            'youtubeUrl',
            'recordingCompletedAt',
            'r2RecordingKey',
            'r2RecordingUrl',
        ]);
    }

}

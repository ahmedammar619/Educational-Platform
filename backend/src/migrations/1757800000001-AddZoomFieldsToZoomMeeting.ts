import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddZoomFieldsToZoomMeeting1757800000001 implements MigrationInterface {
    name = 'AddZoomFieldsToZoomMeeting1757800000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("zoom_meetings", [
            new TableColumn({
                name: "zoomMeetingId",
                type: "varchar",
                length: "50",
                isNullable: true
            }),
            new TableColumn({
                name: "zoomPassword",
                type: "varchar",
                length: "10",
                isNullable: true
            }),
            new TableColumn({
                name: "zoomStartUrl",
                type: "text",
                isNullable: true
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns("zoom_meetings", [
            "zoomMeetingId",
            "zoomPassword", 
            "zoomStartUrl"
        ]);
    }
}

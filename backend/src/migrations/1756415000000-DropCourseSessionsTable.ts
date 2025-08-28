import { MigrationInterface, QueryRunner } from "typeorm";

export class DropCourseSessionsTable1756415000000 implements MigrationInterface {
    name = 'DropCourseSessionsTable1756415000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the course_sessions table
        await queryRunner.query(`DROP TABLE IF EXISTS "course_sessions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the course_sessions table if needed (for rollback)
        await queryRunner.query(`
            CREATE TABLE "course_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" uuid NOT NULL,
                "day" character varying(20) NOT NULL,
                "startTime" character varying(5) NOT NULL,
                "endTime" character varying(5) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_course_sessions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_b545f86c4f5d8929e124f15e961" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }
}

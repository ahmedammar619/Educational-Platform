import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsTable1757752791146 implements MigrationInterface {
    name = 'CreateNotificationsTable1757752791146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create notification type enum
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('assignment_published', 'assignment_graded', 'zoom_session_published', 'zoom_session_started', 'new_post', 'added_to_class', 'marked_absent', 'child_absent', 'child_added_to_class', 'assignment_submitted', 'added_to_course', 'new_user_joined')`);
        
        // Create notification priority enum
        await queryRunner.query(`CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'medium', "title" character varying(255) NOT NULL, "message" text NOT NULL, "metadata" json, "isRead" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "readAt" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}

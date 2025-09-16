import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormCompletionTracking1758000000002 implements MigrationInterface {
    name = 'AddFormCompletionTracking1758000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "students" 
            ADD COLUMN "registration_form_completed" boolean NOT NULL DEFAULT false
        `);
        
        await queryRunner.query(`
            ALTER TABLE "students" 
            ADD COLUMN "form_completion_date" timestamp
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "students" 
            DROP COLUMN "form_completion_date"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "students" 
            DROP COLUMN "registration_form_completed"
        `);
    }
}

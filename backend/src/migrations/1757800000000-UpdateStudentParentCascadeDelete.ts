import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudentParentCascadeDelete1757800000000 implements MigrationInterface {
    name = 'UpdateStudentParentCascadeDelete1757800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_students_parentId"`);
        
        // Add the new foreign key constraint with CASCADE delete
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_parentId" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the CASCADE foreign key constraint
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_students_parentId"`);
        
        // Add back the original foreign key constraint with SET NULL
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_parentId" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}

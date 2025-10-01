import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProgramsAndUpdateClasses1759337365591 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove programId column from classes table
        await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN IF EXISTS "programId"`);
        
        // Drop the programs table
        await queryRunner.query(`DROP TABLE IF EXISTS "programs"`);
        
        // Remove programIds column from students table
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN IF EXISTS "programIds"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate programs table
        await queryRunner.query(`CREATE TABLE "programs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying(255) NOT NULL,
            "price" numeric(10,2) NOT NULL,
            "classIds" text NOT NULL DEFAULT '',
            "studentIds" text NOT NULL DEFAULT '',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_programs" PRIMARY KEY ("id")
        )`);
        
        // Add programId column back to classes table
        await queryRunner.query(`ALTER TABLE "classes" ADD "programId" uuid`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_classes_program" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Add programIds column back to students table
        await queryRunner.query(`ALTER TABLE "students" ADD "programIds" text NOT NULL DEFAULT ''`);
    }

}

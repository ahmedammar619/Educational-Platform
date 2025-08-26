import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEntitiesToUUID1709123456790 implements MigrationInterface {
  name = 'UpdateEntitiesToUUID1709123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update courses table - check if columns exist before altering
    const coursesColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses'
    `);
    
    const coursesColumnNames = coursesColumns.map(col => col.column_name);
    
    if (coursesColumnNames.includes('id')) {
      const idColumn = coursesColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "courses" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    // Drop columns only if they exist
    const columnsToDrop = ['maxStudents', 'currentStudents', 'isPublished', 'category', 'level', 'location', 'requirements', 'learningOutcomes', 'updatedAt'];
    for (const column of columnsToDrop) {
      if (coursesColumnNames.includes(column)) {
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "${column}"`);
      }
    }

    // Update course_sessions table - check if columns exist before altering
    const courseSessionsColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_sessions'
    `);
    
    const courseSessionsColumnNames = courseSessionsColumns.map(col => col.column_name);
    
    if (courseSessionsColumnNames.includes('id')) {
      const idColumn = courseSessionsColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_sessions" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (courseSessionsColumnNames.includes('courseId')) {
      const courseIdColumn = courseSessionsColumns.find(col => col.column_name === 'courseId');
      if (courseIdColumn && courseIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_sessions" 
          ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
        `);
      }
    }
    
    if (courseSessionsColumnNames.includes('location')) {
      await queryRunner.query(`ALTER TABLE "course_sessions" DROP COLUMN "location"`);
    }

    // Update course_enrollments table
    const courseEnrollmentsColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_enrollments'
    `);
    
    const courseEnrollmentsColumnNames = courseEnrollmentsColumns.map(col => col.column_name);
    
    if (courseEnrollmentsColumnNames.includes('id')) {
      const idColumn = courseEnrollmentsColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_enrollments" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (courseEnrollmentsColumnNames.includes('courseId')) {
      const courseIdColumn = courseEnrollmentsColumns.find(col => col.column_name === 'courseId');
      if (courseIdColumn && courseIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_enrollments" 
          ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
        `);
      }
    }

    // Update course_materials table
    const courseMaterialsColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_materials'
    `);
    
    const courseMaterialsColumnNames = courseMaterialsColumns.map(col => col.column_name);
    
    if (courseMaterialsColumnNames.includes('id')) {
      const idColumn = courseMaterialsColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_materials" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (courseMaterialsColumnNames.includes('courseId')) {
      const courseIdColumn = courseMaterialsColumns.find(col => col.column_name === 'courseId');
      if (courseIdColumn && courseIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_materials" 
          ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
        `);
      }
    }
    
    if (courseMaterialsColumnNames.includes('isPublished')) {
      await queryRunner.query(`ALTER TABLE "course_materials" DROP COLUMN "isPublished"`);
    }

    // Update course_files table
    const courseFilesColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_files'
    `);
    
    const courseFilesColumnNames = courseFilesColumns.map(col => col.column_name);
    
    if (courseFilesColumnNames.includes('id')) {
      const idColumn = courseFilesColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_files" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (courseFilesColumnNames.includes('courseId')) {
      const courseIdColumn = courseFilesColumns.find(col => col.column_name === 'courseId');
      if (courseIdColumn && courseIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_files" 
          ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
        `);
      }
    }

    // Update course_folders table
    const courseFoldersColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_folders'
    `);
    
    const courseFoldersColumnNames = courseFoldersColumns.map(col => col.column_name);
    
    if (courseFoldersColumnNames.includes('id')) {
      const idColumn = courseFoldersColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_folders" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (courseFoldersColumnNames.includes('courseId')) {
      const courseIdColumn = courseFoldersColumns.find(col => col.column_name === 'courseId');
      if (courseIdColumn && courseIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_folders" 
          ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
        `);
      }
    }
    
    if (courseFoldersColumnNames.includes('parentFolderId')) {
      const parentFolderIdColumn = courseFoldersColumns.find(col => col.column_name === 'parentFolderId');
      if (parentFolderIdColumn && parentFolderIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_folders" 
          ALTER COLUMN "parentFolderId" TYPE uuid USING parentFolderId::uuid
        `);
      }
    }

    // Update course_schedules table
    const courseSchedulesColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_schedules'
    `);
    
    const courseSchedulesColumnNames = courseSchedulesColumns.map(col => col.column_name);
    
    if (courseSchedulesColumnNames.includes('id')) {
      const idColumn = courseSchedulesColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_schedules" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (courseSchedulesColumnNames.includes('courseId')) {
      const courseIdColumn = courseSchedulesColumns.find(col => col.column_name === 'courseId');
      if (courseIdColumn && courseIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "course_schedules" 
          ALTER COLUMN "courseId" TYPE uuid USING courseId::uuid
        `);
      }
    }
    
    if (courseSchedulesColumnNames.includes('location')) {
      await queryRunner.query(`ALTER TABLE "course_schedules" DROP COLUMN "location"`);
    }

    // Update session_attendance table
    const sessionAttendanceColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session_attendance'
    `);
    
    const sessionAttendanceColumnNames = sessionAttendanceColumns.map(col => col.column_name);
    
    if (sessionAttendanceColumnNames.includes('id')) {
      const idColumn = sessionAttendanceColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "session_attendance" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (sessionAttendanceColumnNames.includes('sessionId')) {
      const sessionIdColumn = sessionAttendanceColumns.find(col => col.column_name === 'sessionId');
      if (sessionIdColumn && sessionIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "session_attendance" 
          ALTER COLUMN "sessionId" TYPE uuid USING sessionId::uuid
        `);
      }
    }

    // Update session_materials table
    const sessionMaterialsColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session_materials'
    `);
    
    const sessionMaterialsColumnNames = sessionMaterialsColumns.map(col => col.column_name);
    
    if (sessionMaterialsColumnNames.includes('id')) {
      const idColumn = sessionMaterialsColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "session_materials" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (sessionMaterialsColumnNames.includes('sessionId')) {
      const sessionIdColumn = sessionMaterialsColumns.find(col => col.column_name === 'sessionId');
      if (sessionIdColumn && sessionIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "session_materials" 
          ALTER COLUMN "sessionId" TYPE uuid USING sessionId::uuid
        `);
      }
    }
    
    if (sessionMaterialsColumnNames.includes('materialId')) {
      const materialIdColumn = sessionMaterialsColumns.find(col => col.column_name === 'materialId');
      if (materialIdColumn && materialIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "session_materials" 
          ALTER COLUMN "materialId" TYPE uuid USING materialId::uuid
        `);
      }
    }

    // Update material_attachments table
    const materialAttachmentsColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'material_attachments'
    `);
    
    const materialAttachmentsColumnNames = materialAttachmentsColumns.map(col => col.column_name);
    
    if (materialAttachmentsColumnNames.includes('id')) {
      const idColumn = materialAttachmentsColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "material_attachments" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }
    
    if (materialAttachmentsColumnNames.includes('materialId')) {
      const materialIdColumn = materialAttachmentsColumns.find(col => col.column_name === 'materialId');
      if (materialIdColumn && materialIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "material_attachments" 
          ALTER COLUMN "materialId" TYPE uuid USING materialId::uuid
        `);
      }
    }
    
    if (materialAttachmentsColumnNames.includes('fileId')) {
      const fileIdColumn = materialAttachmentsColumns.find(col => col.column_name === 'fileId');
      if (fileIdColumn && fileIdColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "material_attachments" 
          ALTER COLUMN "fileId" TYPE uuid USING fileId::uuid
        `);
      }
    }

    // Update parent_children table
    const parentChildrenColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parent_children'
    `);
    
    const parentChildrenColumnNames = parentChildrenColumns.map(col => col.column_name);
    
    if (parentChildrenColumnNames.includes('id')) {
      const idColumn = parentChildrenColumns.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        await queryRunner.query(`
          ALTER TABLE "parent_children" 
          ALTER COLUMN "id" TYPE uuid USING gen_random_uuid(),
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
      }
    }

    // Update users table - drop columns only if they exist
    const usersColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const usersColumnNames = usersColumns.map(col => col.column_name);
    
    const usersColumnsToDrop = ['isActive', 'failedLoginAttempts', 'lockedUntil'];
    for (const column of usersColumnsToDrop) {
      if (usersColumnNames.includes(column)) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "${column}"`);
      }
    }

    // Update foreign key constraints for course-related tables - only if they don't exist
    const constraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'course_sessions' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!constraints.some(c => c.constraint_name === 'FK_course_sessions_course')) {
      await queryRunner.query(`
        ALTER TABLE "course_sessions" 
        ADD CONSTRAINT "FK_course_sessions_course" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      `);
    }

    const enrollmentsConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'course_enrollments' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!enrollmentsConstraints.some(c => c.constraint_name === 'FK_course_enrollments_course')) {
      await queryRunner.query(`
        ALTER TABLE "course_enrollments" 
        ADD CONSTRAINT "FK_course_enrollments_course" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      `);
    }

    const materialsConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'course_materials' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!materialsConstraints.some(c => c.constraint_name === 'FK_course_materials_course')) {
      await queryRunner.query(`
        ALTER TABLE "course_materials" 
        ADD CONSTRAINT "FK_course_materials_course" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      `);
    }

    const filesConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'course_files' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!filesConstraints.some(c => c.constraint_name === 'FK_course_files_course')) {
      await queryRunner.query(`
        ALTER TABLE "course_files" 
        ADD CONSTRAINT "FK_course_files_course" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      `);
    }

    const foldersConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'course_folders' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!foldersConstraints.some(c => c.constraint_name === 'FK_course_folders_course')) {
      await queryRunner.query(`
        ALTER TABLE "course_folders" 
        ADD CONSTRAINT "FK_course_folders_course" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      `);
    }

    const schedulesConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'course_schedules' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!schedulesConstraints.some(c => c.constraint_name === 'FK_course_schedules_course')) {
      await queryRunner.query(`
        ALTER TABLE "course_schedules" 
        ADD CONSTRAINT "FK_course_schedules_course" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      `);
    }

    const attendanceConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'session_attendance' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!attendanceConstraints.some(c => c.constraint_name === 'FK_session_attendance_session')) {
      await queryRunner.query(`
        ALTER TABLE "session_attendance" 
        ADD CONSTRAINT "FK_session_attendance_session" 
        FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE
      `);
    }

    const sessionMaterialsConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'session_materials' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!sessionMaterialsConstraints.some(c => c.constraint_name === 'FK_session_materials_session')) {
      await queryRunner.query(`
        ALTER TABLE "session_materials" 
        ADD CONSTRAINT "FK_session_materials_session" 
        FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE
      `);
    }

    if (!sessionMaterialsConstraints.some(c => c.constraint_name === 'FK_session_materials_material')) {
      await queryRunner.query(`
        ALTER TABLE "session_materials" 
        ADD CONSTRAINT "FK_session_materials_material" 
        FOREIGN KEY ("materialId") REFERENCES "course_materials"("id") ON DELETE CASCADE
      `);
    }

    const materialAttachmentsConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'material_attachments' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (!materialAttachmentsConstraints.some(c => c.constraint_name === 'FK_material_attachments_material')) {
      await queryRunner.query(`
        ALTER TABLE "material_attachments" 
        ADD CONSTRAINT "FK_material_attachments_material" 
        FOREIGN KEY ("materialId") REFERENCES "course_materials"("id") ON DELETE CASCADE
      `);
    }

    if (!materialAttachmentsConstraints.some(c => c.constraint_name === 'FK_material_attachments_file')) {
      await queryRunner.query(`
        ALTER TABLE "material_attachments" 
        ADD CONSTRAINT "FK_material_attachments_file" 
        FOREIGN KEY ("fileId") REFERENCES "course_files"("id") ON DELETE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert all changes - this is complex and may require manual intervention
    // For now, we'll just log that this migration cannot be easily reverted
    console.log('This migration cannot be easily reverted. Manual intervention required.');
  }
}

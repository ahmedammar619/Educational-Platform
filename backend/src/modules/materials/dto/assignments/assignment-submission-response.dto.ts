import { Expose } from 'class-transformer';

export class AssignmentSubmissionResponseDto {
  @Expose()
  id: string;

  @Expose()
  assignmentId: string;

  @Expose()
  studentId: string;

  @Expose()
  fileName: string;

  @Expose()
  filePath: string;

  @Expose()
  fileSize: number;

  @Expose()
  mimeType: string;

  @Expose()
  submittedAt: Date;

  @Expose()
  grade: number;

  @Expose()
  feedback: string;

  @Expose()
  gradedBy: string;

  @Expose()
  gradedAt: Date;

  // Add student name for display purposes
  @Expose()
  studentName?: string;
}

import { Module, Global } from '@nestjs/common';
import { FileUploadSecurityGuard } from './guards/file-upload-security.guard';
import { FileUploadService } from './services/file-upload.service';
import { AuditLogService } from './services/audit-log.service';

@Global()
@Module({
  providers: [
    FileUploadSecurityGuard,
    FileUploadService,
    AuditLogService,
  ],
  exports: [
    FileUploadSecurityGuard,
    FileUploadService,
    AuditLogService,
  ],
})
export class CommonModule {}

import { Module, Global } from '@nestjs/common';
import { FileUploadSecurityGuard } from './guards/file-upload-security.guard';
import { FileUploadService } from './services/file-upload.service';
import { AuditLogService } from './services/audit-log.service';
import { CountryCodesService } from './services/country-codes.service';
import { CountryCodesController } from './controllers/country-codes.controller';

@Global()
@Module({
  providers: [
    FileUploadSecurityGuard,
    FileUploadService,
    AuditLogService,
    CountryCodesService,
  ],
  controllers: [CountryCodesController],
  exports: [
    FileUploadSecurityGuard,
    FileUploadService,
    AuditLogService,
    CountryCodesService,
  ],
})
export class CommonModule {}

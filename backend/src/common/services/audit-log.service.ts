import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface AuditLogEntry {
  timestamp: Date;
  userId: number;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string | number;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  success: boolean;
  errorMessage?: string;
}

export interface SecurityEvent {
  timestamp: Date;
  eventType: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'role_change' | 'file_upload' | 'file_download' | 'data_access' | 'data_modification' | 'suspicious_activity';
  userId?: number;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly isProduction: boolean;
  private readonly logToFile: boolean;
  private readonly logToDatabase: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.logToFile = this.configService.get('AUDIT_LOG_TO_FILE', 'true') === 'true';
    this.logToDatabase = this.configService.get('AUDIT_LOG_TO_DB', 'true') === 'true';
  }

  // ================= User Activity Logging =================

  logUserLogin(request: Request, userId: number, userEmail: string, userRole: string, success: boolean, details?: Record<string, any>): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      resource: 'AUTH',
      details: {
        ...details,
        loginMethod: 'email_password',
        success,
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success,
    };

    this.logAuditEntry(entry);
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: success ? 'login_success' : 'login_failure',
      userId: success ? userId : undefined,
      userEmail,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: entry.details,
      severity: success ? 'low' : 'medium',
    });
  }

  logUserLogout(request: Request, userId: number, userEmail: string, userRole: string): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action: 'LOGOUT',
      resource: 'AUTH',
      details: {
        logoutMethod: 'user_initiated',
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success: true,
    };

    this.logAuditEntry(entry);
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: 'logout',
      userId,
      userEmail,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: entry.details,
      severity: 'low',
    });
  }

  logPasswordChange(request: Request, userId: number, userEmail: string, userRole: string, success: boolean): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action: 'PASSWORD_CHANGE',
      resource: 'USER_PROFILE',
      details: {
        changeMethod: 'user_initiated',
        success,
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success,
    };

    this.logAuditEntry(entry);
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: 'password_change',
      userId,
      userEmail,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: entry.details,
      severity: 'high',
    });
  }

  logRoleChange(request: Request, adminUserId: number, adminEmail: string, targetUserId: number, targetEmail: string, oldRole: string, newRole: string): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId: adminUserId,
      userEmail: adminEmail,
      userRole: 'admin',
      action: 'ROLE_CHANGE',
      resource: 'USER_MANAGEMENT',
      resourceId: targetUserId,
      details: {
        targetUserId,
        targetEmail,
        oldRole,
        newRole,
        changeMethod: 'admin_action',
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success: true,
    };

    this.logAuditEntry(entry);
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: 'role_change',
      userId: adminUserId,
      userEmail: adminEmail,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: entry.details,
      severity: 'high',
    });
  }

  // ================= Data Access Logging =================

  logDataAccess(request: Request, userId: number, userEmail: string, userRole: string, resource: string, resourceId?: string | number, details?: Record<string, any>): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action: 'DATA_ACCESS',
      resource,
      resourceId,
      details: {
        accessMethod: 'api',
        ...details,
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success: true,
    };

    this.logAuditEntry(entry);
  }

  logDataModification(request: Request, userId: number, userEmail: string, userRole: string, action: string, resource: string, resourceId?: string | number, details?: Record<string, any>): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action,
      resource,
      resourceId,
      details: {
        modificationType: action,
        ...details,
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success: true,
    };

    this.logAuditEntry(entry);
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: 'data_modification',
      userId,
      userEmail,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: entry.details,
      severity: 'medium',
    });
  }

  // ================= File Operation Logging =================

  logFileUpload(request: Request, userId: number, userEmail: string, userRole: string, fileName: string, fileSize: number, courseId?: number): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action: 'FILE_UPLOAD',
      resource: 'FILE_SYSTEM',
      resourceId: fileName,
      details: {
        fileName,
        fileSize,
        courseId,
        uploadMethod: 'api',
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success: true,
    };

    this.logAuditEntry(entry);
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: 'file_upload',
      userId,
      userEmail,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: entry.details,
      severity: 'medium',
    });
  }

  logFileDownload(request: Request, userId: number, userEmail: string, userRole: string, fileName: string, courseId?: number): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action: 'FILE_DOWNLOAD',
      resource: 'FILE_SYSTEM',
      resourceId: fileName,
      details: {
        fileName,
        courseId,
        downloadMethod: 'api',
      },
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      requestId: this.getRequestId(request),
      success: true,
    };

    this.logAuditEntry(entry);
  }

  // ================= Suspicious Activity Logging =================

  logSuspiciousActivity(request: Request, activity: string, details: Record<string, any>, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.logSecurityEvent({
      timestamp: new Date(),
      eventType: 'suspicious_activity',
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details: {
        activity,
        ...details,
      },
      severity,
    });

    // Log to console for immediate attention
    this.logger.warn(`Suspicious activity detected: ${activity}`, {
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      details,
      severity,
    });
  }

  // ================= Private Methods =================

  private logAuditEntry(entry: AuditLogEntry): void {
    // Log to console
    this.logger.log(`AUDIT: ${entry.action} by ${entry.userEmail} (${entry.userRole})`, entry);

    // Log to file if enabled
    if (this.logToFile) {
      this.logToFileSystem(entry);
    }

    // Log to database if enabled
    if (this.logToDatabase) {
      this.logToDatabaseSystem(entry);
    }
  }

  private logSecurityEvent(event: SecurityEvent): void {
    // Log to console
    this.logger.log(`SECURITY: ${event.eventType} - ${event.severity}`, event);

    // Log to file if enabled
    if (this.logToFile) {
      this.logSecurityToFile(event);
    }

    // Log to database if enabled
    if (this.logToDatabase) {
      this.logSecurityToDatabase(event);
    }
  }

  private logToFileSystem(entry: AuditLogEntry): void {
    // In production, implement file logging with rotation
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    };
    
    // For now, just log to console
    console.log('AUDIT_FILE_LOG:', JSON.stringify(logEntry));
  }

  private logToDatabaseSystem(entry: AuditLogEntry): void {
    // In production, implement database logging
    // For now, just log to console
    console.log('AUDIT_DB_LOG:', JSON.stringify(entry));
  }

  private logSecurityToFile(event: SecurityEvent): void {
    // In production, implement security event file logging
    const logEntry = {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
    
    console.log('SECURITY_FILE_LOG:', JSON.stringify(logEntry));
  }

  private logSecurityToDatabase(event: SecurityEvent): void {
    // In production, implement security event database logging
    console.log('SECURITY_DB_LOG:', JSON.stringify(event));
  }

  private getClientIp(request: Request): string {
    const ip = request.ip ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'];

    // Handle case where IP might be an array (multiple proxies)
    if (Array.isArray(ip)) {
      return ip[0] || 'unknown';
    }

    return ip || 'unknown';
  }

  private getRequestId(request: Request): string {
    return (request as any).id || 'unknown';
  }
}

import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, validateSync, IsEnum, IsUrl, IsPort, Min, Max } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  // Database Configuration
  @IsString()
  DB_HOST: string;

  @IsPort()
  DB_PORT: string;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsOptional()
  @IsBoolean()
  DB_SYNC?: boolean;

  @IsOptional()
  @IsBoolean()
  DB_LOGGING?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  DB_POOL_MAX?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  DB_POOL_MIN?: number;

  // JWT Configuration
  @IsString()
  @Min(32)
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_ISSUER?: string;

  @IsOptional()
  @IsString()
  JWT_AUDIENCE?: string;

  // Security Configuration
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ALLOWED_ORIGINS?: string[];

  @IsOptional()
  @IsBoolean()
  CORS_CREDENTIALS?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  SESSION_SECRET?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  SESSION_MAX_AGE?: number;

  // File Upload Configuration
  @IsOptional()
  @IsString()
  UPLOAD_DIR?: string;

  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(1073741824) // 1GB
  MAX_FILE_SIZE?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ALLOWED_EXTENSIONS?: string[];

  @IsOptional()
  @IsBoolean()
  ENABLE_FILE_SCANNING?: boolean;

  // Rate Limiting
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(3600000)
  RATE_LIMIT_TTL?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  RATE_LIMIT_LIMIT?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(3600000)
  RATE_LIMIT_AUTH_TTL?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  RATE_LIMIT_AUTH_LIMIT?: number;

  // Audit Logging
  @IsOptional()
  @IsBoolean()
  AUDIT_LOG_TO_FILE?: boolean;

  @IsOptional()
  @IsBoolean()
  AUDIT_LOG_TO_DB?: boolean;

  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL?: LogLevel;

  @IsOptional()
  @IsString()
  LOG_FILE_PATH?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  LOG_MAX_SIZE?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  LOG_MAX_DAYS?: number;

  // SSL Configuration
  @IsOptional()
  @IsBoolean()
  SSL_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  SSL_CERT_PATH?: string;

  @IsOptional()
  @IsString()
  SSL_KEY_PATH?: string;

  @IsOptional()
  @IsString()
  SSL_CA_PATH?: string;

  // Redis Configuration (for session management)
  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsPort()
  REDIS_PORT?: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  REDIS_DB?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(300000)
  REDIS_CONNECT_TIMEOUT?: number;

  // Email Configuration
  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsPort()
  SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsBoolean()
  SMTP_SECURE?: boolean;

  @IsOptional()
  @IsString()
  FROM_EMAIL?: string;

  @IsOptional()
  @IsString()
  FROM_NAME?: string;

  // Monitoring & Health Checks
  @IsOptional()
  @IsBoolean()
  ENABLE_HEALTH_CHECKS?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  HEALTH_CHECK_INTERVAL?: number;

  @IsOptional()
  @IsString()
  METRICS_ENDPOINT?: string;

  // Backup & Recovery
  @IsOptional()
  @IsBoolean()
  ENABLE_AUTO_BACKUP?: boolean;

  @IsOptional()
  @IsString()
  BACKUP_SCHEDULE?: string;

  @IsOptional()
  @IsString()
  BACKUP_RETENTION_DAYS?: string;

  @IsOptional()
  @IsString()
  BACKUP_STORAGE_PATH?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars = errors.map(error => error.property).join(', ');
    throw new Error(`Missing or invalid environment variables: ${missingVars}`);
  }

  return validatedConfig;
}

export function getRequiredEnvVars(): string[] {
  return [
    'JWT_SECRET',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_USERNAME',
    'DB_DATABASE',
    'NODE_ENV',
    'PORT',
  ];
}

export function getProductionEnvVars(): string[] {
  return [
    ...getRequiredEnvVars(),
    'SSL_CERT_PATH',
    'SSL_KEY_PATH',
    'REDIS_HOST',
    'REDIS_PASSWORD',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
    'FROM_NAME',
  ];
}

export function validateRequiredEnvVars(): void {
  const requiredVars = getRequiredEnvVars();
  const missingVars: string[] = [];

  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

export function validateProductionEnvVars(): void {
  if (process.env.NODE_ENV === 'production') {
    const productionVars = getProductionEnvVars();
    const missingVars: string[] = [];

    for (const envVar of productionVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missingVars.join(', ')}\n` +
        'Production environment requires additional security and performance configurations.'
      );
    }
  }
}

export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
    isStaging: env === 'staging',
  };
}

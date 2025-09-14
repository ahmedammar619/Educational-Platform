import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsBoolean, IsOptional, IsPort, Min, Max, validateSync, IsUrl, IsArray, ValidateNested } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @IsPort()
  PORT: number;

  // Database Configuration
  @IsString()
  DB_HOST: string;

  @IsNumber()
  @IsPort()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsBoolean()
  DB_SYNC: boolean;

  @IsBoolean()
  DB_LOGGING: boolean;

  @IsNumber()
  @Min(1)
  @Max(100)
  DB_POOL_MAX: number;

  @IsNumber()
  @Min(1)
  @Max(50)
  DB_POOL_MIN: number;

  // JWT Configuration
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  @IsString()
  JWT_ISSUER: string;

  @IsString()
  JWT_AUDIENCE: string;

  // Security Configuration
  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  ALLOWED_ORIGINS: string;

  @IsBoolean()
  CORS_CREDENTIALS: boolean;

  @IsString()
  SESSION_SECRET: string;

  @IsNumber()
  SESSION_MAX_AGE: number;

  // File Upload Configuration
  @IsString()
  UPLOAD_DIR: string;

  @IsNumber()
  MAX_FILE_SIZE: number;

  @IsString()
  ALLOWED_EXTENSIONS: string;

  @IsBoolean()
  ENABLE_FILE_SCANNING: boolean;

  // Rate Limiting
  @IsNumber()
  RATE_LIMIT_TTL: number;

  @IsNumber()
  RATE_LIMIT_LIMIT: number;

  @IsNumber()
  RATE_LIMIT_AUTH_TTL: number;

  @IsNumber()
  RATE_LIMIT_AUTH_LIMIT: number;

  // Audit Logging
  @IsBoolean()
  AUDIT_LOG_TO_FILE: boolean;

  @IsBoolean()
  AUDIT_LOG_TO_DB: boolean;

  @IsString()
  LOG_LEVEL: string;

  @IsString()
  LOG_FILE_PATH: string;

  @IsNumber()
  LOG_MAX_SIZE: number;

  @IsNumber()
  LOG_MAX_DAYS: number;

  // SSL Configuration
  @IsBoolean()
  SSL_ENABLED: boolean;

  // Monitoring & Health Checks
  @IsBoolean()
  ENABLE_HEALTH_CHECKS: boolean;

  @IsNumber()
  HEALTH_CHECK_INTERVAL: number;

  @IsString()
  METRICS_ENDPOINT: string;

  // Backup & Recovery
  @IsBoolean()
  ENABLE_AUTO_BACKUP: boolean;

  // Stripe Configuration
  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_RESTRICTED_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_MONTHLY_PRODUCT_ID?: string;

  @IsOptional()
  @IsString()
  STRIPE_MONTHLY_PRICE_ID?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  // Frontend URL (for Stripe redirects)
  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  // Zoom Configuration
  @IsOptional()
  @IsString()
  ZOOM_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  ZOOM_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  ZOOM_CLIENT_SECRET?: string;

  // Notifications Configuration
  @IsOptional()
  @IsBoolean()
  DISABLE_NOTIFICATIONS?: boolean;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  
  const errors = validateSync(validatedConfig, { 
    skipMissingProperties: false,
    forbidNonWhitelisted: true,
    whitelist: true 
  });

  if (errors.length > 0) {
    // In development, log warnings instead of throwing errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Environment validation warnings (development mode):');
      errors.forEach(error => {
        console.warn(`   - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`);
      });
      console.warn('   Continuing with default values...');
      return validatedConfig;
    }
    
    // In production, throw error
    throw new Error(`Environment validation failed: ${errors.map(error => 
      `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`
    ).join('; ')}`);
  }
  
  return validatedConfig;
}

export function validateRequiredEnvVars(): void {
  const requiredVars = [
    'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Missing environment variables in development: ${missingVars.join(', ')}`);
      console.warn('   Using default values for development...');
      return;
    }
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export function validateProductionEnvVars(): void {
  if (process.env.NODE_ENV !== 'production') {
    return; // Skip validation for non-production environments
  }

  const productionVars = [
    'JWT_SECRET', 'SESSION_SECRET', 'ALLOWED_ORIGINS', 'ALLOWED_EXTENSIONS'
  ];

  const missingVars = productionVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingVars.join(', ')}`);
  }
}

export function getRequiredEnvVars(): string[] {
  return [
    'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'
  ];
}

export function getProductionEnvVars(): string[] {
  return [
    'JWT_SECRET', 'SESSION_SECRET', 'ALLOWED_ORIGINS', 'ALLOWED_EXTENSIONS'
  ];
}

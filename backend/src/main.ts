import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { UniqueConstraintFilter } from './common/filters/unique-constraint.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { securityConfig } from './config/security.config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Validate required environment variables
  const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Global prefix
  app.setGlobalPrefix('api');

  // Security Headers
  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(securityConfig.headers.helmet.contentSecurityPolicy));
  app.use(helmet.hsts(securityConfig.headers.helmet.hsts));

  // Enhanced CORS configuration
  const corsConfig = {
    origin: process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173'
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
  };
  
  console.log('🔒 CORS Configuration:', JSON.stringify(corsConfig, null, 2));
  console.log('🌐 Frontend URL from env:', process.env.FRONTEND_URL);
  app.enableCors(corsConfig);

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe(securityConfig.validation),
  );

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter(), new UniqueConstraintFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Educational Platform API')
    .setDescription(`
      Educational Platform API Documentation
      
      ## Authentication
      Most endpoints require JWT authentication. To use protected endpoints:
      1. Register or login to get your JWT token
      2. Click the "Authorize" button at the top
      3. Enter your token in the format: Bearer your-token-here
      
      ## Public Endpoints
      - POST /api/auth/register
      - POST /api/auth/login
      - GET /api/users
      - POST /api/users
      
      All other endpoints require authentication.
    `)
    .setVersion('1.0')
    .addServer(
      `http://localhost:${configService.get('PORT', 3000)}`,
      'Development server'
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('System', 'System information and health checks')
    .addTag('Auth', 'Authentication operations (register, login, profile management)')
    .addTag('Users', 'User management and account operations')
    .addTag('Admin', 'Administrative operations (dashboard, user management)')
    .addTag('Parents', 'Parent-specific operations (signup, child management)')
    .addTag('Students', 'Student profile management')
    .addTag('Teachers', 'Teacher profile management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'Educational Platform API Documentation',
    customCss: `
      /* Hide the topbar logo */
      .swagger-ui .topbar { display: none !important; }

      /* Page background */
      body.swagger-ui { background: #fff; font-family: sans-serif; }

      /* Info section (API title) */
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 24px; font-weight: 600; color: #323232; }
      .swagger-ui .info p { font-size: 14px; color: #666; }

      /* Tag headers */
      .swagger-ui .opblock-tag {
        background: #fff;
        padding: 12px 16px;
        border: 1px solid #e5e5e5;
        font-size: 16px;
        font-weight: 600;
        color: #444;
        margin-top: 10px;
        cursor: pointer;
      }

      /* Operation blocks */
      .swagger-ui .opblock {
        margin: 0 0 10px 0;
        border: 1px solid #e5e5e5;
        border-radius: 0;
        box-shadow: none;
      }

      /* Operation summary */
      .swagger-ui .opblock-summary {
        padding: 10px 16px;
        border: none;
      }

      /* Custom method colors to match the image */
      .swagger-ui .opblock-get    .opblock-summary-method { background: #61affe; color: #fff; }
      .swagger-ui .opblock-post   .opblock-summary-method { background: #49cc90; color: #fff; }
      .swagger-ui .opblock-put    .opblock-summary-method { background: #fca130; color: #fff; }
      .swagger-ui .opblock-delete .opblock-summary-method { background: #f93e3e; color: #fff; }

      /* Path text */
      .swagger-ui .opblock-summary-path {
        font-size: 14px;
        font-weight: 600;
        color: #444;
        padding-left: 10px;
      }

      /* No background tint on hover */
      .swagger-ui .opblock-summary:hover { background: #f8f8f8; }

      /* Remove extra rounded corners */
      .swagger-ui .model-box, 
      .swagger-ui .model-container, 
      .swagger-ui .parameters-container, 
      .swagger-ui .responses-wrapper {
        border-radius: 0;
      }

      /* Buttons */
      .swagger-ui .btn {
        border-radius: 3px;
        font-weight: 500;
        background-color: #49cc90;
        color: #fff;
      }

      /* Authorize button styling */
      .swagger-ui .authorize__btn {
        background-color: #49cc90;
        color: #fff;
        border-radius: 3px;
        font-weight: 500;
      }
    `,
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log('🚀 Educational Platform API Started');
  console.log('📍 Server running on port ' + port);
  console.log('📚 API Documentation: http://localhost:' + port + '/api/docs');
  console.log('🔐 API endpoints: http://localhost:' + port + '/api');
  console.log('─'.repeat(50));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
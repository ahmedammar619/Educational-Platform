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
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  console.log('🚀 Starting Educational Platform API...');
  console.log('🔧 Environment Check:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  PORT:', process.env.PORT);
  console.log('  DB_HOST:', process.env.DB_HOST);
  console.log('  DB_PORT:', process.env.DB_PORT);
  console.log('  DB_DATABASE:', process.env.DB_DATABASE);
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Validate required environment variables
  const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  console.log('✅ All required environment variables are set');

  // Global prefix
  app.setGlobalPrefix('api');

  // Static file serving for uploads (local development only)
  if (process.env.NODE_ENV !== 'production' || !process.env.R2_ACCESS_KEY_ID) {
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });
  }

  // Security Headers
  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(securityConfig.headers.helmet.contentSecurityPolicy));
  app.use(helmet.hsts(securityConfig.headers.helmet.hsts));

  // Enhanced CORS configuration
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];

  // Always include the frontend Railway URL as fallback
  if (!allowedOrigins.includes('https://frontend-production-3cbc.up.railway.app')) {
    allowedOrigins.push('https://frontend-production-3cbc.up.railway.app');
  }

  const corsConfig = {
    origin: allowedOrigins,
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
    .addTag('Classes', 'Class management and student enrollment')
    .addTag('Courses', 'Course and session management')
    .addTag('Materials', 'Posts, files, assignments, and attendance management')
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

      /* Info section (API title) */
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 24px; font-weight: 600; color: #323232; }
      .swagger-ui .info p { font-size: 14px; color: #666; }
    `,
  });

  const port = process.env.PORT || 3000;
  
  console.log('🔧 Environment Debug:');
  console.log('  PORT from env:', process.env.PORT);
  console.log('  PORT used:', port);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  All env vars:', Object.keys(process.env).filter(key => key.includes('PORT') || key.includes('DB') || key.includes('JWT')));
  
  try {
    console.log('🌐 Starting server on port', port, 'with host 0.0.0.0...');
    await app.listen(port, '0.0.0.0');
    console.log('✅ Server started successfully!');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }

  console.log('🚀 Educational Platform API Started');
  console.log('📍 Server running on port ' + port + ' (0.0.0.0)');
  console.log('📚 API Documentation: http://localhost:' + port + '/api/docs');
  console.log('🔐 API endpoints: http://localhost:' + port + '/api');
  console.log('🌐 External access: https://backend-production-ece4.up.railway.app/api');
  console.log('─'.repeat(50));
  
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
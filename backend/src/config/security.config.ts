export const securityConfig = {
  // Rate Limiting
  rateLimit: {
    ttl: 60000, // 1 minute
    limit: 10,  // 10 requests per minute
    authEndpoints: {
      ttl: 300000, // 5 minutes for auth endpoints
      limit: 5,    // 5 attempts per 5 minutes
    },
  },

  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      console.warn('⚠️  Using default JWT secret for development. Change this in production!');
      return 'dev-jwt-secret-change-in-production-at-least-32-characters-long';
    })(),
    expiresIn: '24h', // 24 hours
    refreshExpiresIn: '7d', // 7 days
    issuer: 'educational-platform',
    audience: 'educational-platform-users',
    algorithm: 'HS256',
    clockTolerance: 30, // 30 seconds
  },

  // Session Security
  session: {
    maxConcurrentSessions: 3,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireReauthForSensitive: true,
  },

  // CORS Configuration
  cors: {
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
  },

  // Security Headers
  headers: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },
  },

  // Input Validation
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
    transform: true,
    enableImplicitConversion: true,
  },
};

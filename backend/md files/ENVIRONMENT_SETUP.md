# Environment Configuration Guide

This document provides comprehensive guidance for setting up environment variables for the Educational Platform backend.

## 📋 Quick Start

1. **Copy the appropriate template:**
   ```bash
   # For development
   cp env.development.example .env.development
   
   # For production
   cp env.production.example .env.production
   ```

2. **Fill in your values** in the `.env` file
3. **Start the application**

## 🏗️ Environment Structure

### **Development Environment** (`.env.development`)
- Optimized for local development
- Debug logging enabled
- Database synchronization enabled
- Relaxed security settings
- Local file storage

### **Production Environment** (`.env.production`)
- Production-optimized settings
- Strict security configurations
- Database connection pooling
- SSL/TLS enabled
- Comprehensive logging and monitoring

## 🔧 Configuration Categories

### **1. Basic Configuration**
```bash
NODE_ENV=development|production|test
PORT=3000
```

### **2. Database Configuration**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=education_db
DB_SYNC=true|false
DB_LOGGING=true|false
DB_POOL_MAX=10|20
DB_POOL_MIN=2|5
```

**Database Pool Settings:**
- **Development**: `max=10, min=2` (lighter resource usage)
- **Production**: `max=20, min=5` (better performance under load)

### **3. JWT Configuration**
```bash
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m|7d
JWT_REFRESH_EXPIRES_IN=7d|30d
JWT_ISSUER=educational-platform
JWT_AUDIENCE=educational-platform-users
```

**Security Requirements:**
- `JWT_SECRET` must be at least 32 characters long
- Production should use cryptographically secure secrets

### **4. Security Configuration**
```bash
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400
```

### **5. File Upload Configuration**
```bash
UPLOAD_DIR=./uploads|/var/uploads
MAX_FILE_SIZE=52428800|104857600
ALLOWED_EXTENSIONS=.pdf,.doc,.docx,.jpg,.png,.mp4,.zip
ENABLE_FILE_SCANNING=false|true
```

**File Size Limits:**
- **Development**: 50MB (faster uploads for testing)
- **Production**: 100MB (balanced performance and storage)

### **6. Rate Limiting**
```bash
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=1000|100
RATE_LIMIT_AUTH_TTL=300000
RATE_LIMIT_AUTH_LIMIT=10|5
```

**Rate Limiting Strategy:**
- **General API**: Higher limits for development
- **Authentication**: Stricter limits to prevent brute force

### **7. Audit Logging**
```bash
AUDIT_LOG_TO_FILE=true
AUDIT_LOG_TO_DB=true|false
LOG_LEVEL=debug|info|warn|error
LOG_FILE_PATH=./logs|/var/logs
LOG_MAX_SIZE=50|100
LOG_MAX_DAYS=7|30
```

### **8. SSL Configuration**
```bash
SSL_ENABLED=false|true
SSL_CERT_PATH=/path/to/cert.crt
SSL_KEY_PATH=/path/to/key.key
SSL_CA_PATH=/path/to/ca.crt
```

**SSL Requirements for Production:**
- Valid SSL certificate
- Private key file
- Certificate authority chain (if applicable)

### **9. Redis Configuration**
```bash
REDIS_HOST=localhost|your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_CONNECT_TIMEOUT=10000
```

### **10. Email Configuration**
```bash
SMTP_HOST=smtp.gmail.com|smtp.yourdomain.com
SMTP_PORT=587|465
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_SECURE=true
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Educational Platform
```

### **11. Monitoring & Health Checks**
```bash
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=30000|60000
METRICS_ENDPOINT=/metrics
```

### **12. Backup & Recovery**
```bash
ENABLE_AUTO_BACKUP=false|true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=/var/backups
```

## 🚀 Production Deployment Checklist

### **Required Variables**
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (32+ characters)
- [ ] `DB_PASSWORD` (strong password)
- [ ] `SSL_CERT_PATH` and `SSL_KEY_PATH`
- [ ] `REDIS_HOST` and `REDIS_PASSWORD`
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### **Security Checklist**
- [ ] SSL/TLS enabled
- [ ] Strong JWT secret
- [ ] Database connection pooling configured
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] File scanning enabled
- [ ] CORS properly configured

### **Performance Checklist**
- [ ] Database connection pool optimized
- [ ] File upload limits configured
- [ ] Log rotation enabled
- [ ] Health checks configured
- [ ] Monitoring endpoints enabled

## 🔍 Environment Validation

The application automatically validates environment variables on startup:

```bash
# Missing required variables will cause startup failure
Error: Missing required environment variables: JWT_SECRET, DB_PASSWORD

# Invalid values will be caught
Error: Missing or invalid environment variables: PORT, DB_PORT
```

## 📊 Environment Comparison

| Setting | Development | Production |
|---------|-------------|------------|
| `DB_SYNC` | `true` | `false` |
| `DB_LOGGING` | `true` | `false` |
| `DB_POOL_MAX` | `10` | `20` |
| `MAX_FILE_SIZE` | `50MB` | `100MB` |
| `RATE_LIMIT_LIMIT` | `1000` | `100` |
| `LOG_LEVEL` | `debug` | `info` |
| `SSL_ENABLED` | `false` | `true` |
| `ENABLE_FILE_SCANNING` | `false` | `true` |

## 🛠️ Troubleshooting

### **Common Issues**

1. **Database Connection Failed**
   - Check `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
   - Ensure database is running and accessible

2. **JWT Authentication Failed**
   - Verify `JWT_SECRET` is set and 32+ characters
   - Check `JWT_EXPIRES_IN` format

3. **File Upload Errors**
   - Verify `UPLOAD_DIR` exists and is writable
   - Check `MAX_FILE_SIZE` and `ALLOWED_EXTENSIONS`

4. **CORS Issues**
   - Ensure `CORS_ORIGIN` matches your frontend URL
   - Check `ALLOWED_ORIGINS` includes all necessary domains

### **Validation Errors**

The application provides detailed error messages for missing or invalid environment variables:

```bash
# Example validation error
Error: Missing or invalid environment variables: PORT, DB_PORT
```

## 📚 Additional Resources

- [NestJS Configuration Documentation](https://docs.nestjs.com/techniques/configuration)
- [TypeORM Configuration](https://typeorm.io/#/connection-options)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Production Security Checklist](https://owasp.org/www-project-top-ten/)

## 🆘 Support

If you encounter issues with environment configuration:

1. Check the validation error messages
2. Verify all required variables are set
3. Ensure variable values are in correct format
4. Check file permissions for SSL certificates and upload directories
5. Review the production deployment checklist

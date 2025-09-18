# Educational Platform Backup System

A comprehensive backup and restore solution for the Educational Platform application, supporting database, files, R2 storage, and environment configuration backups.

## 🎯 Features

- **Complete Database Backup**: PostgreSQL database with compression and multiple formats
- **File System Backup**: Uploaded files, assets, and media with organized archiving
- **R2 Storage Backup**: Cloudflare R2 cloud storage synchronization
- **Environment Backup**: Encrypted configuration files with security templates
- **Full System Backup**: Orchestrated backup of all components
- **Intelligent Restore**: Interactive restoration with component selection
- **Security**: Encryption for sensitive data and secure credential handling
- **Monitoring**: Comprehensive reporting and logging

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL client tools (`pg_dump`, `pg_restore`)
- Access to your R2 storage credentials
- Sufficient disk space for backups

### Installation

1. Navigate to the backup directory:
   ```bash
   cd backup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure your environment variables are set in `../backend/.env`

### Basic Usage

#### Create a Full Backup
```bash
npm run backup:full
```

#### Restore from Backup
```bash
npm run restore
```

## 📋 Available Commands

### Backup Commands

```bash
# Complete system backup (recommended)
npm run backup:full

# Individual component backups
npm run backup:database    # Database only
npm run backup:files      # Files and uploads only
npm run backup:r2         # R2 storage only
npm run backup:env        # Environment variables only

# Schedule automatic backups
npm run schedule
```

### Restore Commands

```bash
# Interactive restore process
npm run restore
```

## 🗂️ Backup Components

### 1. Database Backup (`database-backup.js`)
- **What**: PostgreSQL database with all tables and data
- **Format**: Custom format (.backup) and SQL (.sql.gz)
- **Features**: Compression, metadata, integrity verification
- **Location**: `data/database/`

### 2. Files Backup (`files-backup.js`)
- **What**: Uploaded files, public assets, media files
- **Includes**:
  - `backend/uploads/` - User uploaded content
  - `backend/public/` - Public files
  - `frontend/public/` - Frontend assets
  - `frontend/src/assets/` - Source assets
- **Format**: ZIP archives with compression
- **Location**: `data/files/`

### 3. R2 Storage Backup (`r2-backup.js`)
- **What**: All files stored in Cloudflare R2 bucket
- **Features**: Complete synchronization, file categorization
- **Format**: Original files with metadata
- **Location**: `data/r2-storage/`

### 4. Environment Backup (`env-backup.js`)
- **What**: Configuration files and environment variables
- **Security**: AES-256-GCM encryption for sensitive data
- **Includes**: Templates for easy restoration
- **Location**: `data/environment/`

### 5. Full Backup (`full-backup.js`)
- **What**: Orchestrated backup of all components
- **Features**: Manifest creation, comprehensive reporting
- **Output**: Compressed archive with all components
- **Location**: `data/full_backup_[timestamp]/`

## 🔄 Restore Process

The restore system provides an interactive interface to:

1. **Select Backup**: Choose from available backup archives
2. **Review Information**: View backup details and success rates
3. **Choose Components**: Select which parts to restore
4. **Automated Restoration**: Handles proper restore order
5. **Verification**: Generates detailed restore reports

### Restore Order

Components are restored in the following order for dependency management:

1. **Environment Variables** - Configuration first
2. **Database** - Core data structure
3. **Files** - Application assets
4. **R2 Storage** - Cloud storage (independent)

## 📊 Directory Structure

```
backup/
├── scripts/
│   ├── database-backup.js    # Database backup logic
│   ├── files-backup.js       # Files backup logic
│   ├── r2-backup.js          # R2 storage backup logic
│   ├── env-backup.js         # Environment backup logic
│   ├── full-backup.js        # Complete backup orchestration
│   └── restore.js            # Comprehensive restore system
├── data/
│   ├── database/             # Database backups
│   ├── files/                # File system backups
│   ├── r2-storage/           # R2 storage backups
│   ├── environment/          # Environment backups
│   └── full_backup_*/        # Complete backup archives
├── package.json              # Dependencies and scripts
└── README.md                 # This documentation
```

## 🔐 Security Features

### Environment Variable Protection
- **Encryption**: AES-256-GCM encryption for sensitive files
- **Templates**: Safe templates with placeholder values
- **Key Management**: Separate key storage for decryption
- **Security Notices**: Comprehensive security documentation

### Best Practices
- Credentials are never stored in plain text
- Separate encryption keys for each backup
- Template system prevents accidental credential exposure
- Integrity verification with SHA-256 checksums

## ⚙️ Configuration

### Environment Variables Required

The backup system reads configuration from your existing `.env` files:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=education_dev_db

# R2 Storage
R2_BUCKET_NAME=your_bucket
R2_REGION=weur
R2_ENDPOINT=https://your-endpoint.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
```

### Backup Retention

Default retention policy:
- **Database**: 30 days
- **Files**: 30 days
- **R2**: 30 days
- **Environment**: 30 days

Modify retention by editing the cleanup functions in each script.

## 📅 Scheduling Backups

### Manual Scheduling
```bash
npm run schedule -- --cron "0 2 * * *"  # Daily at 2 AM
```

### System Integration

#### Linux/macOS (Crontab)
```bash
# Edit crontab
crontab -e

# Add backup job (daily at 2 AM)
0 2 * * * cd /path/to/backup && npm run backup:full
```

#### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 2 AM)
4. Set action: `npm run backup:full` in backup directory

#### Docker
```dockerfile
# Add to docker-compose.yml
services:
  backup-cron:
    image: node:18
    volumes:
      - ./backup:/app
    working_dir: /app
    command: sh -c "npm install && while true; do npm run backup:full; sleep 86400; done"
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Test database connection
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE -c "SELECT 1;"
```

#### R2 Storage Access Errors
```bash
# Test R2 credentials by running R2 backup with verbose output
npm run backup:r2
```

#### Permission Errors
```bash
# Ensure backup directory is writable
chmod -R 755 backup/data/
```

#### Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Logs and Debugging

Each backup script provides verbose output. For additional debugging:

1. Check the generated manifest files in backup directories
2. Review error messages in console output
3. Examine backup metadata files for detailed information
4. Test individual components before running full backup

## 📈 Monitoring and Alerts

### Backup Verification
- Each backup includes integrity checksums
- Manifest files contain success/failure status
- Detailed reports generated for each operation

### Integration with Monitoring Systems
- JSON metadata files can be parsed by monitoring tools
- Exit codes indicate success/failure for script monitoring
- Log files can be integrated with centralized logging

## 🔄 Recovery Scenarios

### Complete System Recovery
1. Set up new environment
2. Install dependencies
3. Run restore process
4. Follow post-restore verification steps

### Partial Recovery
- Select specific components during restore
- Individual backups can be restored independently
- Environment templates allow selective configuration restore

### Disaster Recovery
- Store backups in multiple locations
- Test restore procedures regularly
- Document recovery time objectives (RTO)
- Maintain offline backup copies

## 📞 Support

### Getting Help
1. Check this documentation
2. Review error messages and logs
3. Verify environment configuration
4. Test individual components

### Reporting Issues
When reporting issues, include:
- Error messages and logs
- Environment configuration (without sensitive data)
- Backup manifest files
- System information (OS, Node.js version)

## 🚧 Maintenance

### Regular Tasks
- Test restore procedures monthly
- Monitor backup sizes and adjust retention
- Update credentials and rotate encryption keys
- Review and update backup schedules

### Updates
- Keep dependencies updated
- Review security best practices
- Test new features in development environment
- Update documentation as needed

---

**⚠️ Important**: Always test your backup and restore procedures in a development environment before relying on them in production.

**🔒 Security**: This system handles sensitive data. Follow security best practices and keep your environment secure.

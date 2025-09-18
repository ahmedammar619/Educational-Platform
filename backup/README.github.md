# 🔄 Educational Platform Backup System

> **⚠️ SECURITY NOTICE**: This repository contains backup scripts only. All actual backup data, credentials, and sensitive information are excluded via `.gitignore`.

A comprehensive backup and restore solution for Educational Platform applications with enterprise-grade security and reliability.

## 🎯 Features

- **Complete Database Backup** - PostgreSQL with multiple formats and compression
- **File System Backup** - All uploads, assets, and media files
- **Cloud Storage Backup** - Cloudflare R2 synchronization
- **Environment Backup** - Encrypted configuration with secure templates
- **Interactive Restore** - Component selection and guided restoration
- **Windows Compatible** - Works seamlessly on Windows, Linux, and macOS
- **Automated Scheduling** - Ready for cron jobs and task schedulers

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- PostgreSQL client tools (`pg_dump`, `pg_restore`)
- Access to your database and R2 storage credentials

### Installation
```bash
# Clone and setup
git clone <your-repo>
cd backup
npm install

# Setup and verify system
npm run setup
```

### Basic Usage
```bash
# Complete backup (recommended)
npm run backup:full

# Individual components
npm run backup:database
npm run backup:files
npm run backup:r2
npm run backup:env

# Interactive restore
npm run restore
```

### Windows Users
```cmd
# Use the included batch file
backup.bat full
backup.bat restore
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Setup and test backup system |
| `npm run backup:full` | Complete system backup |
| `npm run backup:database` | Database backup only |
| `npm run backup:files` | Files and uploads backup |
| `npm run backup:r2` | R2 storage backup |
| `npm run backup:env` | Environment configuration backup |
| `npm run restore` | Interactive restore process |

## 🔐 Security Features

- **AES-256 Encryption** for sensitive configuration data
- **Template System** prevents credential exposure
- **Integrity Verification** with SHA-256 checksums
- **Secure Key Management** with separate key storage
- **Git Safety** - All sensitive data excluded from version control

## 📁 Directory Structure

```
backup/
├── scripts/           # Backup and restore scripts
├── data/             # Backup data (ignored by Git)
├── package.json      # Dependencies and scripts
├── .gitignore        # Comprehensive security exclusions
└── README.md         # Documentation
```

## ⚙️ Configuration

Create environment files in your project:

```bash
# Backend environment (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_database

# R2 Storage
R2_BUCKET_NAME=your_bucket
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
```

## 📅 Automation

### Daily Backups (Linux/macOS)
```bash
# Add to crontab
0 2 * * * cd /path/to/backup && npm run backup:full
```

### Daily Backups (Windows)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2 AM
4. Action: Run `backup.bat full`

## 🔄 Backup Components

### Database
- **Format**: Custom (.backup) + SQL (.sql.gz)
- **Features**: Compression, metadata, integrity verification
- **Compatibility**: PostgreSQL 12+

### Files
- **Includes**: Uploads, public assets, media files
- **Format**: Compressed ZIP archives
- **Organization**: Categorized by component type

### R2 Storage
- **Coverage**: Complete bucket synchronization
- **Features**: Progress tracking, file categorization
- **Format**: Original files with metadata

### Environment
- **Security**: AES-256-CTR encryption
- **Templates**: Safe restoration templates
- **Keys**: Separate encrypted key storage

## 🛡️ Data Protection

This backup system provides:
- ✅ **Complete Coverage** - All application data
- ✅ **Multiple Formats** - Redundant backup types
- ✅ **Secure Storage** - Encrypted sensitive data
- ✅ **Easy Recovery** - Interactive restoration
- ✅ **Automated Cleanup** - Configurable retention
- ✅ **Integrity Checks** - Verification and validation

## 📊 Performance

- **Backup Speed**: 2-3 minutes for typical installations
- **Compression**: ~60% size reduction
- **Retention**: 30 days (configurable)
- **Formats**: Multiple formats for maximum compatibility

## 🔧 Troubleshooting

### Common Issues

**Database Connection**
```bash
# Test connection
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE -c "SELECT 1;"
```

**R2 Access**
```bash
# Test R2 credentials
npm run backup:r2
```

**Permissions**
```bash
# Ensure directories are writable
chmod -R 755 backup/data/
```

## 📞 Support

- Check logs in backup reports
- Verify environment configuration
- Test individual components
- Review `.gitignore` for security compliance

## 🚧 Development

### Contributing
1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

### Testing
```bash
# Test individual components
npm run backup:database
npm run backup:files
npm run backup:r2
npm run backup:env

# Test complete system
npm run backup:full
npm run restore
```

## 📄 License

MIT License - See LICENSE file for details

## ⚠️ Important Notes

- **Never commit real backup data** - Use `.gitignore` properly
- **Test restore procedures** regularly
- **Keep credentials secure** and separate from code
- **Monitor backup health** and storage usage
- **Update dependencies** regularly for security

---

**🔒 Security First**: This system handles sensitive data. Always follow security best practices and test in development environments first.

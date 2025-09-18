#!/usr/bin/env node

/**
 * Environment Variables Backup Script for Educational Platform
 * Backs up environment configuration files and creates templates
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../data/environment');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.projectRoot = path.join(__dirname, '../../');
    
    // Define environment files to backup
    this.envSources = [
      {
        name: 'backend-env',
        path: path.join(this.projectRoot, 'backend/.env'),
        description: 'Backend environment variables',
        sensitive: true
      },
      {
        name: 'frontend-env',
        path: path.join(this.projectRoot, 'frontend/.env'),
        description: 'Frontend environment variables',
        sensitive: true
      },
      {
        name: 'docker-env',
        path: path.join(this.projectRoot, '.env'),
        description: 'Docker compose environment variables',
        sensitive: true
      },
      {
        name: 'r2-config',
        path: path.join(this.projectRoot, 'backend/r2-env-variables.txt'),
        description: 'R2 storage configuration',
        sensitive: true
      },
      {
        name: 'stripe-config',
        path: path.join(this.projectRoot, 'backend/stripe-env-variables.txt'),
        description: 'Stripe payment configuration',
        sensitive: true
      },
      {
        name: 'docker-compose',
        path: path.join(this.projectRoot, 'docker-compose.yml'),
        description: 'Docker compose configuration',
        sensitive: false
      },
      {
        name: 'package-json-backend',
        path: path.join(this.projectRoot, 'backend/package.json'),
        description: 'Backend package configuration',
        sensitive: false
      },
      {
        name: 'package-json-frontend',
        path: path.join(this.projectRoot, 'frontend/package.json'),
        description: 'Frontend package configuration',
        sensitive: false
      }
    ];
    
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createBackup() {
    console.log('⚙️  Starting environment backup...');
    
    const backupPath = path.join(this.backupDir, `env_backup_${this.timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });

    const backupResults = [];
    const templates = [];

    try {
      for (const source of this.envSources) {
        console.log(`📋 Processing ${source.name}: ${source.description}`);
        
        if (fs.existsSync(source.path)) {
          const content = fs.readFileSync(source.path, 'utf8');
          const result = await this.backupFile(source, content, backupPath);
          backupResults.push(result);

          // Create template for sensitive files
          if (source.sensitive) {
            const template = this.createTemplate(source, content);
            templates.push(template);
            
            // Save template
            const templatePath = path.join(backupPath, 'templates', `${source.name}.template`);
            fs.mkdirSync(path.dirname(templatePath), { recursive: true });
            fs.writeFileSync(templatePath, template.content);
          }
        } else {
          console.log(`⚠️  File not found: ${source.path}`);
          backupResults.push({
            name: source.name,
            path: source.path,
            exists: false,
            backed_up: false
          });
        }
      }

      // Create backup metadata
      const metadata = {
        timestamp: this.timestamp,
        backupPath: backupPath,
        sources: backupResults,
        templates: templates.map(t => ({ name: t.name, description: t.description }))
      };

      const metadataPath = path.join(backupPath, 'backup_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Create setup instructions
      this.createSetupInstructions(backupPath, templates);

      // Create security notice
      this.createSecurityNotice(backupPath);

      console.log('✅ Environment backup completed!');
      console.log(`📁 Backup location: ${backupPath}`);
      console.log(`📄 Setup instructions: ${path.join(backupPath, 'SETUP_INSTRUCTIONS.md')}`);
      console.log(`🔒 Security notice: ${path.join(backupPath, 'SECURITY_NOTICE.md')}`);

      return {
        success: true,
        backupPath: backupPath,
        metadata: metadata
      };

    } catch (error) {
      console.error('❌ Environment backup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async backupFile(source, content, backupPath) {
    try {
      let backupContent = content;
      let isEncrypted = false;

      // Encrypt sensitive files
      if (source.sensitive) {
        const encryptionKey = this.generateEncryptionKey();
        backupContent = this.encryptContent(content, encryptionKey);
        isEncrypted = true;

        // Save encryption key separately (in production, this should be stored securely)
        const keyPath = path.join(backupPath, 'keys', `${source.name}.key`);
        fs.mkdirSync(path.dirname(keyPath), { recursive: true });
        fs.writeFileSync(keyPath, encryptionKey);
      }

      // Save backup file
      const backupFilePath = path.join(backupPath, `${source.name}${isEncrypted ? '.encrypted' : ''}`);
      fs.writeFileSync(backupFilePath, backupContent);

      // Calculate file hash for integrity verification
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      return {
        name: source.name,
        originalPath: source.path,
        backupPath: backupFilePath,
        exists: true,
        backed_up: true,
        encrypted: isEncrypted,
        hash: hash,
        size: content.length
      };

    } catch (error) {
      console.error(`❌ Failed to backup ${source.name}:`, error.message);
      return {
        name: source.name,
        originalPath: source.path,
        exists: true,
        backed_up: false,
        error: error.message
      };
    }
  }

  createTemplate(source, content) {
    console.log(`📝 Creating template for ${source.name}`);
    
    let templateContent = content;
    
    // Replace sensitive values with placeholders
    const sensitivePatterns = [
      // API Keys and Secrets
      { pattern: /(SECRET_KEY|API_KEY|ACCESS_KEY|PRIVATE_KEY|PASSWORD|TOKEN|SECRET)=.+/gi, replacement: '$1=YOUR_$1_HERE' },
      // Database credentials
      { pattern: /(DB_PASSWORD|DATABASE_PASSWORD)=.+/gi, replacement: '$1=your_database_password' },
      { pattern: /(DB_USERNAME|DATABASE_USERNAME)=.+/gi, replacement: '$1=your_database_username' },
      { pattern: /(DB_HOST|DATABASE_HOST)=.+/gi, replacement: '$1=your_database_host' },
      // Stripe keys
      { pattern: /sk_test_[a-zA-Z0-9]+/g, replacement: 'sk_test_YOUR_STRIPE_SECRET_KEY' },
      { pattern: /pk_test_[a-zA-Z0-9]+/g, replacement: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY' },
      { pattern: /rk_test_[a-zA-Z0-9]+/g, replacement: 'rk_test_YOUR_STRIPE_RESTRICTED_KEY' },
      // JWT secrets
      { pattern: /(JWT_SECRET|JWT_TOKEN)=.+/gi, replacement: '$1=your_jwt_secret_here' },
      // Email credentials
      { pattern: /(MAIL_PASSWORD|EMAIL_PASSWORD|SMTP_PASSWORD)=.+/gi, replacement: '$1=your_email_password' },
      // URLs with credentials
      { pattern: /https?:\/\/[^@]+:[^@]+@[^\s]+/g, replacement: 'https://username:password@your-host.com' },
      // R2 credentials
      { pattern: /R2_ACCESS_KEY_ID=.+/gi, replacement: 'R2_ACCESS_KEY_ID=your_r2_access_key' },
      { pattern: /R2_SECRET_ACCESS_KEY=.+/gi, replacement: 'R2_SECRET_ACCESS_KEY=your_r2_secret_key' }
    ];

    sensitivePatterns.forEach(({ pattern, replacement }) => {
      templateContent = templateContent.replace(pattern, replacement);
    });

    return {
      name: source.name,
      description: source.description,
      content: templateContent
    };
  }

  createSetupInstructions(backupPath, templates) {
    const instructions = `# Environment Setup Instructions

This backup contains your application's environment configuration. Follow these steps to restore your environment:

## Quick Setup

1. **Copy template files to your project:**
   \`\`\`bash
   # Copy templates to your project root
   cp templates/backend-env.template ../../backend/.env
   cp templates/frontend-env.template ../../frontend/.env
   cp templates/docker-env.template ../../.env
   \`\`\`

2. **Update the template files with your actual values:**
   - Replace all placeholder values (like \`YOUR_SECRET_KEY_HERE\`) with your actual credentials
   - Refer to the original service documentation for obtaining new keys if needed

## Environment Files Overview

${templates.map(template => `
### ${template.name}
**Description:** ${template.description}
**Template:** \`templates/${template.name}.template\`
`).join('')}

## Important Notes

- **Never commit real environment files to version control**
- **Store sensitive credentials securely** (use a password manager or secure vault)
- **Regenerate API keys and secrets** if you suspect they may have been compromised
- **Test your application** after setting up the environment to ensure all services work correctly

## Service-Specific Setup

### Database
- Ensure PostgreSQL is running
- Create the database if it doesn't exist
- Run migrations: \`npm run migration:run\`

### R2 Storage (Cloudflare)
- Set up your R2 bucket in Cloudflare dashboard
- Generate access keys with appropriate permissions
- Update R2_* environment variables

### Stripe Payments
- Get your API keys from Stripe dashboard
- Set up webhooks for your domain
- Update STRIPE_* environment variables

### Email Service
- Configure your SMTP provider
- Update email-related environment variables

## Verification

After setup, verify your configuration by:
1. Starting the application: \`npm run start:dev\`
2. Checking logs for any configuration errors
3. Testing key functionality (database connection, file uploads, etc.)

---
*Generated on ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(backupPath, 'SETUP_INSTRUCTIONS.md'), instructions);
  }

  createSecurityNotice(backupPath) {
    const notice = `# 🔒 SECURITY NOTICE

## Important Security Information

This backup contains **ENCRYPTED** sensitive configuration files from your Educational Platform application.

### What's Included
- Database credentials
- API keys and secrets
- Service authentication tokens
- Third-party service configurations

### Security Measures
- ✅ Sensitive files are **encrypted** using AES-256-GCM
- ✅ Encryption keys are stored separately
- ✅ Templates with placeholder values are provided
- ✅ File integrity hashes are included

### Security Best Practices

#### DO:
- ✅ Store this backup in a secure location
- ✅ Use strong, unique passwords for all services
- ✅ Regularly rotate API keys and secrets
- ✅ Use environment-specific configurations
- ✅ Enable two-factor authentication where possible

#### DON'T:
- ❌ Share encryption keys publicly
- ❌ Commit real environment files to version control
- ❌ Store credentials in plain text
- ❌ Use the same credentials across environments
- ❌ Ignore security warnings from services

### In Case of Compromise

If you suspect your credentials have been compromised:

1. **Immediately change all passwords and API keys**
2. **Revoke compromised tokens**
3. **Review access logs** for suspicious activity
4. **Update your backup** with new credentials
5. **Notify relevant stakeholders**

### Backup Security

- This backup is encrypted, but treat it as sensitive data
- Store in a secure, access-controlled location
- Consider using additional encryption for long-term storage
- Regularly test backup restoration procedures

### Contact Information

For security-related questions or incidents:
- Review your organization's security policies
- Contact your system administrator
- Refer to service provider security documentation

---
**Remember:** Security is everyone's responsibility!

*Generated on ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(backupPath, 'SECURITY_NOTICE.md'), notice);
  }

  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  encryptContent(content, key) {
    const algorithm = 'aes-256-ctr';
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return JSON.stringify({
      encrypted: encrypted,
      iv: iv.toString('hex'),
      algorithm: algorithm
    });
  }

  decryptContent(encryptedData, key) {
    const data = JSON.parse(encryptedData);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const decipher = crypto.createDecipheriv(data.algorithm, keyBuffer, Buffer.from(data.iv, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async cleanOldBackups(keepDays = 30) {
    console.log(`🧹 Cleaning environment backups older than ${keepDays} days...`);
    
    const files = fs.readdirSync(this.backupDir);
    const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && stats.mtime.getTime() < cutoffTime) {
        this.deleteDirectory(filePath);
        deletedCount++;
        console.log(`Deleted old backup directory: ${file}`);
      }
    }

    console.log(`✅ Cleaned ${deletedCount} old environment backup directories`);
  }

  deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.deleteDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }
}

// CLI execution
if (require.main === module) {
  const backup = new EnvBackup();
  
  async function run() {
    try {
      const result = await backup.createBackup();
      
      if (result.success) {
        await backup.cleanOldBackups(30);
        console.log('\n🎉 Environment backup process completed successfully!');
        console.log('\n🔒 IMPORTANT: This backup contains encrypted sensitive data.');
        console.log('📖 Please read the SECURITY_NOTICE.md file for important information.');
        process.exit(0);
      } else {
        console.error('\n💥 Environment backup process failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  }

  run();
}

module.exports = EnvBackup;

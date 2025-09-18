#!/usr/bin/env node

/**
 * Setup and Test Script for Educational Platform Backup System
 * Verifies environment and tests backup components
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class BackupSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '../');
    this.backupDir = path.join(__dirname, './');
  }

  async runSetup() {
    console.log('🔧 Educational Platform Backup System Setup');
    console.log('=' .repeat(50));

    try {
      // Check environment
      await this.checkEnvironment();
      
      // Check dependencies
      await this.checkDependencies();
      
      // Create directories
      await this.createDirectories();
      
      // Test connections
      await this.testConnections();
      
      // Show usage instructions
      this.showUsageInstructions();

      console.log('\n✅ Setup completed successfully!');
      console.log('🚀 You can now run backups using the npm scripts.');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('\n🔍 Checking environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    console.log(`✅ Node.js version: ${nodeVersion}`);

    // Check for backend .env file
    const backendEnvPath = path.join(this.projectRoot, 'backend/.env');
    if (!fs.existsSync(backendEnvPath)) {
      console.log('⚠️  Backend .env file not found. Some features may not work.');
      console.log('   Create backend/.env with your database and R2 credentials');
    } else {
      console.log('✅ Backend .env file found');
    }

    // Check for required system tools
    await this.checkSystemTool('pg_dump', 'PostgreSQL client tools');
    
    console.log('✅ Environment check completed');
  }

  async checkSystemTool(tool, description) {
    return new Promise((resolve) => {
      exec(`${tool} --version`, (error) => {
        if (error) {
          console.log(`⚠️  ${tool} not found - ${description} may be needed for database backups`);
        } else {
          console.log(`✅ ${tool} available`);
        }
        resolve();
      });
    });
  }

  async checkDependencies() {
    console.log('\n📦 Checking dependencies...');

    const packageJson = JSON.parse(fs.readFileSync(path.join(this.backupDir, 'package.json'), 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});

    let missingCount = 0;

    for (const dep of dependencies) {
      try {
        require.resolve(dep);
        console.log(`✅ ${dep}`);
      } catch (error) {
        console.log(`❌ ${dep} - missing`);
        missingCount++;
      }
    }

    if (missingCount > 0) {
      console.log(`\n⚠️  ${missingCount} dependencies missing. Run 'npm install' to install them.`);
    } else {
      console.log('✅ All dependencies available');
    }
  }

  async createDirectories() {
    console.log('\n📁 Creating backup directories...');

    const directories = [
      'data',
      'data/database',
      'data/files', 
      'data/r2-storage',
      'data/environment'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.backupDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created: ${dir}/`);
      } else {
        console.log(`✅ Exists: ${dir}/`);
      }
    }
  }

  async testConnections() {
    console.log('\n🔌 Testing connections...');

    // Test database connection
    await this.testDatabaseConnection();
    
    // Test R2 connection
    await this.testR2Connection();
  }

  async testDatabaseConnection() {
    try {
      require('dotenv').config({ path: path.join(this.projectRoot, 'backend/.env') });
      
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        username: process.env.DB_USERNAME || 'postgres',
        database: process.env.DB_DATABASE || 'education_dev_db'
      };

      if (!process.env.DB_PASSWORD) {
        console.log('⚠️  Database password not found in environment');
        return;
      }

      console.log(`🔍 Testing database connection to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

      const testCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -c "SELECT 1 as test;" -t`;
      
      await this.executeCommand(testCommand, {
        ...process.env,
        PGPASSWORD: process.env.DB_PASSWORD
      });

      console.log('✅ Database connection successful');
    } catch (error) {
      console.log('⚠️  Database connection failed:', error.message);
      console.log('   Ensure PostgreSQL is running and credentials are correct');
    }
  }

  async testR2Connection() {
    try {
      require('dotenv').config({ path: path.join(this.projectRoot, 'backend/.env') });

      if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        console.log('⚠️  R2 credentials not found in environment');
        return;
      }

      const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

      const s3Client = new S3Client({
        region: process.env.R2_REGION || 'weur',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      console.log(`🔍 Testing R2 connection to bucket: ${process.env.R2_BUCKET_NAME}`);

      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        MaxKeys: 1
      });

      await s3Client.send(command);
      console.log('✅ R2 connection successful');
    } catch (error) {
      console.log('⚠️  R2 connection failed:', error.message);
      console.log('   Check R2 credentials and bucket configuration');
    }
  }

  executeCommand(command, env = process.env) {
    return new Promise((resolve, reject) => {
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  showUsageInstructions() {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 USAGE INSTRUCTIONS');
    console.log('='.repeat(50));

    console.log('\n📋 Available Commands:');
    console.log('  npm run backup:full      - Complete system backup (recommended)');
    console.log('  npm run backup:database  - Database backup only');
    console.log('  npm run backup:files     - Files backup only');
    console.log('  npm run backup:r2        - R2 storage backup only');
    console.log('  npm run backup:env       - Environment backup only');
    console.log('  npm run restore          - Interactive restore process');

    console.log('\n🔄 Quick Start:');
    console.log('  1. Run a full backup:');
    console.log('     npm run backup:full');
    console.log('');
    console.log('  2. To restore later:');
    console.log('     npm run restore');

    console.log('\n📅 Scheduling (Optional):');
    console.log('  - Linux/Mac: Add to crontab');
    console.log('    0 2 * * * cd /path/to/backup && npm run backup:full');
    console.log('  - Windows: Use Task Scheduler');
    console.log('  - Docker: Use cron container');

    console.log('\n🔒 Security Notes:');
    console.log('  - Environment variables are encrypted in backups');
    console.log('  - Store backups in secure locations');
    console.log('  - Test restore procedures regularly');
    console.log('  - Keep backup encryption keys secure');

    console.log('\n📖 Documentation:');
    console.log('  - Full documentation: README.md');
    console.log('  - Backup location: data/ directory');
    console.log('  - Logs and reports included with each backup');
  }

  async runQuickTest() {
    console.log('\n🧪 Running quick test...');
    
    try {
      // Test environment backup (safest to test)
      const EnvBackup = require('./scripts/env-backup.js');
      const envBackup = new EnvBackup();
      
      console.log('Testing environment backup...');
      const result = await envBackup.createBackup();
      
      if (result.success) {
        console.log('✅ Quick test passed! Backup system is working.');
        
        // Clean up test backup
        const fs = require('fs');
        if (fs.existsSync(result.backupPath)) {
          this.deleteDirectory(result.backupPath);
          console.log('🧹 Cleaned up test backup');
        }
      } else {
        console.log('⚠️  Quick test had issues:', result.error);
      }
    } catch (error) {
      console.log('❌ Quick test failed:', error.message);
    }
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
  const setup = new BackupSetup();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    setup.runQuickTest();
  } else {
    setup.runSetup();
  }
}

module.exports = BackupSetup;

#!/usr/bin/env node

/**
 * Comprehensive Restore Script for Educational Platform
 * Restores database, files, R2 storage, and environment from backups
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const readline = require('readline');

class RestoreManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../data');
    this.projectRoot = path.join(__dirname, '../../');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async startRestore() {
    console.log('🔄 Educational Platform Restore Manager');
    console.log('=' .repeat(50));
    
    try {
      // List available backups
      const backups = await this.listAvailableBackups();
      
      if (backups.length === 0) {
        console.log('❌ No backups found in backup directory');
        process.exit(1);
      }

      console.log('\n📋 Available Backups:');
      backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.name} (${backup.date})`);
      });

      // Select backup
      const selectedBackup = await this.selectBackup(backups);
      
      // Load backup manifest
      const manifest = await this.loadBackupManifest(selectedBackup.path);
      
      // Display backup information
      this.displayBackupInfo(manifest);
      
      // Confirm restore
      const confirmed = await this.confirmRestore();
      if (!confirmed) {
        console.log('❌ Restore cancelled by user');
        process.exit(0);
      }

      // Select components to restore
      const components = await this.selectComponents();
      
      // Perform restore
      await this.performRestore(selectedBackup, manifest, components);
      
    } catch (error) {
      console.error('💥 Restore failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async listAvailableBackups() {
    const backups = [];
    
    // Check for full backups
    const fullBackupDirs = fs.readdirSync(this.backupDir)
      .filter(item => item.startsWith('full_backup_'))
      .map(dir => {
        const fullPath = path.join(this.backupDir, dir);
        const stats = fs.statSync(fullPath);
        return {
          name: dir,
          path: fullPath,
          type: 'full',
          date: stats.mtime.toISOString().split('T')[0],
          timestamp: stats.mtime
        };
      });

    // Check for compressed backups
    const compressedBackups = fs.readdirSync(this.backupDir)
      .filter(item => item.endsWith('.zip') && item.includes('full_backup_'))
      .map(file => {
        const fullPath = path.join(this.backupDir, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          type: 'compressed',
          date: stats.mtime.toISOString().split('T')[0],
          timestamp: stats.mtime
        };
      });

    backups.push(...fullBackupDirs, ...compressedBackups);
    
    // Sort by date (newest first)
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  async selectBackup(backups) {
    return new Promise((resolve) => {
      this.rl.question('\n🔍 Select backup to restore (number): ', (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < backups.length) {
          resolve(backups[index]);
        } else {
          console.log('❌ Invalid selection');
          process.exit(1);
        }
      });
    });
  }

  async loadBackupManifest(backupPath) {
    let manifestPath;
    
    if (backupPath.endsWith('.zip')) {
      // For compressed backups, we'd need to extract first
      console.log('📦 Compressed backup detected. Please extract first and run restore on the directory.');
      process.exit(1);
    } else {
      manifestPath = path.join(backupPath, 'BACKUP_MANIFEST.json');
    }

    if (!fs.existsSync(manifestPath)) {
      throw new Error('Backup manifest not found. This may not be a valid backup.');
    }

    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  displayBackupInfo(manifest) {
    console.log('\n📊 Backup Information:');
    console.log(`- Date: ${manifest.created}`);
    console.log(`- Platform: ${manifest.platform.name} v${manifest.platform.version}`);
    console.log(`- Success Rate: ${manifest.backup.summary.successRate}%`);
    console.log(`- Components: ${manifest.backup.summary.successfulComponents}/${manifest.backup.summary.totalComponents} successful`);
    
    if (manifest.backup.errors.length > 0) {
      console.log('\n⚠️  Backup Errors:');
      manifest.backup.errors.forEach(error => console.log(`  - ${error}`));
    }
  }

  async confirmRestore() {
    return new Promise((resolve) => {
      this.rl.question('\n⚠️  This will overwrite existing data. Continue? (yes/no): ', (answer) => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  async selectComponents() {
    console.log('\n🔧 Select components to restore:');
    console.log('1. Environment Variables');
    console.log('2. Database');
    console.log('3. Files');
    console.log('4. R2 Storage');
    console.log('5. All Components');

    return new Promise((resolve) => {
      this.rl.question('Enter component numbers (comma-separated) or 5 for all: ', (answer) => {
        if (answer === '5') {
          resolve(['environment', 'database', 'files', 'r2']);
        } else {
          const numbers = answer.split(',').map(n => parseInt(n.trim()));
          const components = [];
          
          if (numbers.includes(1)) components.push('environment');
          if (numbers.includes(2)) components.push('database');
          if (numbers.includes(3)) components.push('files');
          if (numbers.includes(4)) components.push('r2');
          
          resolve(components);
        }
      });
    });
  }

  async performRestore(backup, manifest, components) {
    console.log('\n🔄 Starting restore process...');
    console.log('Components to restore:', components.join(', '));

    const results = {
      environment: null,
      database: null,
      files: null,
      r2: null
    };

    // Restore in proper order
    const restoreOrder = ['environment', 'database', 'files', 'r2'];
    
    for (const component of restoreOrder) {
      if (components.includes(component)) {
        console.log(`\n📦 Restoring ${component}...`);
        
        try {
          const result = await this.restoreComponent(component, backup.path);
          results[component] = { success: true, ...result };
          console.log(`✅ ${component} restored successfully`);
        } catch (error) {
          results[component] = { success: false, error: error.message };
          console.error(`❌ Failed to restore ${component}: ${error.message}`);
        }
      }
    }

    // Generate restore report
    await this.generateRestoreReport(results, backup, components);

    console.log('\n🎉 Restore process completed!');
    console.log('📊 Check the restore report for details');
  }

  async restoreComponent(component, backupPath) {
    switch (component) {
      case 'environment':
        return await this.restoreEnvironment(backupPath);
      case 'database':
        return await this.restoreDatabase(backupPath);
      case 'files':
        return await this.restoreFiles(backupPath);
      case 'r2':
        return await this.restoreR2Storage(backupPath);
      default:
        throw new Error(`Unknown component: ${component}`);
    }
  }

  async restoreEnvironment(backupPath) {
    const envBackupPath = path.join(backupPath, 'environment');
    
    if (!fs.existsSync(envBackupPath)) {
      throw new Error('Environment backup not found');
    }

    console.log('⚙️  Restoring environment variables...');

    // List available encrypted files
    const encryptedFiles = fs.readdirSync(envBackupPath)
      .filter(file => file.endsWith('.encrypted'));

    console.log('🔓 Found encrypted environment files:');
    encryptedFiles.forEach(file => console.log(`  - ${file}`));

    // For security, we'll create templates instead of directly restoring
    const templatesPath = path.join(envBackupPath, 'templates');
    if (fs.existsSync(templatesPath)) {
      console.log('📝 Copying environment templates...');
      
      const templates = fs.readdirSync(templatesPath);
      let copiedCount = 0;
      
      for (const template of templates) {
        const templatePath = path.join(templatesPath, template);
        const targetName = template.replace('.template', '');
        let targetPath;

        // Determine target path based on template name
        if (targetName === 'backend-env') {
          targetPath = path.join(this.projectRoot, 'backend/.env.template');
        } else if (targetName === 'frontend-env') {
          targetPath = path.join(this.projectRoot, 'frontend/.env.template');
        } else if (targetName === 'docker-env') {
          targetPath = path.join(this.projectRoot, '.env.template');
        } else {
          targetPath = path.join(this.projectRoot, `${targetName}.template`);
        }

        fs.copyFileSync(templatePath, targetPath);
        console.log(`  ✅ ${targetName}.template created`);
        copiedCount++;
      }

      console.log('🔒 IMPORTANT: Environment templates created. You must:');
      console.log('  1. Copy .template files to actual .env files');
      console.log('  2. Replace placeholder values with real credentials');
      console.log('  3. Refer to SETUP_INSTRUCTIONS.md for details');

      return { templatesCreated: copiedCount };
    } else {
      throw new Error('Environment templates not found in backup');
    }
  }

  async restoreDatabase(backupPath) {
    const dbBackupPath = path.join(backupPath, 'database');
    
    if (!fs.existsSync(dbBackupPath)) {
      throw new Error('Database backup not found');
    }

    console.log('🗄️  Restoring database...');

    // Find backup files
    const backupFiles = fs.readdirSync(dbBackupPath);
    const sqlBackup = backupFiles.find(file => file.endsWith('.sql.gz'));
    const customBackup = backupFiles.find(file => file.endsWith('.backup'));

    if (!sqlBackup && !customBackup) {
      throw new Error('No database backup files found');
    }

    // Load database configuration
    require('dotenv').config({ path: path.join(this.projectRoot, 'backend/.env') });
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'education_dev_db'
    };

    console.log(`📊 Restoring to database: ${dbConfig.database}`);

    try {
      if (customBackup) {
        // Restore from custom format backup
        const backupFile = path.join(dbBackupPath, customBackup);
        const restoreCommand = [
          'pg_restore',
          `--host=${dbConfig.host}`,
          `--port=${dbConfig.port}`,
          `--username=${dbConfig.username}`,
          '--verbose',
          '--clean',
          '--no-owner',
          '--no-privileges',
          `--dbname=${dbConfig.database}`,
          backupFile
        ].join(' ');

        await this.executeCommand(restoreCommand, { 
          ...process.env, 
          PGPASSWORD: dbConfig.password 
        });

        return { method: 'pg_restore', file: customBackup };
      } else if (sqlBackup) {
        // Restore from SQL backup
        const backupFile = path.join(dbBackupPath, sqlBackup);
        
        // Decompress and restore
        const restoreCommand = [
          `gunzip -c "${backupFile}"`,
          '|',
          'psql',
          `--host=${dbConfig.host}`,
          `--port=${dbConfig.port}`,
          `--username=${dbConfig.username}`,
          `--dbname=${dbConfig.database}`
        ].join(' ');

        await this.executeCommand(restoreCommand, { 
          ...process.env, 
          PGPASSWORD: dbConfig.password 
        });

        return { method: 'psql', file: sqlBackup };
      }
    } catch (error) {
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  async restoreFiles(backupPath) {
    const filesBackupPath = path.join(backupPath, 'files');
    
    if (!fs.existsSync(filesBackupPath)) {
      throw new Error('Files backup not found');
    }

    console.log('📁 Restoring files...');

    // Find the main backup archive
    const backupFiles = fs.readdirSync(filesBackupPath);
    const mainArchive = backupFiles.find(file => file.startsWith('files_backup_') && file.endsWith('.zip'));

    if (!mainArchive) {
      throw new Error('Main files archive not found');
    }

    const archivePath = path.join(filesBackupPath, mainArchive);
    const extractPath = path.join(this.projectRoot, 'temp_restore');

    try {
      // Extract archive
      console.log('📦 Extracting files archive...');
      await this.extractZipFile(archivePath, extractPath);

      // Restore each component
      const components = [
        { name: 'backend-uploads', target: path.join(this.projectRoot, 'backend/uploads') },
        { name: 'backend-public', target: path.join(this.projectRoot, 'backend/public') },
        { name: 'frontend-public', target: path.join(this.projectRoot, 'frontend/public') },
        { name: 'frontend-assets', target: path.join(this.projectRoot, 'frontend/src/assets') }
      ];

      let restoredCount = 0;

      for (const component of components) {
        const sourcePath = path.join(extractPath, component.name);
        
        if (fs.existsSync(sourcePath)) {
          // Backup existing directory
          if (fs.existsSync(component.target)) {
            const backupTarget = `${component.target}.backup.${Date.now()}`;
            fs.renameSync(component.target, backupTarget);
            console.log(`  📋 Backed up existing ${component.name} to ${path.basename(backupTarget)}`);
          }

          // Restore from backup
          this.copyDirectoryRecursive(sourcePath, component.target);
          console.log(`  ✅ Restored ${component.name}`);
          restoredCount++;
        } else {
          console.log(`  ⚠️  ${component.name} not found in backup`);
        }
      }

      // Clean up temporary extraction
      this.deleteDirectory(extractPath);

      return { restoredComponents: restoredCount };

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(extractPath)) {
        this.deleteDirectory(extractPath);
      }
      throw error;
    }
  }

  async restoreR2Storage(backupPath) {
    console.log('☁️  Restoring R2 storage...');

    // Check for R2 reference
    const r2Reference = path.join(backupPath, 'r2-storage_reference.json');
    
    if (!fs.existsSync(r2Reference)) {
      throw new Error('R2 storage reference not found');
    }

    const reference = JSON.parse(fs.readFileSync(r2Reference, 'utf8'));
    const r2BackupPath = reference.originalPath;

    if (!fs.existsSync(r2BackupPath)) {
      throw new Error(`R2 backup directory not found: ${r2BackupPath}`);
    }

    // Load R2 configuration
    require('dotenv').config({ path: path.join(this.projectRoot, 'backend/.env') });

    const r2Config = {
      bucketName: process.env.R2_BUCKET_NAME,
      region: process.env.R2_REGION,
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    };

    if (!r2Config.accessKeyId || !r2Config.secretAccessKey) {
      throw new Error('R2 credentials not found in environment variables');
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });

    console.log(`📤 Uploading files to R2 bucket: ${r2Config.bucketName}`);

    // Upload all files from backup
    const uploadResults = await this.uploadDirectoryToR2(r2BackupPath, s3Client, r2Config.bucketName);

    return {
      uploadedFiles: uploadResults.success,
      failedFiles: uploadResults.failed,
      totalFiles: uploadResults.total
    };
  }

  async uploadDirectoryToR2(dirPath, s3Client, bucketName, prefix = '') {
    const results = { success: 0, failed: 0, total: 0 };

    const uploadFile = async (filePath, key) => {
      try {
        const fileContent = fs.readFileSync(filePath);
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent
        });

        await s3Client.send(command);
        results.success++;
        console.log(`  ✅ ${key}`);
      } catch (error) {
        results.failed++;
        console.log(`  ❌ ${key}: ${error.message}`);
      }
      results.total++;
    };

    const processDirectory = async (currentPath, currentPrefix) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const itemKey = currentPrefix ? `${currentPrefix}/${item}` : item;

        if (fs.lstatSync(itemPath).isDirectory()) {
          await processDirectory(itemPath, itemKey);
        } else {
          await uploadFile(itemPath, itemKey);
        }
      }
    };

    await processDirectory(dirPath, prefix);
    return results;
  }

  executeCommand(command, env = process.env) {
    return new Promise((resolve, reject) => {
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes('NOTICE:')) {
          console.log('Command output:', stderr);
        }
        resolve(stdout);
      });
    });
  }

  extractZipFile(zipPath, extractPath) {
    return new Promise((resolve, reject) => {
      const command = process.platform === 'win32' 
        ? `powershell Expand-Archive -Path "${zipPath}" -DestinationPath "${extractPath}"`
        : `unzip -q "${zipPath}" -d "${extractPath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  copyDirectoryRecursive(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.lstatSync(sourcePath).isDirectory()) {
        this.copyDirectoryRecursive(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
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

  async generateRestoreReport(results, backup, components) {
    const report = `# Educational Platform - Restore Report

## Restore Information
- **Date**: ${new Date().toISOString()}
- **Source Backup**: ${backup.name}
- **Backup Date**: ${backup.date}
- **Components Restored**: ${components.join(', ')}

## Component Status

### ⚙️ Environment Variables
- **Status**: ${results.environment?.success ? '✅ Success' : components.includes('environment') ? '❌ Failed' : '⏭️ Skipped'}
${results.environment?.error ? `- **Error**: ${results.environment.error}` : ''}
${results.environment?.templatesCreated ? `- **Templates Created**: ${results.environment.templatesCreated}` : ''}

### 🗄️ Database
- **Status**: ${results.database?.success ? '✅ Success' : components.includes('database') ? '❌ Failed' : '⏭️ Skipped'}
${results.database?.error ? `- **Error**: ${results.database.error}` : ''}
${results.database?.method ? `- **Method**: ${results.database.method}` : ''}
${results.database?.file ? `- **File**: ${results.database.file}` : ''}

### 📁 Files
- **Status**: ${results.files?.success ? '✅ Success' : components.includes('files') ? '❌ Failed' : '⏭️ Skipped'}
${results.files?.error ? `- **Error**: ${results.files.error}` : ''}
${results.files?.restoredComponents ? `- **Components Restored**: ${results.files.restoredComponents}` : ''}

### ☁️ R2 Storage
- **Status**: ${results.r2?.success ? '✅ Success' : components.includes('r2') ? '❌ Failed' : '⏭️ Skipped'}
${results.r2?.error ? `- **Error**: ${results.r2.error}` : ''}
${results.r2?.uploadedFiles ? `- **Files Uploaded**: ${results.r2.uploadedFiles}/${results.r2.totalFiles}` : ''}

## Post-Restore Steps

1. **Environment Configuration**
   - Copy .template files to actual .env files
   - Replace placeholder values with real credentials
   - Test database connection

2. **Application Startup**
   - Install dependencies: \`npm install\`
   - Run migrations: \`npm run migration:run\`
   - Start application: \`npm run start:dev\`

3. **Verification**
   - Test user authentication
   - Verify file uploads work
   - Check payment processing
   - Test video conferencing integration

4. **Security**
   - Rotate any potentially compromised credentials
   - Review access logs
   - Update backup schedules

## Important Notes
- Environment variables are restored as templates for security
- Database restore may require manual intervention if schema changes exist
- R2 storage restore uploads to the configured bucket
- Test all functionality before going live

---
*Report generated on ${new Date().toISOString()}*
`;

    const reportPath = path.join(this.backupDir, `restore_report_${Date.now()}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📊 Restore report saved: ${reportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const restore = new RestoreManager();
  restore.startRestore();
}

module.exports = RestoreManager;

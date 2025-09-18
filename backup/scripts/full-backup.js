#!/usr/bin/env node

/**
 * Complete Backup Orchestration Script for Educational Platform
 * Coordinates all backup types and creates a comprehensive backup
 */

const DatabaseBackup = require('./database-backup');
const FilesBackup = require('./files-backup');
const R2Backup = require('./r2-backup');
const EnvBackup = require('./env-backup');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class FullBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../data');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.fullBackupDir = path.join(this.backupDir, `full_backup_${this.timestamp}`);
    
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.fullBackupDir)) {
      fs.mkdirSync(this.fullBackupDir, { recursive: true });
      console.log(`Created full backup directory: ${this.fullBackupDir}`);
    }
  }

  async createFullBackup() {
    console.log('🚀 Starting comprehensive backup of Educational Platform...');
    console.log(`📁 Backup location: ${this.fullBackupDir}`);
    console.log('='.repeat(60));

    const backupResults = {
      timestamp: this.timestamp,
      backupPath: this.fullBackupDir,
      components: {},
      success: false,
      errors: [],
      summary: {}
    };

    try {
      // 1. Database Backup
      console.log('\n📊 Step 1/4: Database Backup');
      console.log('-'.repeat(30));
      const dbBackup = new DatabaseBackup();
      const dbResult = await dbBackup.createBackup();
      
      backupResults.components.database = dbResult;
      if (!dbResult.success) {
        backupResults.errors.push(`Database backup failed: ${dbResult.error}`);
        console.error('❌ Database backup failed, continuing with other backups...');
      } else {
        console.log('✅ Database backup completed');
        // Copy database backups to full backup directory
        await this.copyBackupFiles('database', dbResult.files);
      }

      // 2. Files Backup
      console.log('\n📁 Step 2/4: Files Backup');
      console.log('-'.repeat(30));
      const filesBackup = new FilesBackup();
      const filesResult = await filesBackup.createBackup();
      
      backupResults.components.files = filesResult;
      if (!filesResult.success) {
        backupResults.errors.push(`Files backup failed: ${filesResult.error}`);
        console.error('❌ Files backup failed, continuing with other backups...');
      } else {
        console.log('✅ Files backup completed');
        // Copy files backups to full backup directory
        await this.copyBackupFiles('files', [filesResult.totalArchive, filesResult.metadata]);
      }

      // 3. R2 Storage Backup
      console.log('\n☁️  Step 3/4: R2 Storage Backup');
      console.log('-'.repeat(30));
      const r2Backup = new R2Backup();
      const r2Result = await r2Backup.createBackup();
      
      backupResults.components.r2 = r2Result;
      if (!r2Result.success) {
        backupResults.errors.push(`R2 backup failed: ${r2Result.error}`);
        console.error('❌ R2 backup failed, continuing with other backups...');
      } else {
        console.log('✅ R2 backup completed');
        // Create symbolic link to R2 backup directory
        await this.linkBackupDirectory('r2-storage', r2Result.backupPath);
      }

      // 4. Environment Backup
      console.log('\n⚙️  Step 4/4: Environment Backup');
      console.log('-'.repeat(30));
      const envBackup = new EnvBackup();
      const envResult = await envBackup.createBackup();
      
      backupResults.components.environment = envResult;
      if (!envResult.success) {
        backupResults.errors.push(`Environment backup failed: ${envResult.error}`);
        console.error('❌ Environment backup failed, continuing...');
      } else {
        console.log('✅ Environment backup completed');
        // Copy environment backups to full backup directory
        await this.copyBackupDirectory('environment', envResult.backupPath);
      }

      // Generate comprehensive summary
      backupResults.summary = this.generateSummary(backupResults);
      backupResults.success = backupResults.errors.length === 0;

      // Create backup manifest
      await this.createBackupManifest(backupResults);

      // Create compressed archive
      const archivePath = await this.createCompressedArchive();
      backupResults.archivePath = archivePath;

      // Generate final report
      await this.generateFinalReport(backupResults);

      console.log('\n' + '='.repeat(60));
      if (backupResults.success) {
        console.log('🎉 FULL BACKUP COMPLETED SUCCESSFULLY!');
      } else {
        console.log('⚠️  BACKUP COMPLETED WITH SOME ERRORS');
        console.log('Errors encountered:');
        backupResults.errors.forEach(error => console.log(`  - ${error}`));
      }

      console.log(`📦 Backup archive: ${archivePath}`);
      console.log(`📊 Total size: ${this.formatBytes(fs.statSync(archivePath).size)}`);
      console.log('='.repeat(60));

      return backupResults;

    } catch (error) {
      console.error('💥 Full backup failed with unexpected error:', error.message);
      backupResults.success = false;
      backupResults.errors.push(`Unexpected error: ${error.message}`);
      return backupResults;
    }
  }

  async copyBackupFiles(component, files) {
    if (!files || files.length === 0) return;

    const componentDir = path.join(this.fullBackupDir, component);
    fs.mkdirSync(componentDir, { recursive: true });

    for (const file of files) {
      if (fs.existsSync(file)) {
        const fileName = path.basename(file);
        const destPath = path.join(componentDir, fileName);
        fs.copyFileSync(file, destPath);
        console.log(`  Copied: ${fileName}`);
      }
    }
  }

  async copyBackupDirectory(component, sourceDir) {
    if (!fs.existsSync(sourceDir)) return;

    const componentDir = path.join(this.fullBackupDir, component);
    this.copyDirectoryRecursive(sourceDir, componentDir);
    console.log(`  Copied directory: ${component}`);
  }

  async linkBackupDirectory(component, sourceDir) {
    if (!fs.existsSync(sourceDir)) return;

    const linkPath = path.join(this.fullBackupDir, component);
    
    try {
      // Create a reference file instead of symbolic link (Windows compatibility)
      const referenceData = {
        type: 'directory_reference',
        originalPath: sourceDir,
        timestamp: this.timestamp,
        component: component
      };
      
      fs.writeFileSync(`${linkPath}_reference.json`, JSON.stringify(referenceData, null, 2));
      console.log(`  Created reference: ${component}`);
    } catch (error) {
      console.warn(`  Warning: Could not create reference for ${component}: ${error.message}`);
    }
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

  generateSummary(results) {
    const summary = {
      totalComponents: 4,
      successfulComponents: 0,
      failedComponents: 0,
      totalSize: 0,
      components: {}
    };

    // Analyze each component
    Object.entries(results.components).forEach(([name, result]) => {
      if (result.success) {
        summary.successfulComponents++;
      } else {
        summary.failedComponents++;
      }

      summary.components[name] = {
        success: result.success,
        error: result.error || null
      };

      // Calculate sizes where available
      if (result.totalSize) {
        summary.totalSize += result.totalSize;
      }
    });

    summary.successRate = Math.round((summary.successfulComponents / summary.totalComponents) * 100);

    return summary;
  }

  async createBackupManifest(results) {
    const manifest = {
      version: '1.0',
      type: 'educational_platform_full_backup',
      timestamp: results.timestamp,
      created: new Date().toISOString(),
      platform: {
        name: 'Educational Platform',
        version: '1.0.0'
      },
      backup: {
        success: results.success,
        components: results.summary.components,
        errors: results.errors,
        summary: results.summary
      },
      restoration: {
        order: ['environment', 'database', 'files', 'r2'],
        notes: [
          'Restore environment variables first',
          'Restore database before starting application',
          'Restore files to maintain application functionality',
          'R2 storage can be restored independently'
        ]
      },
      verification: {
        checksums: await this.generateChecksums(),
        fileCount: this.countFiles(this.fullBackupDir)
      }
    };

    const manifestPath = path.join(this.fullBackupDir, 'BACKUP_MANIFEST.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('📄 Backup manifest created');
    return manifestPath;
  }

  async generateChecksums() {
    const crypto = require('crypto');
    const checksums = {};

    const generateChecksum = (filePath) => {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    };

    const processDirectory = (dir, basePath = '') => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(basePath, file);
        
        if (fs.lstatSync(filePath).isDirectory()) {
          processDirectory(filePath, relativePath);
        } else {
          try {
            checksums[relativePath] = generateChecksum(filePath);
          } catch (error) {
            console.warn(`Warning: Could not generate checksum for ${relativePath}`);
          }
        }
      }
    };

    processDirectory(this.fullBackupDir);
    return checksums;
  }

  countFiles(dir) {
    let count = 0;
    
    const countRecursive = (directory) => {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        
        if (fs.lstatSync(filePath).isDirectory()) {
          countRecursive(filePath);
        } else {
          count++;
        }
      }
    };

    countRecursive(dir);
    return count;
  }

  async createCompressedArchive() {
    const archivePath = `${this.fullBackupDir}.zip`;
    
    console.log('📦 Creating compressed archive...');
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(archivePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        console.log('✅ Compressed archive created');
        resolve(archivePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(this.fullBackupDir, false);
      archive.finalize();
    });
  }

  async generateFinalReport(results) {
    const report = `# Educational Platform - Complete Backup Report

## Backup Information
- **Timestamp**: ${results.timestamp}
- **Date**: ${new Date().toISOString()}
- **Backup Path**: ${results.backupPath}
- **Archive**: ${results.archivePath || 'Not created'}

## Summary
- **Overall Status**: ${results.success ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}
- **Components Backed Up**: ${results.summary.successfulComponents}/${results.summary.totalComponents}
- **Success Rate**: ${results.summary.successRate}%
- **Total Files**: ${this.countFiles(this.fullBackupDir)}

## Component Status

### 📊 Database Backup
- **Status**: ${results.components.database?.success ? '✅ Success' : '❌ Failed'}
${results.components.database?.error ? `- **Error**: ${results.components.database.error}` : ''}

### 📁 Files Backup
- **Status**: ${results.components.files?.success ? '✅ Success' : '❌ Failed'}
${results.components.files?.error ? `- **Error**: ${results.components.files.error}` : ''}

### ☁️ R2 Storage Backup
- **Status**: ${results.components.r2?.success ? '✅ Success' : '❌ Failed'}
${results.components.r2?.error ? `- **Error**: ${results.components.r2.error}` : ''}

### ⚙️ Environment Backup
- **Status**: ${results.components.environment?.success ? '✅ Success' : '❌ Failed'}
${results.components.environment?.error ? `- **Error**: ${results.components.environment.error}` : ''}

## Errors Encountered
${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'None'}

## Restoration Order
1. **Environment Variables** - Restore first to configure application
2. **Database** - Restore database structure and data
3. **Files** - Restore uploaded files and assets
4. **R2 Storage** - Restore cloud storage (can be done independently)

## Important Notes
- **Security**: Environment backups contain encrypted sensitive data
- **Dependencies**: Ensure all required services are running before restoration
- **Testing**: Test the application thoroughly after restoration
- **Verification**: Use checksums in BACKUP_MANIFEST.json to verify file integrity

## Next Steps
1. Store this backup in a secure location
2. Test restoration procedure in a development environment
3. Update backup schedules and retention policies
4. Document any specific restoration requirements

---
*Report generated on ${new Date().toISOString()}*
`;

    const reportPath = path.join(this.fullBackupDir, 'BACKUP_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('📊 Final report generated');
    return reportPath;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async scheduleBackup(cronExpression) {
    console.log(`📅 Scheduling automatic backups with cron: ${cronExpression}`);
    
    // This would integrate with a task scheduler
    // For now, just document the schedule
    const scheduleInfo = {
      cronExpression: cronExpression,
      description: 'Automatic full backup of Educational Platform',
      command: `node ${__filename}`,
      created: new Date().toISOString()
    };

    const schedulePath = path.join(this.backupDir, 'backup_schedule.json');
    fs.writeFileSync(schedulePath, JSON.stringify(scheduleInfo, null, 2));
    
    console.log(`📄 Schedule information saved to: ${schedulePath}`);
    console.log('To implement automatic backups, use your system\'s task scheduler:');
    console.log('- Linux/Mac: Add to crontab');
    console.log('- Windows: Use Task Scheduler');
    console.log('- Docker: Use a cron container');
  }
}

// CLI execution
if (require.main === module) {
  const backup = new FullBackup();
  
  async function run() {
    try {
      const result = await backup.createFullBackup();
      
      if (result.success) {
        console.log('\n🎉 Full backup completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Backup completed with errors. Check the report for details.');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Unexpected error during full backup:', error);
      process.exit(1);
    }
  }

  // Check for schedule argument
  const args = process.argv.slice(2);
  if (args.includes('--schedule')) {
    const cronIndex = args.indexOf('--cron');
    const cronExpression = cronIndex !== -1 ? args[cronIndex + 1] : '0 2 * * *'; // Default: 2 AM daily
    
    backup.scheduleBackup(cronExpression).then(() => {
      console.log('✅ Backup scheduling completed');
    });
  } else {
    run();
  }
}

module.exports = FullBackup;

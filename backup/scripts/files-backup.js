#!/usr/bin/env node

/**
 * File System Backup Script for Educational Platform
 * Backs up uploads, media files, and other important directories
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');

class FilesBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../data/files');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.projectRoot = path.join(__dirname, '../../');
    
    // Define directories to backup
    this.backupSources = [
      {
        name: 'backend-uploads',
        path: path.join(this.projectRoot, 'backend/uploads'),
        description: 'Backend uploaded files (announcements, materials, etc.)'
      },
      {
        name: 'backend-public',
        path: path.join(this.projectRoot, 'backend/public'),
        description: 'Backend public files'
      },
      {
        name: 'frontend-public',
        path: path.join(this.projectRoot, 'frontend/public'),
        description: 'Frontend public assets'
      },
      {
        name: 'frontend-assets',
        path: path.join(this.projectRoot, 'frontend/src/assets'),
        description: 'Frontend source assets'
      },
      {
        name: 'backend-logs',
        path: path.join(this.projectRoot, 'backend/uploads/logs'),
        description: 'Application logs'
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
    console.log('📁 Starting files backup...');
    
    const backupResults = [];
    const totalBackupPath = path.join(this.backupDir, `files_backup_${this.timestamp}.zip`);

    try {
      // Create a single archive for all files
      const output = fs.createWriteStream(totalBackupPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle archive events
      output.on('close', () => {
        console.log(`✅ Total archive created: ${this.formatBytes(archive.pointer())} bytes`);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Warning:', err.message);
        } else {
          throw err;
        }
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      // Add each source to the archive
      for (const source of this.backupSources) {
        if (fs.existsSync(source.path)) {
          console.log(`📦 Adding ${source.name}: ${source.description}`);
          
          const stats = fs.statSync(source.path);
          if (stats.isDirectory()) {
            archive.directory(source.path, source.name);
          } else {
            archive.file(source.path, { name: source.name });
          }
          
          backupResults.push({
            name: source.name,
            path: source.path,
            exists: true,
            size: this.getDirectorySize(source.path)
          });
        } else {
          console.log(`⚠️  Skipping ${source.name}: Directory does not exist`);
          backupResults.push({
            name: source.name,
            path: source.path,
            exists: false,
            size: 0
          });
        }
      }

      // Finalize the archive
      await archive.finalize();

      // Wait for the stream to close
      await new Promise((resolve) => {
        output.on('close', resolve);
      });

      // Create individual backups for critical directories
      const individualBackups = await this.createIndividualBackups();

      // Create backup metadata
      const metadata = {
        timestamp: this.timestamp,
        totalArchive: {
          path: totalBackupPath,
          size: fs.statSync(totalBackupPath).size
        },
        sources: backupResults,
        individualBackups: individualBackups
      };

      const metadataPath = path.join(this.backupDir, `files_metadata_${this.timestamp}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      console.log('✅ Files backup completed successfully!');
      console.log(`📁 Total backup: ${totalBackupPath} (${this.formatBytes(metadata.totalArchive.size)})`);
      console.log(`📄 Metadata: ${metadataPath}`);

      return {
        success: true,
        totalArchive: totalBackupPath,
        metadata: metadataPath,
        individualBackups: individualBackups
      };

    } catch (error) {
      console.error('❌ Files backup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createIndividualBackups() {
    console.log('📦 Creating individual backups for critical directories...');
    
    const individualBackups = [];
    const criticalDirs = this.backupSources.filter(source => 
      source.name === 'backend-uploads' || source.name === 'backend-logs'
    );

    for (const source of criticalDirs) {
      if (fs.existsSync(source.path)) {
        const backupPath = path.join(this.backupDir, `${source.name}_${this.timestamp}.zip`);
        
        try {
          await this.createZipArchive(source.path, backupPath);
          const size = fs.statSync(backupPath).size;
          
          individualBackups.push({
            name: source.name,
            path: backupPath,
            size: size
          });

          console.log(`✅ Individual backup: ${source.name} (${this.formatBytes(size)})`);
        } catch (error) {
          console.error(`❌ Failed to create individual backup for ${source.name}:`, error.message);
        }
      }
    }

    return individualBackups;
  }

  createZipArchive(sourcePath, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      
      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        archive.directory(sourcePath, false);
      } else {
        archive.file(sourcePath, { name: path.basename(sourcePath) });
      }
      
      archive.finalize();
    });
  }

  getDirectorySize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    
    let totalSize = 0;
    
    try {
      const stats = fs.statSync(dirPath);
      if (stats.isFile()) {
        return stats.size;
      }
      
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          totalSize += this.getDirectorySize(filePath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not calculate size for ${dirPath}: ${error.message}`);
    }
    
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async cleanOldBackups(keepDays = 30) {
    console.log(`🧹 Cleaning file backups older than ${keepDays} days...`);
    
    const files = fs.readdirSync(this.backupDir);
    const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted old backup: ${file}`);
      }
    }

    console.log(`✅ Cleaned ${deletedCount} old file backup files`);
  }

  async generateBackupReport() {
    console.log('\n📊 Backup Report:');
    console.log('==================');
    
    for (const source of this.backupSources) {
      if (fs.existsSync(source.path)) {
        const size = this.getDirectorySize(source.path);
        const fileCount = this.countFiles(source.path);
        console.log(`✅ ${source.name}: ${this.formatBytes(size)} (${fileCount} files)`);
        console.log(`   Path: ${source.path}`);
        console.log(`   Description: ${source.description}`);
      } else {
        console.log(`❌ ${source.name}: Directory not found`);
        console.log(`   Path: ${source.path}`);
      }
      console.log('');
    }
  }

  countFiles(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    
    let fileCount = 0;
    
    try {
      const stats = fs.statSync(dirPath);
      if (stats.isFile()) {
        return 1;
      }
      
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          fileCount += this.countFiles(filePath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not count files in ${dirPath}: ${error.message}`);
    }
    
    return fileCount;
  }
}

// CLI execution
if (require.main === module) {
  const backup = new FilesBackup();
  
  async function run() {
    try {
      await backup.generateBackupReport();
      const result = await backup.createBackup();
      
      if (result.success) {
        await backup.cleanOldBackups(30);
        console.log('\n🎉 Files backup process completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Files backup process failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  }

  run();
}

module.exports = FilesBackup;

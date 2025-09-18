#!/usr/bin/env node

/**
 * R2 Storage Backup Script for Educational Platform
 * Backs up files from Cloudflare R2 storage to local storage
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const pipelineAsync = promisify(pipeline);

class R2Backup {
  constructor() {
    this.backupDir = path.join(__dirname, '../data/r2-storage');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // R2 configuration from environment
    this.r2Config = {
      bucketName: process.env.R2_BUCKET_NAME || 'baraem',
      region: process.env.R2_REGION || 'weur',
      endpoint: process.env.R2_ENDPOINT || 'https://media.baraemalnour.org',
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      publicUrl: process.env.R2_PUBLIC_URL || 'https://media.baraemalnour.org/baraem'
    };

    if (!this.r2Config.accessKeyId || !this.r2Config.secretAccessKey) {
      console.error('❌ R2 credentials not found in environment variables');
      console.error('Please ensure R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are set');
      process.exit(1);
    }

    // Initialize S3 client for R2
    this.s3Client = new S3Client({
      region: this.r2Config.region,
      endpoint: this.r2Config.endpoint,
      credentials: {
        accessKeyId: this.r2Config.accessKeyId,
        secretAccessKey: this.r2Config.secretAccessKey,
      },
    });

    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createBackup() {
    console.log('☁️  Starting R2 storage backup...');
    console.log(`Bucket: ${this.r2Config.bucketName}`);
    console.log(`Endpoint: ${this.r2Config.endpoint}`);

    try {
      // List all objects in the bucket
      const objects = await this.listAllObjects();
      console.log(`📦 Found ${objects.length} objects in R2 storage`);

      if (objects.length === 0) {
        console.log('✅ No objects to backup');
        return { success: true, objects: [], totalSize: 0 };
      }

      // Create timestamped backup directory
      const backupPath = path.join(this.backupDir, `r2_backup_${this.timestamp}`);
      fs.mkdirSync(backupPath, { recursive: true });

      // Download all objects
      const downloadResults = [];
      let totalSize = 0;
      let successCount = 0;
      let failureCount = 0;

      console.log('📥 Starting download process...');
      
      for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        console.log(`[${i + 1}/${objects.length}] Downloading: ${object.Key}`);
        
        try {
          const result = await this.downloadObject(object, backupPath);
          downloadResults.push(result);
          totalSize += result.size;
          successCount++;
          
          // Progress indicator
          if ((i + 1) % 10 === 0 || i === objects.length - 1) {
            console.log(`Progress: ${i + 1}/${objects.length} (${Math.round(((i + 1) / objects.length) * 100)}%)`);
          }
        } catch (error) {
          console.error(`❌ Failed to download ${object.Key}: ${error.message}`);
          downloadResults.push({
            key: object.Key,
            success: false,
            error: error.message,
            size: 0
          });
          failureCount++;
        }
      }

      // Create backup metadata
      const metadata = {
        timestamp: this.timestamp,
        bucket: this.r2Config.bucketName,
        endpoint: this.r2Config.endpoint,
        totalObjects: objects.length,
        successfulDownloads: successCount,
        failedDownloads: failureCount,
        totalSize: totalSize,
        backupPath: backupPath,
        objects: downloadResults
      };

      const metadataPath = path.join(backupPath, 'backup_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Create backup summary
      this.createBackupSummary(metadata, backupPath);

      console.log('✅ R2 backup completed!');
      console.log(`📁 Backup location: ${backupPath}`);
      console.log(`📊 Successfully downloaded: ${successCount}/${objects.length} objects`);
      console.log(`📏 Total size: ${this.formatBytes(totalSize)}`);

      if (failureCount > 0) {
        console.log(`⚠️  Failed downloads: ${failureCount}`);
      }

      return {
        success: true,
        backupPath: backupPath,
        metadata: metadata,
        totalSize: totalSize
      };

    } catch (error) {
      console.error('❌ R2 backup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async listAllObjects() {
    const objects = [];
    let continuationToken = null;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.r2Config.bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000 // Maximum allowed by AWS S3 API
      });

      const response = await this.s3Client.send(command);
      
      if (response.Contents) {
        objects.push(...response.Contents);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  }

  async downloadObject(object, backupPath) {
    const command = new GetObjectCommand({
      Bucket: this.r2Config.bucketName,
      Key: object.Key
    });

    const response = await this.s3Client.send(command);
    
    // Create directory structure
    const localPath = path.join(backupPath, object.Key);
    const localDir = path.dirname(localPath);
    
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    // Download the file
    const writeStream = fs.createWriteStream(localPath);
    await pipelineAsync(response.Body, writeStream);

    const stats = fs.statSync(localPath);
    
    return {
      key: object.Key,
      localPath: localPath,
      size: stats.size,
      lastModified: object.LastModified,
      success: true
    };
  }

  createBackupSummary(metadata, backupPath) {
    const summaryPath = path.join(backupPath, 'BACKUP_SUMMARY.md');
    
    const summary = `# R2 Storage Backup Summary

## Backup Information
- **Timestamp**: ${metadata.timestamp}
- **Bucket**: ${metadata.bucket}
- **Endpoint**: ${metadata.endpoint}
- **Backup Path**: ${metadata.backupPath}

## Statistics
- **Total Objects**: ${metadata.totalObjects}
- **Successful Downloads**: ${metadata.successfulDownloads}
- **Failed Downloads**: ${metadata.failedDownloads}
- **Success Rate**: ${Math.round((metadata.successfulDownloads / metadata.totalObjects) * 100)}%
- **Total Size**: ${this.formatBytes(metadata.totalSize)}

## File Categories
${this.generateFileCategorySummary(metadata.objects)}

## Download Results
${metadata.objects.map(obj => 
  `- ${obj.success ? '✅' : '❌'} ${obj.key} ${obj.success ? `(${this.formatBytes(obj.size)})` : `(Error: ${obj.error})`}`
).join('\n')}

---
*Generated on ${new Date().toISOString()}*
`;

    fs.writeFileSync(summaryPath, summary);
  }

  generateFileCategorySummary(objects) {
    const categories = {};
    
    objects.forEach(obj => {
      if (obj.success) {
        const ext = path.extname(obj.key).toLowerCase();
        const category = this.getFileCategory(ext);
        
        if (!categories[category]) {
          categories[category] = { count: 0, size: 0 };
        }
        
        categories[category].count++;
        categories[category].size += obj.size;
      }
    });

    return Object.entries(categories)
      .map(([category, data]) => 
        `- **${category}**: ${data.count} files (${this.formatBytes(data.size)})`
      )
      .join('\n');
  }

  getFileCategory(extension) {
    const categories = {
      'Images': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
      'Videos': ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
      'Audio': ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
      'Documents': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
      'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
      'Code': ['.js', '.ts', '.html', '.css', '.json', '.xml', '.sql']
    };

    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }

    return 'Other';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async testConnection() {
    console.log('🔍 Testing R2 connection...');
    
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.r2Config.bucketName,
        MaxKeys: 1
      });

      await this.s3Client.send(command);
      console.log('✅ R2 connection successful');
      return true;
    } catch (error) {
      console.error('❌ R2 connection failed:', error.message);
      return false;
    }
  }

  async cleanOldBackups(keepDays = 30) {
    console.log(`🧹 Cleaning R2 backups older than ${keepDays} days...`);
    
    const files = fs.readdirSync(this.backupDir);
    const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && stats.mtime.getTime() < cutoffTime) {
        // Recursively delete directory
        this.deleteDirectory(filePath);
        deletedCount++;
        console.log(`Deleted old backup directory: ${file}`);
      }
    }

    console.log(`✅ Cleaned ${deletedCount} old R2 backup directories`);
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
  const backup = new R2Backup();
  
  async function run() {
    try {
      // Test connection first
      const connectionOk = await backup.testConnection();
      if (!connectionOk) {
        console.error('💥 Cannot proceed with backup due to connection issues');
        process.exit(1);
      }

      const result = await backup.createBackup();
      
      if (result.success) {
        await backup.cleanOldBackups(30);
        console.log('\n🎉 R2 backup process completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 R2 backup process failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  }

  run();
}

module.exports = R2Backup;

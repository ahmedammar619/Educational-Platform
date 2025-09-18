#!/usr/bin/env node

/**
 * Database Backup Script for Educational Platform
 * Backs up PostgreSQL database with timestamp and compression
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../data/database');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Database configuration from environment
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'education_dev_db'
    };
    
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createBackup() {
    const backupFileName = `db_backup_${this.timestamp}.sql`;
    const backupFilePath = path.join(this.backupDir, backupFileName);
    const compressedFilePath = `${backupFilePath}.gz`;

    console.log('🗄️  Starting database backup...');
    console.log(`Database: ${this.dbConfig.database}`);
    console.log(`Host: ${this.dbConfig.host}:${this.dbConfig.port}`);

    try {
      // Create pg_dump command
      const pgDumpCommand = [
        'pg_dump',
        `--host=${this.dbConfig.host}`,
        `--port=${this.dbConfig.port}`,
        `--username=${this.dbConfig.username}`,
        '--verbose',
        '--clean',
        '--no-owner',
        '--no-privileges',
        '--format=custom',
        '--compress=9',
        `--file=${backupFilePath}.backup`,
        this.dbConfig.database
      ].join(' ');

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      // Execute backup
      await this.executeCommand(pgDumpCommand, env);

      // Also create a plain SQL backup for easier restoration
      const sqlDumpCommand = [
        'pg_dump',
        `--host=${this.dbConfig.host}`,
        `--port=${this.dbConfig.port}`,
        `--username=${this.dbConfig.username}`,
        '--verbose',
        '--clean',
        '--no-owner',
        '--no-privileges',
        `--file=${backupFilePath}`,
        this.dbConfig.database
      ].join(' ');

      await this.executeCommand(sqlDumpCommand, env);

      // Compress the SQL file (Windows compatible)
      if (process.platform === 'win32') {
        // Use Node.js built-in compression for Windows
        const fs = require('fs');
        const zlib = require('zlib');
        const { pipeline } = require('stream');
        const { promisify } = require('util');
        const pipelineAsync = promisify(pipeline);

        const readStream = fs.createReadStream(backupFilePath);
        const writeStream = fs.createWriteStream(`${backupFilePath}.gz`);
        const gzip = zlib.createGzip();

        await pipelineAsync(readStream, gzip, writeStream);
        
        // Remove uncompressed file
        fs.unlinkSync(backupFilePath);
      } else {
        // Use gzip command on Unix systems
        await this.executeCommand(`gzip "${backupFilePath}"`);
      }

      const stats = fs.statSync(`${backupFilePath}.backup`);
      const sqlStats = fs.statSync(compressedFilePath);

      console.log('✅ Database backup completed successfully!');
      console.log(`📁 Custom format backup: ${backupFilePath}.backup (${this.formatBytes(stats.size)})`);
      console.log(`📁 SQL backup (compressed): ${compressedFilePath} (${this.formatBytes(sqlStats.size)})`);

      // Create backup metadata
      const metadata = {
        timestamp: this.timestamp,
        database: this.dbConfig.database,
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        files: {
          custom: `${backupFileName}.backup`,
          sql: `${backupFileName}.gz`
        },
        sizes: {
          custom: stats.size,
          sql: sqlStats.size
        }
      };

      fs.writeFileSync(
        path.join(this.backupDir, `metadata_${this.timestamp}.json`),
        JSON.stringify(metadata, null, 2)
      );

      return {
        success: true,
        files: [
          `${backupFilePath}.backup`,
          compressedFilePath,
          path.join(this.backupDir, `metadata_${this.timestamp}.json`)
        ]
      };

    } catch (error) {
      console.error('❌ Database backup failed:', error.message);
      return { success: false, error: error.message };
    }
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

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async cleanOldBackups(keepDays = 30) {
    console.log(`🧹 Cleaning backups older than ${keepDays} days...`);
    
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

    console.log(`✅ Cleaned ${deletedCount} old backup files`);
  }
}

// CLI execution
if (require.main === module) {
  const backup = new DatabaseBackup();
  
  async function run() {
    try {
      const result = await backup.createBackup();
      
      if (result.success) {
        await backup.cleanOldBackups(30);
        console.log('\n🎉 Backup process completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Backup process failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  }

  run();
}

module.exports = DatabaseBackup;

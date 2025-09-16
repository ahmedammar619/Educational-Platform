#!/usr/bin/env node

/**
 * Script to check R2 cloud storage contents
 * This script demonstrates how to use the new endpoints to list recordings and bucket contents
 * 
 * Usage:
 * node check-r2-contents.js [options]
 * 
 * Options:
 * --list-recordings     List all recordings in the recordings folder
 * --list-meeting <id>    List recordings for a specific meeting ID
 * --list-bucket         List all contents in the R2 bucket
 * --help                Show this help message
 */

const https = require('https');
const http = require('http');

// Configuration - Update these values according to your setup
const CONFIG = {
  baseUrl: 'http://localhost:3000', // Change to your backend URL
  endpoints: {
    listRecordings: '/zoom/recording-test/list-recordings',
    listMeetingRecordings: '/zoom/recording-test/list-recordings',
    listBucketContents: '/zoom/recording-test/list-bucket-contents',
    testR2Connection: '/zoom/recording-test/test-r2-connection'
  }
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Format file size for display
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date for display
function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

// Display recordings in a formatted way
function displayRecordings(recordings, title) {
  console.log(`\n📁 ${title}`);
  console.log('='.repeat(50));
  
  if (recordings.length === 0) {
    console.log('No recordings found.');
    return;
  }

  recordings.forEach((recording, index) => {
    console.log(`\n${index + 1}. ${recording.fileName}`);
    console.log(`   Meeting ID: ${recording.meetingId}`);
    console.log(`   Size: ${formatBytes(recording.size)}`);
    console.log(`   Last Modified: ${formatDate(recording.lastModified)}`);
    console.log(`   URL: ${recording.url}`);
    console.log(`   Key: ${recording.key}`);
  });
}

// Display bucket contents
function displayBucketContents(objects, bucketName) {
  console.log(`\n🗂️  Bucket Contents: ${bucketName}`);
  console.log('='.repeat(50));
  
  if (objects.length === 0) {
    console.log('Bucket is empty.');
    return;
  }

  objects.forEach((obj, index) => {
    console.log(`\n${index + 1}. ${obj.key}`);
    console.log(`   Size: ${formatBytes(obj.size)}`);
    console.log(`   Last Modified: ${formatDate(obj.lastModified)}`);
    console.log(`   ETag: ${obj.etag}`);
    if (obj.storageClass) {
      console.log(`   Storage Class: ${obj.storageClass}`);
    }
  });
}

// Main functions
async function listAllRecordings() {
  try {
    console.log('🔍 Fetching all recordings...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.listRecordings}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { recordings, totalCount, totalSize, totalSizeFormatted } = response.data;
      displayRecordings(recordings, `All Recordings (${totalCount} files, ${totalSizeFormatted})`);
    } else {
      console.error('❌ Error:', response.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function listMeetingRecordings(meetingId) {
  try {
    console.log(`🔍 Fetching recordings for meeting: ${meetingId}`);
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.listMeetingRecordings}/${meetingId}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { recordings, totalCount, totalSize, totalSizeFormatted } = response.data;
      displayRecordings(recordings, `Recordings for Meeting ${meetingId} (${totalCount} files, ${totalSizeFormatted})`);
    } else {
      console.error('❌ Error:', response.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function listBucketContents() {
  try {
    console.log('🔍 Fetching bucket contents...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.listBucketContents}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { objects, totalCount, hasMore, bucketName } = response.data;
      displayBucketContents(objects, bucketName);
      console.log(`\n📊 Total: ${totalCount} objects`);
      if (hasMore) {
        console.log('⚠️  Note: There are more objects in the bucket (truncated)');
      }
    } else {
      console.error('❌ Error:', response.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testR2Connection() {
  try {
    console.log('🔍 Testing R2 connection...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.testR2Connection}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { testKey, testUrl, bucketName, region, endpoint, publicUrl } = response.data;
      console.log('\n✅ R2 Connection Test Successful');
      console.log('='.repeat(50));
      console.log(`Bucket Name: ${bucketName}`);
      console.log(`Region: ${region}`);
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Public URL: ${publicUrl}`);
      console.log(`Test Key: ${testKey}`);
      console.log(`Test URL: ${testUrl}`);
    } else {
      console.error('❌ Error:', response.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    listRecordings: false,
    listMeeting: null,
    listBucket: false,
    testConnection: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--list-recordings':
        options.listRecordings = true;
        break;
      case '--list-meeting':
        options.listMeeting = args[i + 1];
        i++; // Skip next argument as it's the meeting ID
        break;
      case '--list-bucket':
        options.listBucket = true;
        break;
      case '--test-connection':
        options.testConnection = true;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }

  return options;
}

// Show help
function showHelp() {
  console.log(`
🔧 R2 Cloud Storage Content Checker

Usage: node check-r2-contents.js [options]

Options:
  --list-recordings     List all recordings in the recordings folder
  --list-meeting <id>   List recordings for a specific meeting ID
  --list-bucket         List all contents in the R2 bucket
  --test-connection     Test R2 connection and configuration
  --help                Show this help message

Examples:
  node check-r2-contents.js --list-recordings
  node check-r2-contents.js --list-meeting 123456789
  node check-r2-contents.js --list-bucket
  node check-r2-contents.js --test-connection
  node check-r2-contents.js --list-recordings --list-bucket

Configuration:
  Update the CONFIG object in this script to match your backend URL.
  Current URL: ${CONFIG.baseUrl}
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('🚀 R2 Cloud Storage Content Checker');
  console.log(`📡 Backend URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(50));

  // If no specific options are provided, show all
  if (!options.listRecordings && !options.listMeeting && !options.listBucket && !options.testConnection) {
    console.log('No specific options provided. Running all checks...\n');
    await testR2Connection();
    await listAllRecordings();
    await listBucketContents();
  } else {
    if (options.testConnection) {
      await testR2Connection();
    }
    if (options.listRecordings) {
      await listAllRecordings();
    }
    if (options.listMeeting) {
      await listMeetingRecordings(options.listMeeting);
    }
    if (options.listBucket) {
      await listBucketContents();
    }
  }

  console.log('\n✅ Check completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  listAllRecordings,
  listMeetingRecordings,
  listBucketContents,
  testR2Connection
};

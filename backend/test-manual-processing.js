#!/usr/bin/env node

/**
 * Script to manually test processing a specific recording
 * This will test the complete workflow: Zoom -> R2 -> YouTube
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    testR2Upload: '/zoom/recording-test/test-r2-upload'
  }
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'POST',
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

// Test manual processing of a specific meeting
async function testManualProcessing(meetingId) {
  try {
    console.log(`🔍 Testing manual processing for meeting: ${meetingId}`);
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.testR2Upload}/${meetingId}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { r2Key, r2Url, fileSize, originalFile } = response.data;
      console.log(`\n✅ Manual Processing Successful!`);
      console.log(`📁 R2 Key: ${r2Key}`);
      console.log(`🔗 R2 URL: ${r2Url}`);
      console.log(`📊 File Size: ${formatBytes(fileSize)}`);
      console.log(`📹 Original File:`);
      console.log(`   - ID: ${originalFile.id}`);
      console.log(`   - Type: ${originalFile.fileType}`);
      console.log(`   - Size: ${formatBytes(originalFile.fileSize)}`);
      console.log(`   - Recording Type: ${originalFile.recordingType}`);
      
      return true;
    } else {
      console.log(`❌ Manual Processing Failed: ${response.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

// Format file size
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main execution
async function main() {
  console.log('🚀 Test Manual Recording Processing');
  console.log('='.repeat(50));
  
  // Test with the meeting ID we found
  const meetingId = '88982449475';
  
  console.log(`📋 Testing with Meeting ID: ${meetingId}`);
  console.log('   This will test the complete workflow:');
  console.log('   1. Download recording from Zoom');
  console.log('   2. Upload to R2 cloud storage');
  console.log('   3. Verify the upload was successful');
  
  const success = await testManualProcessing(meetingId);
  
  if (success) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Check R2 storage to see the uploaded file');
    console.log('   2. Test YouTube upload (if configured)');
    console.log('   3. Debug why automatic webhook processing isn\'t working');
  } else {
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check Zoom API credentials');
    console.log('   2. Check R2 cloud storage configuration');
    console.log('   3. Check server logs for detailed error messages');
  }
  
  console.log('\n✅ Test completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testManualProcessing
};

#!/usr/bin/env node

/**
 * Script to check Zoom cloud recordings directly from Zoom API
 * This script accesses the same recordings you see in Zoom marketplace
 * 
 * Usage: node check-zoom-cloud-recordings.js
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    getZoomRecordingDetails: '/zoom/recording-test/zoom-details',
    checkWorkflow: '/zoom/recording-test/check-recording-workflow',
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

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

// Format file size
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check recording details for a specific meeting ID
async function checkZoomRecordingDetails(meetingId) {
  try {
    console.log(`🔍 Checking Zoom cloud recordings for meeting: ${meetingId}`);
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.getZoomRecordingDetails}/${meetingId}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const data = response.data;
      console.log(`\n📋 Meeting Details:`);
      console.log(`   Meeting ID: ${data.uuid}`);
      console.log(`   Topic: ${data.topic}`);
      console.log(`   Start Time: ${formatDate(data.start_time)}`);
      console.log(`   Duration: ${data.duration} minutes`);
      console.log(`   Host ID: ${data.host_id}`);
      
      if (data.recording_files && data.recording_files.length > 0) {
        console.log(`\n📹 Recording Files Found: ${data.recording_files.length}`);
        console.log('='.repeat(60));
        
        data.recording_files.forEach((file, index) => {
          console.log(`\n${index + 1}. File: ${file.file_type} (${file.recording_type})`);
          console.log(`   File ID: ${file.id}`);
          console.log(`   Size: ${formatBytes(file.file_size)}`);
          console.log(`   Status: ${file.status}`);
          console.log(`   Recording Start: ${formatDate(file.recording_start)}`);
          console.log(`   Recording End: ${formatDate(file.recording_end)}`);
          console.log(`   Download URL: ${file.download_url}`);
          console.log(`   Play URL: ${file.play_url}`);
        });
        
        return data.recording_files;
      } else {
        console.log(`\n❌ No recording files found for this meeting`);
        return [];
      }
    } else {
      console.log(`❌ Error: ${response.error}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return [];
  }
}

// Test R2 connection
async function testR2Connection() {
  try {
    console.log('🔍 Testing R2 connection...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.testR2Connection}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { bucketName, region, endpoint, publicUrl } = response.data;
      console.log('\n✅ R2 Connection Test Successful');
      console.log('='.repeat(50));
      console.log(`Bucket Name: ${bucketName}`);
      console.log(`Region: ${region}`);
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Public URL: ${publicUrl}`);
      return true;
    } else {
      console.log(`❌ R2 Connection Error: ${response.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ R2 Connection Request failed: ${error.message}`);
    return false;
  }
}

// Interactive function to check specific meeting IDs
async function checkSpecificMeeting() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🔍 Enter Zoom Meeting IDs to check (one per line)');
    console.log('   Press Enter on empty line to finish');
    console.log('   Example: 12345678901234567890');
    
    const meetingIds = [];
    
    const askForMeetingId = () => {
      rl.question('\n📝 Enter Meeting ID: ', (input) => {
        if (input.trim() === '') {
          rl.close();
          resolve(meetingIds);
        } else {
          meetingIds.push(input.trim());
          askForMeetingId();
        }
      });
    };
    
    askForMeetingId();
  });
}

// Main execution
async function main() {
  console.log('🚀 Zoom Cloud Recordings Checker');
  console.log(`📡 Backend URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(80));
  
  // Test R2 connection first
  const r2Connected = await testR2Connection();
  
  if (!r2Connected) {
    console.log('\n⚠️  R2 connection failed. Some features may not work.');
  }
  
  console.log('\n📋 This script will check Zoom cloud recordings directly from Zoom API');
  console.log('   These are the same recordings you see in Zoom marketplace');
  console.log('   You need to provide Zoom Meeting IDs to check');
  
  // Get meeting IDs from user
  const meetingIds = await checkSpecificMeeting();
  
  if (meetingIds.length === 0) {
    console.log('\n❌ No meeting IDs provided. Exiting...');
    return;
  }
  
  console.log(`\n🔍 Checking ${meetingIds.length} meeting(s)...`);
  console.log('='.repeat(80));
  
  let totalRecordings = 0;
  
  for (let i = 0; i < meetingIds.length; i++) {
    const meetingId = meetingIds[i];
    console.log(`\n📅 Meeting ${i + 1}/${meetingIds.length}: ${meetingId}`);
    console.log('-'.repeat(60));
    
    const recordings = await checkZoomRecordingDetails(meetingId);
    totalRecordings += recordings.length;
    
    if (recordings.length > 0) {
      console.log(`\n✅ Found ${recordings.length} recording(s) for this meeting`);
    } else {
      console.log(`\n❌ No recordings found for this meeting`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 Summary:`);
  console.log(`   Meetings checked: ${meetingIds.length}`);
  console.log(`   Total recordings found: ${totalRecordings}`);
  
  if (totalRecordings > 0) {
    console.log(`\n💡 Next steps:`);
    console.log(`   1. These recordings exist in Zoom cloud storage`);
    console.log(`   2. They should be automatically downloaded to R2`);
    console.log(`   3. Then uploaded to YouTube`);
    console.log(`   4. Check why the automatic process isn't working`);
  } else {
    console.log(`\n💡 No recordings found. This could mean:`);
    console.log(`   1. Meetings weren't recorded`);
    console.log(`   2. Recording settings are disabled`);
    console.log(`   3. Meetings are too recent (processing takes time)`);
  }
  
  console.log('\n✅ Check completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkZoomRecordingDetails,
  testR2Connection
};

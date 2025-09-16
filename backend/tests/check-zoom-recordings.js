#!/usr/bin/env node

/**
 * Script to check Zoom recordings directly from Zoom API
 * This script will:
 * 1. Get all meetings from the database
 * 2. Check recording status for each meeting
 * 3. Get recording details from Zoom API
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    getAllMeetings: '/zoom',
    getRecordingStatus: '/zoom/recording-test/status',
    getRecordingDetails: '/zoom/recording-test/zoom-details',
    checkWorkflow: '/zoom/recording-test/check-recording-workflow'
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

// Display meeting information
function displayMeeting(meeting, index) {
  console.log(`\n${index + 1}. Meeting: ${meeting.title}`);
  console.log(`   ID: ${meeting.id}`);
  console.log(`   Zoom Meeting ID: ${meeting.zoomMeetingId}`);
  console.log(`   Status: ${meeting.status}`);
  console.log(`   Recording Status: ${meeting.recordingStatus || 'Not set'}`);
  console.log(`   Created: ${formatDate(meeting.createdAt)}`);
  console.log(`   Start Time: ${formatDate(meeting.startTime)}`);
  console.log(`   Duration: ${meeting.duration} minutes`);
  if (meeting.course) {
    console.log(`   Course: ${meeting.course.name}`);
  }
  if (meeting.createdBy) {
    console.log(`   Created By: ${meeting.createdBy.firstName} ${meeting.createdBy.lastName}`);
  }
}

// Check recording status for a specific meeting
async function checkMeetingRecordingStatus(meetingId) {
  try {
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.getRecordingStatus}/${meetingId}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { status, recordingUrl, youtubeUrl, youtubeVideoId, completedAt } = response.data;
      console.log(`   📹 Recording Status: ${status}`);
      if (recordingUrl) {
        console.log(`   🔗 Recording URL: ${recordingUrl}`);
      }
      if (youtubeUrl) {
        console.log(`   📺 YouTube URL: ${youtubeUrl}`);
        console.log(`   🎥 YouTube Video ID: ${youtubeVideoId}`);
      }
      if (completedAt) {
        console.log(`   ✅ Completed At: ${formatDate(completedAt)}`);
      }
    } else {
      console.log(`   ❌ Error getting recording status: ${response.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
}

// Check recording workflow for a specific meeting
async function checkMeetingRecordingWorkflow(meetingId) {
  try {
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.checkWorkflow}/${meetingId}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { hasRecordings, recordingFiles, totalFiles, totalSize, workflowStatus } = response.data;
      console.log(`   🔍 Workflow Status: ${workflowStatus}`);
      console.log(`   📁 Has Recordings: ${hasRecordings}`);
      console.log(`   📊 Total Files: ${totalFiles}`);
      if (totalSize > 0) {
        console.log(`   💾 Total Size: ${formatBytes(totalSize)}`);
      }
      
      if (recordingFiles && recordingFiles.length > 0) {
        console.log(`   📋 Recording Files:`);
        recordingFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.fileType} (${file.recordingType}) - ${formatBytes(file.fileSize)}`);
          console.log(`         Status: ${file.status}`);
          console.log(`         Download URL: ${file.downloadUrl}`);
        });
      }
    } else {
      console.log(`   ❌ Error checking workflow: ${response.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
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

// Get all meetings and check their recording status
async function checkAllZoomRecordings() {
  try {
    console.log('🔍 Fetching all Zoom meetings...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.getAllMeetings}`;
    const response = await makeRequest(url);
    
    if (response && Array.isArray(response)) {
      console.log(`\n📋 Found ${response.length} meetings:`);
      console.log('='.repeat(80));
      
      for (let i = 0; i < response.length; i++) {
        const meeting = response[i];
        displayMeeting(meeting, i);
        
        // Check recording status if we have a zoom meeting ID
        if (meeting.zoomMeetingId) {
          console.log(`   🔍 Checking recording status...`);
          await checkMeetingRecordingStatus(meeting.id);
          await checkMeetingRecordingWorkflow(meeting.zoomMeetingId);
        } else {
          console.log(`   ⚠️  No Zoom Meeting ID found`);
        }
        
        console.log('   ' + '-'.repeat(60));
      }
    } else {
      console.error('❌ Unexpected response format:', response);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Zoom Recordings Checker');
  console.log(`📡 Backend URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(80));
  
  await checkAllZoomRecordings();
  
  console.log('\n✅ Check completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkAllZoomRecordings,
  checkMeetingRecordingStatus,
  checkMeetingRecordingWorkflow
};

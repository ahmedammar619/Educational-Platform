#!/usr/bin/env node

/**
 * Script to get ALL Zoom cloud recordings
 * This will fetch all recordings from your Zoom account without filtering
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoint: '/zoom/recording-test/list-all-zoom-recordings'
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

// Display meeting information
function displayMeeting(meeting, index) {
  console.log(`\n${index + 1}. Meeting: ${meeting.topic}`);
  console.log(`   Meeting ID: ${meeting.meetingId}`);
  console.log(`   UUID: ${meeting.uuid}`);
  console.log(`   Start Time: ${formatDate(meeting.startTime)}`);
  console.log(`   Duration: ${meeting.duration} minutes`);
  console.log(`   Host ID: ${meeting.hostId}`);
  console.log(`   Recording Count: ${meeting.recordingCount}`);
  console.log(`   Total Size: ${formatBytes(meeting.totalSize)}`);
  
  if (meeting.recordingFiles && meeting.recordingFiles.length > 0) {
    console.log(`   📹 Recording Files:`);
    meeting.recordingFiles.forEach((file, fileIndex) => {
      console.log(`      ${fileIndex + 1}. ${file.fileType} (${file.recordingType})`);
      console.log(`         Size: ${formatBytes(file.fileSize)}`);
      console.log(`         Status: ${file.status}`);
      console.log(`         Download URL: ${file.downloadUrl}`);
      console.log(`         Play URL: ${file.playUrl}`);
    });
  } else {
    console.log(`   ❌ No recording files found`);
  }
}

// Get all Zoom recordings
async function getAllZoomRecordings() {
  try {
    console.log('🔍 Fetching ALL Zoom cloud recordings...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoint}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      const { meetings, totalMeetings, totalRecordings, totalSize, totalSizeFormatted } = response.data;
      
      console.log(`\n📊 Summary:`);
      console.log(`   Total Meetings: ${totalMeetings}`);
      console.log(`   Total Recordings: ${totalRecordings}`);
      console.log(`   Total Size: ${totalSizeFormatted}`);
      console.log('='.repeat(80));
      
      if (meetings && meetings.length > 0) {
        console.log(`\n📋 All Meetings with Recordings:`);
        meetings.forEach((meeting, index) => {
          displayMeeting(meeting, index);
          console.log('   ' + '-'.repeat(60));
        });
        
        console.log(`\n💡 Next Steps:`);
        console.log(`   1. These recordings exist in Zoom cloud storage`);
        console.log(`   2. They should be automatically downloaded to R2`);
        console.log(`   3. Then uploaded to YouTube`);
        console.log(`   4. Check why the automatic process isn't working`);
        
        // Show which meetings have recordings
        const meetingsWithRecordings = meetings.filter(m => m.recordingCount > 0);
        if (meetingsWithRecordings.length > 0) {
          console.log(`\n🎯 Meetings with recordings:`);
          meetingsWithRecordings.forEach(meeting => {
            console.log(`   - ${meeting.topic} (ID: ${meeting.meetingId}) - ${meeting.recordingCount} files`);
          });
        }
      } else {
        console.log(`\n❌ No meetings with recordings found`);
        console.log(`\n💡 This could mean:`);
        console.log(`   1. No meetings have been recorded`);
        console.log(`   2. Recording settings are disabled`);
        console.log(`   3. All recordings are older than the default time range`);
      }
      
      return meetings;
    } else {
      console.log(`❌ Error: ${response.error}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return [];
  }
}

// Main execution
async function main() {
  console.log('🚀 Get ALL Zoom Cloud Recordings');
  console.log(`📡 Backend URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(80));
  
  const meetings = await getAllZoomRecordings();
  
  console.log('\n✅ Check completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getAllZoomRecordings
};

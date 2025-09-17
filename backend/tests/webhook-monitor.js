#!/usr/bin/env node

/**
 * Webhook Monitor - Automatically checks for new recordings and processes them
 * This simulates what the webhook would do automatically
 */

require('dotenv').config();
const http = require('http');

let processedMeetings = new Set();

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function checkForNewRecordings() {
  try {
    console.log(`🔍 [${new Date().toLocaleTimeString()}] Checking for new recordings...`);
    
    // Get all meetings from database
    const dbResponse = await makeRequest('http://localhost:3000/api/zoom/recording-test/check-database-meetings');
    
    if (dbResponse.status !== 200 || !dbResponse.data.success) {
      console.log('❌ Failed to check database meetings');
      return;
    }
    
    const meetings = dbResponse.data.data?.allMeetings || [];
    
    // Find meetings with pending recording status
    const pendingMeetings = meetings.filter(meeting => 
      meeting.recordingStatus === 'pending' && 
      !processedMeetings.has(meeting.zoomMeetingId)
    );
    
    if (pendingMeetings.length === 0) {
      console.log('📝 No new recordings to process');
      return;
    }
    
    console.log(`🎬 Found ${pendingMeetings.length} meeting(s) with pending recordings`);
    
    for (const meeting of pendingMeetings) {
      console.log(`\n🎯 Processing meeting: ${meeting.title} (${meeting.zoomMeetingId})`);
      
      // Check if recording is available in Zoom cloud
      const recordingCheck = await makeRequest(
        `http://localhost:3000/api/zoom/recording-test/check-recording-workflow/${meeting.zoomMeetingId}`
      );
      
      if (recordingCheck.status === 200 && recordingCheck.data.success && recordingCheck.data.data.hasRecordings) {
        console.log('✅ Recording found in Zoom cloud, starting processing...');
        
        // Step 1: Upload to R2
        console.log('📥 Step 1: Uploading to R2...');
        const r2Response = await makeRequest(
          `http://localhost:3000/api/zoom/recording-test/test-r2-upload/${meeting.zoomMeetingId}`,
          'POST'
        );
        
        if (r2Response.status === 200 && r2Response.data.success) {
          console.log(`✅ R2 upload successful: ${r2Response.data.data.r2Key}`);
          
          // Step 2: Upload to YouTube
          console.log('🎥 Step 2: Uploading to YouTube...');
          const youtubeResponse = await makeRequest(
            `http://localhost:3000/api/zoom/recording-test/test-youtube-upload/${meeting.zoomMeetingId}`,
            'POST'
          );
          
          if (youtubeResponse.status === 200 && youtubeResponse.data.success) {
            console.log(`✅ YouTube upload successful: ${youtubeResponse.data.data.youtubeUrl}`);
            console.log(`📺 Video Title: ${youtubeResponse.data.data.videoTitle}`);
            
            // Mark as processed
            processedMeetings.add(meeting.zoomMeetingId);
            
            console.log('🎉 Complete workflow finished successfully!');
          } else {
            console.log(`❌ YouTube upload failed: ${youtubeResponse.data?.error || 'Unknown error'}`);
            // Still mark as processed to avoid retry loops
            processedMeetings.add(meeting.zoomMeetingId);
          }
        } else {
          console.log(`❌ R2 upload failed: ${r2Response.data?.error || 'Unknown error'}`);
          // Don't mark as processed if R2 upload fails - might be temporary
        }
      } else {
        console.log('⏳ Recording not yet available in Zoom cloud, will check again later');
        
        // If this is an old meeting (more than 24 hours), probably no recording will come
        const meetingAge = Date.now() - new Date(meeting.createdAt).getTime();
        const hours = meetingAge / (1000 * 60 * 60);
        
        if (hours > 24) {
          console.log(`⚠️  Meeting is ${Math.round(hours)} hours old, likely no recording available`);
          processedMeetings.add(meeting.zoomMeetingId);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking for new recordings: ${error.message}`);
  }
}

async function startMonitoring() {
  console.log('🚀 Webhook Monitor Started');
  console.log('📡 Monitoring for new Zoom recordings every 30 seconds...');
  console.log('💡 This simulates automatic webhook processing');
  console.log('🔄 Press Ctrl+C to stop\n');
  
  // Check immediately
  await checkForNewRecordings();
  
  // Then check every 30 seconds
  setInterval(async () => {
    await checkForNewRecordings();
  }, 30000); // 30 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Webhook Monitor stopped');
  process.exit(0);
});

// Start monitoring
if (require.main === module) {
  startMonitoring().catch(console.error);
}

#!/usr/bin/env node

/**
 * Debug R2 upload issues
 */

const http = require('http');

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function checkDatabaseMeetings() {
  try {
    console.log('🔍 Checking database meetings...');
    const response = await makeRequest('http://localhost:3000/api/zoom/recording-test/check-database-meetings');
    
    if (response.status === 200 && response.data.success) {
      const meetings = response.data.data?.allMeetings || [];
      const pendingMeetings = meetings.filter(m => m.recordingStatus === 'pending');
      
      console.log(`📊 Total meetings: ${meetings.length}`);
      console.log(`📊 Pending recordings: ${pendingMeetings.length}`);
      
      if (pendingMeetings.length > 0) {
        console.log('\n📋 Meetings with pending recordings:');
        pendingMeetings.slice(0, 3).forEach(m => {
          console.log(`  📹 ${m.title} (ID: ${m.zoomMeetingId})`);
          console.log(`     Status: ${m.recordingStatus}`);
          console.log(`     Created: ${m.createdAt}`);
        });
        
        // Test one specific meeting
        const testMeeting = pendingMeetings[0];
        await testSpecificMeeting(testMeeting.zoomMeetingId);
      } else {
        console.log('✅ No pending recordings found');
      }
    } else {
      console.log('❌ Failed to get database meetings:', response.data);
    }
  } catch (error) {
    console.log('❌ Error checking meetings:', error.message);
  }
}

async function testSpecificMeeting(meetingId) {
  try {
    console.log(`\n🔍 Testing specific meeting: ${meetingId}`);
    
    // Check if recording exists in Zoom
    console.log('  Step 1: Checking Zoom recording...');
    const recordingCheck = await makeRequest(
      `http://localhost:3000/api/zoom/recording-test/check-recording-workflow/${meetingId}`
    );
    
    if (recordingCheck.status === 200 && recordingCheck.data.success) {
      const hasRecordings = recordingCheck.data.data.hasRecordings;
      console.log(`  📹 Zoom recording available: ${hasRecordings ? '✅ Yes' : '❌ No'}`);
      
      if (hasRecordings) {
        console.log('  Step 2: Testing R2 upload...');
        const r2Response = await makeRequest(
          `http://localhost:3000/api/zoom/recording-test/test-r2-upload/${meetingId}`,
          'POST'
        );
        
        console.log(`  📤 R2 upload status: ${r2Response.status}`);
        if (r2Response.data.success) {
          console.log(`  ✅ R2 upload successful: ${r2Response.data.data?.r2Key || 'N/A'}`);
          
          // Test YouTube upload too
          console.log('  Step 3: Testing YouTube upload...');
          const youtubeResponse = await makeRequest(
            `http://localhost:3000/api/zoom/recording-test/test-youtube-upload/${meetingId}`,
            'POST'
          );
          
          console.log(`  📺 YouTube upload status: ${youtubeResponse.status}`);
          if (youtubeResponse.data.success) {
            console.log(`  ✅ YouTube upload successful: ${youtubeResponse.data.data?.youtubeUrl || 'N/A'}`);
            console.log('  🎉 Complete workflow successful!');
          } else {
            console.log(`  ❌ YouTube upload failed: ${youtubeResponse.data.error || 'Unknown error'}`);
          }
        } else {
          console.log(`  ❌ R2 upload failed: ${r2Response.data.error || 'Unknown error'}`);
          console.log(`  📝 Full response:`, JSON.stringify(r2Response.data, null, 2));
        }
      }
    } else {
      console.log('  ❌ Failed to check Zoom recording:', recordingCheck.data);
    }
  } catch (error) {
    console.log(`  ❌ Error testing meeting ${meetingId}:`, error.message);
  }
}

async function main() {
  console.log('🚀 R2 Upload Debug Test');
  console.log('='.repeat(50));
  
  await checkDatabaseMeetings();
}

if (require.main === module) {
  main().catch(console.error);
}

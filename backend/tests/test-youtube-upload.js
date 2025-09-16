#!/usr/bin/env node

/**
 * Test script to test YouTube upload from R2
 * This will test the complete R2 → YouTube workflow
 */

require('dotenv').config();
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  testMeetingId: '88982449475'
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const bodyString = options.body || '';
    const bodyLength = Buffer.byteLength(bodyString, 'utf8');
    
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyLength.toString(),
        ...options.headers
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (bodyString) {
      req.write(bodyString);
    }
    
    req.end();
  });
}

/**
 * Test YouTube upload from R2
 */
async function testYouTubeUpload() {
  try {
    console.log('🔍 Testing YouTube upload from R2...');
    
    // First, upload to R2
    console.log('📤 Step 1: Uploading recording to R2...');
    const r2Response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/test-r2-upload/${CONFIG.testMeetingId}`, {
      method: 'POST'
    });
    
    if (r2Response.status !== 200 || !r2Response.data.success) {
      console.log('❌ R2 upload failed');
      return false;
    }
    
    console.log('✅ R2 upload successful');
    console.log(`   R2 Key: ${r2Response.data.data.r2Key}`);
    console.log(`   R2 URL: ${r2Response.data.data.r2Url}`);
    
    // Now test the complete recording processing workflow
    console.log('\n📤 Step 2: Testing complete recording processing workflow...');
    
    // Simulate webhook payload
    const webhookPayload = {
      event: 'recording.completed',
      payload: {
        account_id: 'test-account',
        object: {
          uuid: 'test-uuid',
          id: CONFIG.testMeetingId,
          host_id: 'test-host',
          topic: 'Test Recording',
          type: 2,
          start_time: '2025-09-16T16:38:51Z',
          duration: 21,
          timezone: 'America/Chicago',
          created_at: '2025-09-16T15:13:36.485Z',
          join_url: 'https://zoom.us/j/test',
          recording_files: [
            {
              id: 'test-file-id',
              meeting_id: 'test-meeting-id',
              recording_start: '2025-09-16T16:38:52Z',
              recording_end: '2025-09-16T16:39:13Z',
              file_type: 'MP4',
              file_size: 379661,
              play_url: 'https://zoom.us/rec/play/test',
              download_url: r2Response.data.data.r2Url, // Use R2 URL as download URL
              status: 'completed',
              recording_type: 'shared_screen_with_speaker_view'
            }
          ]
        }
      },
      event_ts: Date.now()
    };
    
    const webhookResponse = await makeRequest(`${CONFIG.baseUrl}/webhooks/zoom/events`, {
      method: 'POST',
      body: JSON.stringify(webhookPayload)
    });
    
    if (webhookResponse.status !== 201) {
      console.log(`❌ Webhook processing failed: ${webhookResponse.status}`);
      console.log(`   Response: ${JSON.stringify(webhookResponse.data)}`);
      return false;
    }
    
    console.log('✅ Webhook processing successful');
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting 5 seconds for YouTube upload processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the final status
    console.log('\n🔍 Step 3: Checking final recording status...');
    const statusResponse = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/check-database-meetings`);
    
    if (statusResponse.status === 200 && statusResponse.data.success) {
      const targetMeeting = statusResponse.data.data.targetMeeting;
      console.log(`   Recording Status: ${targetMeeting.recordingStatus}`);
      
      if (targetMeeting.youtubeVideoId && targetMeeting.youtubeVideoId !== 'skipped' && targetMeeting.youtubeVideoId !== 'skipped-streaming') {
        console.log(`✅ YouTube upload successful!`);
        console.log(`   YouTube Video ID: ${targetMeeting.youtubeVideoId}`);
        console.log(`   YouTube URL: ${targetMeeting.youtubeUrl}`);
        return true;
      } else {
        console.log(`⚠️  YouTube upload skipped or failed`);
        console.log(`   YouTube Video ID: ${targetMeeting.youtubeVideoId}`);
        console.log(`   YouTube URL: ${targetMeeting.youtubeUrl}`);
        return false;
      }
    } else {
      console.log('❌ Failed to check recording status');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ YouTube upload test error: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 YouTube Upload Test');
  console.log('='.repeat(50));
  
  const result = await testYouTubeUpload();
  
  console.log('\n📊 YouTube Upload Test Results:');
  console.log(`   Result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (result) {
    console.log('\n🎉 YouTube upload workflow is working!');
    console.log('   Videos should be uploaded to YouTube with unlisted privacy');
    console.log('   Only people with the link can access the videos');
  } else {
    console.log('\n💡 YouTube upload workflow needs attention');
    console.log('   Check server logs for error messages');
    console.log('   Verify YouTube API credentials are working');
  }
  
  console.log('\n✅ Test completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testYouTubeUpload
};

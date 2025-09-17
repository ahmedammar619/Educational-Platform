#!/usr/bin/env node

/**
 * Test webhook through ngrok tunnel
 */

require('dotenv').config();
const crypto = require('crypto');
const https = require('https');

function makeRequest(url, method = 'POST', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    const req = https.request(options, (res) => {
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
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testNgrokWebhook() {
  console.log('🚀 Testing Webhook Through ngrok');
  console.log('='.repeat(50));
  
  const ngrokUrl = 'https://30ee77dc80e2.ngrok-free.app';
  const webhookUrl = `${ngrokUrl}/api/webhooks/zoom/events`;
  
  // Test webhook payload for "final test" meeting
  const webhookPayload = {
    event: 'recording.completed',
    payload: {
      account_id: 'test-account',
      object: {
        uuid: 'test-uuid',
        id: '85107669369', // "final test" meeting ID
        host_id: 'test-host',
        topic: 'final test',
        type: 2,
        start_time: '2025-09-17T17:22:48Z',
        duration: 23,
        timezone: 'UTC',
        created_at: '2025-09-17T17:22:48Z',
        join_url: 'https://zoom.us/j/85107669369',
        recording_files: [
          {
            id: 'test-recording-id',
            meeting_id: '85107669369',
            recording_start: '2025-09-17T17:22:48Z',
            recording_end: '2025-09-17T17:23:11Z',
            file_type: 'MP4',
            file_size: 500000,
            play_url: 'https://us02web.zoom.us/rec/play/test',
            download_url: 'https://us02web.zoom.us/rec/download/test',
            status: 'completed',
            recording_type: 'shared_screen_with_speaker_view'
          }
        ]
      }
    },
    event_ts: Date.now()
  };
  
  try {
    console.log('📤 Sending webhook to ngrok URL...');
    console.log(`URL: ${webhookUrl}`);
    console.log(`Meeting: ${webhookPayload.payload.object.topic} (${webhookPayload.payload.object.id})`);
    
    // Create webhook signature
    const webhookSecret = 'oA-6ayg0TyuF1Qw_JiFguw';
    const bodyString = JSON.stringify(webhookPayload);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');
    
    const headers = {
      'authorization': `sha256=${signature}`,
    };
    
    const response = await makeRequest(webhookUrl, 'POST', webhookPayload, headers);
    
    if (response.status === 200) {
      console.log('✅ Webhook processed successfully!');
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      console.log('\n🔍 Checking if meeting was processed...');
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if the meeting status was updated
      const checkUrl = `${ngrokUrl}/api/zoom/recording-test/check-database-meetings`;
      const dbCheck = await makeRequest(checkUrl, 'GET');
      
      if (dbCheck.status === 200 && dbCheck.data.success) {
        const meetings = dbCheck.data.data?.allMeetings || [];
        const testMeeting = meetings.find(m => m.zoomMeetingId === '85107669369');
        
        if (testMeeting) {
          console.log('✅ Meeting found in database!');
          console.log(`   Title: ${testMeeting.title}`);
          console.log(`   Status: ${testMeeting.recordingStatus}`);
          
          if (testMeeting.recordingStatus === 'completed') {
            console.log('🎉 Automatic processing worked!');
          } else {
            console.log('⏳ Processing may still be in progress...');
          }
        } else {
          console.log('❌ Meeting not found in database');
        }
      }
      
    } else {
      console.log(`❌ Webhook failed: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing webhook: ${error.message}`);
  }
}

async function main() {
  await testNgrokWebhook();
  console.log('\n✅ ngrok webhook test completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}


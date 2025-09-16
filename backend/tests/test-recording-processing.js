#!/usr/bin/env node

/**
 * Test script to trigger recording processing manually
 * This will help us debug why the automatic processing isn't working
 */

const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  meetingId: '88982449475', // Our target meeting
  webhookSecret: 'oA-6ayg0TyuF1Qw_JiFguw'
};

/**
 * Make HTTP request with proper Content-Length header
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
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Generate webhook signature
 */
function generateSignature(payload, secret) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Test recording.completed webhook with real Zoom data
 */
async function testRecordingCompletedWebhook() {
  try {
    console.log('🔍 Testing recording.completed webhook with real Zoom data...');
    
    // Create a realistic webhook payload based on the Zoom recordings we found
    const payload = {
      event: 'recording.completed',
      payload: {
        account_id: 'test-account',
        object: {
          uuid: 'LKRTxVilSDCdzhhSaVHkbg==',
          id: CONFIG.meetingId,
          host_id: '44tzCtRkTLeXmbxsAqyvZA',
          topic: 'math',
          type: 2,
          start_time: '2025-09-16T19:38:51Z',
          duration: 0,
          timezone: 'UTC',
          created_at: '2025-09-16T19:38:51Z',
          join_url: 'https://zoom.us/j/88982449475',
          recording_files: [
            {
              id: 'recording-1',
              meeting_id: CONFIG.meetingId,
              recording_start: '2025-09-16T19:38:51Z',
              recording_end: '2025-09-16T19:39:00Z',
              file_type: 'MP4',
              file_size: 370760,
              play_url: 'https://zoom.us/rec/play/test',
              download_url: 'https://us02web.zoom.us/rec/download/i_RKvUstdeO-6ArMYKmRkvaA2nuq76Np5uEjiHKBdyzw1dRnyWxu6omigoK4Ztes83xrFT991Ft1a8gx.xNkjqK38bxoE268b',
              status: 'completed',
              recording_type: 'shared_screen_with_speaker_view'
            },
            {
              id: 'recording-2',
              meeting_id: CONFIG.meetingId,
              recording_start: '2025-09-16T19:38:51Z',
              recording_end: '2025-09-16T19:39:00Z',
              file_type: 'M4A',
              file_size: 325010,
              play_url: 'https://zoom.us/rec/play/test-audio',
              download_url: 'https://us02web.zoom.us/rec/download/q__AcYeQLEL01lUth-TdX65IE27h2JG6RqszDqwhOEillj44qRFKeLtGJvvIRK6VsF16RsXXDzTgqiKt.-BvEKhBbKkA_CUgL',
              status: 'completed',
              recording_type: 'audio_only'
            }
          ]
        }
      },
      event_ts: Math.floor(Date.now() / 1000)
    };

    const signature = generateSignature(payload, CONFIG.webhookSecret);
    
    const response = await makeRequest(`${CONFIG.baseUrl}/webhooks/zoom/events`, {
      method: 'POST',
      headers: {
        'x-zoom-signature': signature
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Recording completed webhook processed successfully');
      return true;
    } else {
      console.log('❌ Recording completed webhook failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing recording completed webhook: ${error.message}`);
    return false;
  }
}

/**
 * Check recording status after webhook
 */
async function checkRecordingStatus() {
  try {
    console.log('🔍 Checking recording status after webhook...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/check-database-meetings`);
    
    if (response.status === 200 && response.data.success) {
      const targetMeeting = response.data.data.targetMeeting;
      console.log(`   Recording Status: ${targetMeeting.recordingStatus}`);
      console.log(`   Meeting Status: ${targetMeeting.status}`);
      
      if (targetMeeting.recordingStatus === 'completed') {
        console.log('✅ Recording status updated to completed!');
        return true;
      } else if (targetMeeting.recordingStatus === 'failed') {
        console.log('❌ Recording status shows failed');
        return false;
      } else {
        console.log('⚠️ Recording status still pending - processing may be in progress or failed');
        return false;
      }
    } else {
      console.log('❌ Failed to check recording status');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking recording status: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Recording Processing Test');
  console.log('='.repeat(50));
  console.log(`📋 Target Meeting ID: ${CONFIG.meetingId}`);
  console.log('');
  
  // Step 1: Send recording.completed webhook
  const webhookSuccess = await testRecordingCompletedWebhook();
  console.log('');
  
  // Step 2: Wait a moment for processing
  console.log('⏳ Waiting 3 seconds for processing...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('');
  
  // Step 3: Check recording status
  const statusUpdated = await checkRecordingStatus();
  
  console.log('\n📊 Test Results:');
  console.log(`   Webhook Processing: ${webhookSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Status Updated: ${statusUpdated ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (!statusUpdated) {
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check server logs for error messages');
    console.log('   2. Verify R2 service is working');
    console.log('   3. Check Zoom API service is working');
    console.log('   4. Verify all dependencies are available');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

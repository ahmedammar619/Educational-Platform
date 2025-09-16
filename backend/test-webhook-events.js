#!/usr/bin/env node

/**
 * Script to test webhook with sample Zoom events
 * This simulates real Zoom webhook events
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  webhookEndpoint: '/webhooks/zoom/events',
  webhookSecret: 'your-webhook-secret-here' // Update this with your actual secret
};

// Sample Zoom webhook events
const SAMPLE_EVENTS = {
  recordingCompleted: {
    event: 'recording.completed',
    payload: {
      account_id: 'test-account-id',
      object: {
        uuid: 'test-uuid-123',
        id: '88982449475', // Use your actual meeting ID
        host_id: 'test-host-id',
        topic: 'Test Meeting',
        type: 2,
        start_time: '2025-09-16T19:00:00Z',
        duration: 30,
        timezone: 'America/Chicago',
        created_at: '2025-09-16T18:00:00Z',
        join_url: 'https://zoom.us/j/test-meeting',
        recording_files: [
          {
            id: 'test-recording-id',
            meeting_id: '88982449475',
            recording_start: '2025-09-16T19:00:00Z',
            recording_end: '2025-09-16T19:30:00Z',
            file_type: 'MP4',
            file_size: 1024000,
            play_url: 'https://zoom.us/rec/play/test-play-url',
            download_url: 'https://zoom.us/rec/download/test-download-url',
            status: 'completed',
            recording_type: 'shared_screen_with_speaker_view'
          }
        ]
      }
    },
    event_ts: Date.now()
  },
  
  recordingStarted: {
    event: 'recording.started',
    payload: {
      account_id: 'test-account-id',
      object: {
        uuid: 'test-uuid-123',
        id: '88982449475',
        host_id: 'test-host-id',
        topic: 'Test Meeting',
        type: 2,
        start_time: '2025-09-16T19:00:00Z',
        duration: 30,
        timezone: 'America/Chicago',
        created_at: '2025-09-16T18:00:00Z',
        join_url: 'https://zoom.us/j/test-meeting'
      }
    },
    event_ts: Date.now()
  },
  
  meetingEnded: {
    event: 'meeting.ended',
    payload: {
      account_id: 'test-account-id',
      object: {
        uuid: 'test-uuid-123',
        id: '88982449475',
        host_id: 'test-host-id',
        topic: 'Test Meeting',
        type: 2,
        start_time: '2025-09-16T19:00:00Z',
        duration: 30,
        timezone: 'America/Chicago',
        created_at: '2025-09-16T18:00:00Z',
        join_url: 'https://zoom.us/j/test-meeting'
      }
    },
    event_ts: Date.now()
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
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Generate webhook signature
function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Test webhook with specific event
async function testWebhookEvent(eventName, eventData) {
  try {
    console.log(`🔍 Testing ${eventName} event...`);
    
    const url = `${CONFIG.baseUrl}${CONFIG.webhookEndpoint}`;
    const signature = generateWebhookSignature(eventData, CONFIG.webhookSecret);
    
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'x-zoom-signature': `sha256=${signature}`,
        'x-zoom-signature-timestamp': Date.now().toString()
      },
      body: JSON.stringify(eventData)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200) {
      console.log(`✅ ${eventName} event processed successfully`);
      return true;
    } else {
      console.log(`❌ ${eventName} event failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${eventName} test failed: ${error.message}`);
    return false;
  }
}

// Test webhook without signature (should fail)
async function testWebhookWithoutSignature(eventData) {
  try {
    console.log('🔍 Testing webhook without signature (should fail)...');
    
    const url = `${CONFIG.baseUrl}${CONFIG.webhookEndpoint}`;
    
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 401) {
      console.log('✅ Webhook correctly rejected request without signature');
      return true;
    } else {
      console.log('❌ Webhook should have rejected request without signature');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Webhook Events Testing');
  console.log('='.repeat(50));
  
  console.log('📋 Testing webhook events:');
  console.log(`   Endpoint: ${CONFIG.baseUrl}${CONFIG.webhookEndpoint}`);
  console.log(`   Secret: ${CONFIG.webhookSecret.substring(0, 10)}...`);
  console.log('');
  
  // Test without signature first
  const noSignatureTest = await testWebhookWithoutSignature(SAMPLE_EVENTS.recordingCompleted);
  console.log('');
  
  // Test recording started event
  const recordingStartedTest = await testWebhookEvent('recording.started', SAMPLE_EVENTS.recordingStarted);
  console.log('');
  
  // Test recording completed event
  const recordingCompletedTest = await testWebhookEvent('recording.completed', SAMPLE_EVENTS.recordingCompleted);
  console.log('');
  
  // Test meeting ended event
  const meetingEndedTest = await testWebhookEvent('meeting.ended', SAMPLE_EVENTS.meetingEnded);
  console.log('');
  
  console.log('📊 Results Summary:');
  console.log(`   No Signature Test: ${noSignatureTest ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   Recording Started: ${recordingStartedTest ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   Recording Completed: ${recordingCompletedTest ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   Meeting Ended: ${meetingEndedTest ? '✅ Passed' : '❌ Failed'}`);
  
  if (recordingCompletedTest) {
    console.log('\n🎯 Recording completed event worked!');
    console.log('   Check your database for:');
    console.log('   - Meeting status updates');
    console.log('   - Recording processing');
    console.log('   - R2 upload attempts');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Update webhook secret in this script');
  console.log('   2. Configure webhook URL in Zoom marketplace');
  console.log('   3. Test with real Zoom events');
  
  console.log('\n✅ Webhook events testing completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testWebhookEvent,
  testWebhookWithoutSignature
};

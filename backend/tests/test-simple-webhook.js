#!/usr/bin/env node

/**
 * Simple webhook test to isolate the issue
 * This will test just the webhook reception without complex processing
 */

const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
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
 * Test webhook with minimal payload
 */
async function testMinimalWebhook() {
  try {
    console.log('🔍 Testing webhook with minimal payload...');
    
    // Create a minimal webhook payload
    const payload = {
      event: 'recording.completed',
      payload: {
        account_id: 'test-account',
        object: {
          uuid: 'test-uuid',
          id: '88982449475',
          host_id: 'test-host',
          topic: 'test-meeting',
          type: 2,
          start_time: '2025-09-16T19:38:51Z',
          duration: 0,
          timezone: 'UTC',
          created_at: '2025-09-16T19:38:51Z',
          join_url: 'https://zoom.us/j/88982449475',
          recording_files: [] // Empty recording files to avoid download issues
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
      console.log('✅ Minimal webhook processed successfully');
      return true;
    } else {
      console.log('❌ Minimal webhook failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing minimal webhook: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook with recording files but no download URLs
 */
async function testWebhookWithFiles() {
  try {
    console.log('🔍 Testing webhook with recording files (no download URLs)...');
    
    const payload = {
      event: 'recording.completed',
      payload: {
        account_id: 'test-account',
        object: {
          uuid: 'test-uuid',
          id: '88982449475',
          host_id: 'test-host',
          topic: 'test-meeting',
          type: 2,
          start_time: '2025-09-16T19:38:51Z',
          duration: 0,
          timezone: 'UTC',
          created_at: '2025-09-16T19:38:51Z',
          join_url: 'https://zoom.us/j/88982449475',
          recording_files: [
            {
              id: 'recording-1',
              meeting_id: '88982449475',
              recording_start: '2025-09-16T19:38:51Z',
              recording_end: '2025-09-16T19:39:00Z',
              file_type: 'MP4',
              file_size: 370760,
              play_url: 'https://zoom.us/rec/play/test',
              download_url: '', // Empty download URL
              status: 'completed',
              recording_type: 'shared_screen_with_speaker_view'
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
      console.log('✅ Webhook with files processed successfully');
      return true;
    } else {
      console.log('❌ Webhook with files failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing webhook with files: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Simple Webhook Test');
  console.log('='.repeat(50));
  
  const minimalTest = await testMinimalWebhook();
  console.log('');
  const filesTest = await testWebhookWithFiles();
  
  console.log('\n📊 Simple Webhook Test Results:');
  console.log(`   Minimal Payload: ${minimalTest ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   With Files: ${filesTest ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (minimalTest && filesTest) {
    console.log('\n🎉 Webhook processing works with simple payloads!');
    console.log('   The issue is likely in the Zoom API download or R2 upload.');
  } else {
    console.log('\n⚠️ Webhook processing fails even with simple payloads.');
    console.log('   The issue is in the basic webhook processing logic.');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}


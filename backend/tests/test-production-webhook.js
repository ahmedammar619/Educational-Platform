#!/usr/bin/env node

/**
 * Test Production Webhook
 * Tests webhook functionality on production API
 */

require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  productionUrl: 'https://api.baraemalnour.org/api/webhooks/zoom/events',
  webhookSecret: 'oA-6ayg0TyuF1Qw_JiFguw'
};

/**
 * Generate webhook signature
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Make HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const bodyString = options.body || '';
    const bodyLength = Buffer.byteLength(bodyString, 'utf8');
    
    const req = https.request(url, {
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
 * Test webhook with recording completed event
 */
async function testRecordingCompleted() {
  try {
    console.log('🔍 Testing recording.completed webhook on production...');
    
    const payload = {
      event: 'recording.completed',
      payload: {
        account_id: 'test-account',
        object: {
          uuid: 'test-uuid',
          id: '123456789',
          host_id: 'test-host',
          topic: 'Production Test Meeting',
          type: 2,
          start_time: new Date().toISOString(),
          duration: 60,
          timezone: 'UTC',
          created_at: new Date().toISOString(),
          join_url: 'https://zoom.us/j/123456789',
          recording_files: [
            {
              id: 'recording-123',
              meeting_id: '123456789',
              recording_start: new Date().toISOString(),
              recording_end: new Date(Date.now() + 60000).toISOString(),
              file_type: 'MP4',
              file_size: 5000000,
              play_url: 'https://zoom.us/rec/play/test',
              download_url: '', // Empty download URL to test placeholder logic
              status: 'completed',
              recording_type: 'shared_screen_with_speaker_view'
            }
          ]
        }
      },
      event_ts: Math.floor(Date.now() / 1000)
    };

    const signature = generateSignature(payload, CONFIG.webhookSecret);
    
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);
    
    const response = await makeRequest(CONFIG.productionUrl, {
      method: 'POST',
      headers: {
        'x-zoom-signature': signature
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Production webhook test successful!');
      return true;
    } else {
      console.log('❌ Production webhook test failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Production webhook test error: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook validation
 */
async function testWebhookValidation() {
  try {
    console.log('🔍 Testing webhook validation on production...');
    
    const response = await makeRequest('https://api.baraemalnour.org/api/webhooks/zoom/validation', {
      method: 'POST',
      headers: {
        'x-zoom-validation-token': 'test-validation-token'
      },
      body: JSON.stringify({ test: 'validation' })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Production webhook validation successful!');
      return true;
    } else {
      console.log('❌ Production webhook validation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Production webhook validation error: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Production Webhook Test');
  console.log('='.repeat(50));
  console.log(`📋 Configuration:`);
  console.log(`   Production URL: ${CONFIG.productionUrl}`);
  console.log(`   Webhook Secret: ${CONFIG.webhookSecret.substring(0, 10)}...`);
  console.log('');
  
  const validationTest = await testWebhookValidation();
  console.log('');
  const recordingTest = await testRecordingCompleted();
  
  console.log('\n📊 Production Test Results:');
  console.log(`   Validation: ${validationTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recording Completed: ${recordingTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (validationTest && recordingTest) {
    console.log('\n🎉 Production webhook system is fully functional!');
    console.log('   Ready for Zoom webhook configuration!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above for details.');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

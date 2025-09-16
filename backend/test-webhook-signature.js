#!/usr/bin/env node

/**
 * Script to test webhook endpoints with proper signature generation
 * This script generates valid HMAC-SHA256 signatures for testing
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  // Local testing
  localUrl: 'http://localhost:3000/api/webhooks/zoom/events',
  // Production URL (update this with your actual domain)
  productionUrl: 'https://backend-production-ece4.up.railway.app/api/webhooks/zoom/events',
  // Validation endpoint
  validationUrl: 'https://backend-production-ece4.up.railway.app/api/webhooks/zoom/validation',
  // Webhook secret for signature generation (use 'test-secret' for testing)
  webhookSecret: process.env.ZOOM_WEBHOOK_SECRET || 'test-secret'
};

// Sample webhook payloads for testing
const TEST_PAYLOADS = {
  recordingCompleted: {
    event: 'recording.completed',
    payload: {
      account_id: 'test-account',
      object: {
        uuid: 'test-uuid-123',
        id: '123456789',
        host_id: 'test-host',
        topic: 'Test Meeting',
        type: 2,
        start_time: '2025-09-16T21:00:00.000Z',
        duration: 60,
        timezone: 'UTC',
        created_at: '2025-09-16T21:00:00.000Z',
        join_url: 'https://zoom.us/j/123456789',
        recording_files: [
          {
            id: 'recording-123',
            meeting_id: '123456789',
            recording_start: '2025-09-16T21:00:00.000Z',
            recording_end: '2025-09-16T21:00:00.000Z',
            file_type: 'MP4',
            file_size: 1024000,
            play_url: 'https://example.com/play.mp4',
            download_url: 'https://example.com/download.mp4',
            status: 'completed',
            recording_type: 'shared_screen_with_speaker_view'
          }
        ]
      }
    },
    event_ts: 1758057600000
  },
  meetingEnded: {
    event: 'meeting.ended',
    payload: {
      account_id: 'test-account',
      object: {
        uuid: 'test-uuid-456',
        id: '987654321',
        host_id: 'test-host',
        topic: 'Test Meeting Ended',
        type: 2,
        start_time: '2025-09-16T21:00:00.000Z',
        duration: 30,
        timezone: 'UTC',
        created_at: '2025-09-16T21:00:00.000Z',
        join_url: 'https://zoom.us/j/987654321'
      }
    },
    event_ts: 1758057600000
  },
  validation: {
    event: 'endpoint.url_validation',
    payload: {
      plainToken: 'test-validation-token'
    },
    event_ts: 1758057600000
  }
};

/**
 * Generate HMAC-SHA256 signature for webhook payload
 * @param {object} payload - The webhook payload
 * @param {string} secret - The webhook secret
 * @returns {string} The signature
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
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

// Test webhook endpoint with proper signature
async function testWebhookWithSignature(url, payload, testName) {
  try {
    console.log(`🔍 Testing ${testName}...`);
    
    const signature = generateSignature(payload, CONFIG.webhookSecret);
    console.log(`   Generated signature: ${signature}`);
    console.log(`   Payload: ${JSON.stringify(payload)}`);
    
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'x-zoom-signature': signature,
        'x-zoom-timestamp': Date.now().toString()
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${testName} successful`);
      return true;
    } else {
      console.log(`❌ ${testName} failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName} error: ${error.message}`);
    return false;
  }
}

// Test webhook without signature (for testing mode)
async function testWebhookWithoutSignature(url, payload, testName) {
  try {
    console.log(`🔍 Testing ${testName} (no signature)...`);
    
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${testName} successful (no signature)`);
      return true;
    } else {
      console.log(`❌ ${testName} failed (no signature)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName} error: ${error.message}`);
    return false;
  }
}

// Test webhook validation endpoint
async function testWebhookValidation(url) {
  try {
    console.log('🔍 Testing webhook validation endpoint...');
    
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'x-zoom-validation-token': 'test-validation-token'
      },
      body: JSON.stringify(TEST_PAYLOADS.validation)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook validation successful');
      return true;
    } else {
      console.log('❌ Webhook validation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook validation error: ${error.message}`);
    return false;
  }
}

// Test signature generation
function testSignatureGeneration() {
  console.log('🔍 Testing signature generation...');
  
  const testPayload = { test: 'signature generation' };
  const signature = generateSignature(testPayload, CONFIG.webhookSecret);
  
  console.log(`   Payload: ${JSON.stringify(testPayload)}`);
  console.log(`   Secret: ${CONFIG.webhookSecret}`);
  console.log(`   Generated Signature: ${signature}`);
  
  // Verify signature
  const hmac = crypto.createHmac('sha256', CONFIG.webhookSecret);
  hmac.update(JSON.stringify(testPayload));
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  
  if (signature === expectedSignature) {
    console.log('✅ Signature generation working correctly');
    return true;
  } else {
    console.log('❌ Signature generation failed');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Webhook Signature Testing');
  console.log('='.repeat(50));
  
  console.log('📋 Configuration:');
  console.log(`   Local URL: ${CONFIG.localUrl}`);
  console.log(`   Production URL: ${CONFIG.productionUrl}`);
  console.log(`   Validation URL: ${CONFIG.validationUrl}`);
  console.log(`   Webhook Secret: ${CONFIG.webhookSecret}`);
  console.log('');
  
  // Test signature generation first
  const signatureWorks = testSignatureGeneration();
  console.log('');
  
  if (!signatureWorks) {
    console.log('❌ Cannot proceed without working signature generation');
    return;
  }
  
  // Test local endpoints
  console.log('🏠 Testing Local Endpoints:');
  console.log('-'.repeat(30));
  
  const localRecordingTest = await testWebhookWithSignature(
    CONFIG.localUrl, 
    TEST_PAYLOADS.recordingCompleted, 
    'Local Recording Completed'
  );
  console.log('');
  
  const localMeetingTest = await testWebhookWithSignature(
    CONFIG.localUrl, 
    TEST_PAYLOADS.meetingEnded, 
    'Local Meeting Ended'
  );
  console.log('');
  
  const localNoSigTest = await testWebhookWithoutSignature(
    CONFIG.localUrl, 
    TEST_PAYLOADS.recordingCompleted, 
    'Local No Signature Test'
  );
  console.log('');
  
  // Test production endpoints
  console.log('🌐 Testing Production Endpoints:');
  console.log('-'.repeat(30));
  
  const productionRecordingTest = await testWebhookWithSignature(
    CONFIG.productionUrl, 
    TEST_PAYLOADS.recordingCompleted, 
    'Production Recording Completed'
  );
  console.log('');
  
  const productionValidationTest = await testWebhookValidation(CONFIG.validationUrl);
  console.log('');
  
  // Results summary
  console.log('\n📊 Results Summary:');
  console.log('='.repeat(50));
  console.log(`   Signature Generation: ${signatureWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Local Recording Test: ${localRecordingTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Local Meeting Test: ${localMeetingTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Local No Signature: ${localNoSigTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Production Recording: ${productionRecordingTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Production Validation: ${productionValidationTest ? '✅ Working' : '❌ Failed'}`);
  
  // Troubleshooting tips
  console.log('\n💡 Troubleshooting Tips:');
  console.log('-'.repeat(30));
  
  if (!localRecordingTest && !localNoSigTest) {
    console.log('❌ Local webhook issues:');
    console.log('   1. Make sure your backend server is running on port 3000');
    console.log('   2. Check if ZOOM_WEBHOOK_SECRET is set in your environment');
    console.log('   3. Verify the webhook routes are properly registered');
  }
  
  if (!productionRecordingTest) {
    console.log('❌ Production webhook issues:');
    console.log('   1. Check if your production server is running');
    console.log('   2. Verify the production URL is correct');
    console.log('   3. Check firewall/network settings');
    console.log('   4. Ensure webhook routes are deployed');
  }
  
  if (localRecordingTest && !productionRecordingTest) {
    console.log('🎯 Solution: Use ngrok for testing');
    console.log('   1. Install ngrok: npm install -g ngrok');
    console.log('   2. Run: ngrok http 3000');
    console.log('   3. Use the https URL in Zoom webhook settings');
    console.log('   4. Update CONFIG.productionUrl with your ngrok URL');
  }
  
  console.log('\n✅ Webhook signature testing completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateSignature,
  testWebhookWithSignature,
  testWebhookWithoutSignature,
  testWebhookValidation,
  testSignatureGeneration
};

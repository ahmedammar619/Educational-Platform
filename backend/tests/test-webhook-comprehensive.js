#!/usr/bin/env node

/**
 * Comprehensive Webhook Test
 * Tests all webhook functionality including signatures, endpoints, and events
 */

const http = require('http');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  localUrl: 'http://localhost:3000/api/webhooks/zoom/events',
  validationUrl: 'http://localhost:3000/api/webhooks/zoom/validation',
  webhookSecret: 'oA-6ayg0TyuF1Qw_JiFguw'
};

// Test payloads for different events
const TEST_PAYLOADS = {
  recordingCompleted: {
    event: 'recording.completed',
    payload: {
      account_id: 'test-account',
      object: {
        id: '123456789',
        topic: 'Test Meeting',
        recording_files: [{
          id: 'recording-123',
          file_type: 'MP4',
          status: 'completed'
        }]
      }
    },
    event_ts: Date.now()
  },
  recordingStarted: {
    event: 'recording.started',
    payload: {
      account_id: 'test-account',
      object: {
        id: '987654321',
        topic: 'Test Meeting Started'
      }
    },
    event_ts: Date.now()
  },
  recordingStopped: {
    event: 'recording.stopped',
    payload: {
      account_id: 'test-account',
      object: {
        id: '555666777',
        topic: 'Test Meeting Stopped'
      }
    },
    event_ts: Date.now()
  },
  meetingEnded: {
    event: 'meeting.ended',
    payload: {
      account_id: 'test-account',
      object: {
        id: '111222333',
        topic: 'Test Meeting Ended'
      }
    },
    event_ts: Date.now()
  }
};

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

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
 * Test webhook validation endpoint
 */
async function testValidationEndpoint() {
  try {
    console.log('🔍 Testing webhook validation endpoint...');
    
    const response = await makeRequest(CONFIG.validationUrl, {
      method: 'POST',
      headers: {
        'x-zoom-validation-token': 'test-validation-token'
      },
      body: JSON.stringify({ test: 'validation' })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Validation endpoint working');
      return true;
    } else {
      console.log('❌ Validation endpoint failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Validation test error: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook event with proper signature
 */
async function testWebhookEvent(eventName, payload) {
  try {
    console.log(`🔍 Testing ${eventName} event...`);
    
    const signature = generateSignature(payload, CONFIG.webhookSecret);
    console.log(`   Generated signature: ${signature.substring(0, 20)}...`);
    
    const response = await makeRequest(CONFIG.localUrl, {
      method: 'POST',
      headers: {
        'x-zoom-signature': signature
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${eventName} event successful`);
      return true;
    } else {
      console.log(`❌ ${eventName} event failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${eventName} test error: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook without signature (should fail)
 */
async function testWithoutSignature() {
  try {
    console.log('🔍 Testing webhook without signature (should fail)...');
    
    const response = await makeRequest(CONFIG.localUrl, {
      method: 'POST',
      body: JSON.stringify(TEST_PAYLOADS.recordingCompleted)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected request without signature');
      return true;
    } else {
      console.log('❌ Should have rejected request without signature');
      return false;
    }
  } catch (error) {
    console.log(`❌ No signature test error: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook with invalid signature (should fail)
 */
async function testInvalidSignature() {
  try {
    console.log('🔍 Testing webhook with invalid signature (should fail)...');
    
    const response = await makeRequest(CONFIG.localUrl, {
      method: 'POST',
      headers: {
        'x-zoom-signature': 'sha256=invalid_signature_12345'
      },
      body: JSON.stringify(TEST_PAYLOADS.recordingCompleted)
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected request with invalid signature');
      return true;
    } else {
      console.log('❌ Should have rejected request with invalid signature');
      return false;
    }
  } catch (error) {
    console.log(`❌ Invalid signature test error: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Comprehensive Webhook Testing');
  console.log('='.repeat(60));
  console.log('📋 Configuration:');
  console.log(`   Events URL: ${CONFIG.localUrl}`);
  console.log(`   Validation URL: ${CONFIG.validationUrl}`);
  console.log(`   Webhook Secret: ${CONFIG.webhookSecret.substring(0, 10)}...`);
  console.log('');
  
  const results = {
    validation: await testValidationEndpoint(),
    noSignature: await testWithoutSignature(),
    invalidSignature: await testInvalidSignature(),
    recordingCompleted: await testWebhookEvent('recording.completed', TEST_PAYLOADS.recordingCompleted),
    recordingStarted: await testWebhookEvent('recording.started', TEST_PAYLOADS.recordingStarted),
    recordingStopped: await testWebhookEvent('recording.stopped', TEST_PAYLOADS.recordingStopped),
    meetingEnded: await testWebhookEvent('meeting.ended', TEST_PAYLOADS.meetingEnded)
  };
  
  console.log('\n📊 Comprehensive Test Results:');
  console.log('='.repeat(60));
  console.log(`   Validation Endpoint: ${results.validation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   No Signature Test: ${results.noSignature ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Invalid Signature Test: ${results.invalidSignature ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recording Completed: ${results.recordingCompleted ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recording Started: ${results.recordingStarted ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recording Stopped: ${results.recordingStopped ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Meeting Ended: ${results.meetingEnded ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n🎯 Summary:');
  console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your webhook system is fully functional!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run the comprehensive test
if (require.main === module) {
  main().catch(console.error);
}

#!/usr/bin/env node

/**
 * Comprehensive Zoom Test
 * Tests all Zoom functionality including API, recordings, and webhooks
 */

const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    // Main Zoom endpoints
    createMeeting: '/zoom',
    getMeetings: '/zoom',
    getMyMeetings: '/zoom/my-meetings',
    getCourseMeetings: '/zoom/course',
    getMeetingById: '/zoom',
    joinMeeting: '/zoom',
    startMeeting: '/zoom',
    endMeeting: '/zoom',
    cancelMeeting: '/zoom',
    
    // Recording test endpoints
    recordingStatus: '/zoom/recording-test/status',
    retryRecording: '/zoom/recording-test/retry',
    zoomDetails: '/zoom/recording-test/zoom-details',
    enableAutoRecording: '/zoom/recording-test/enable-auto-recording',
    disableAutoRecording: '/zoom/recording-test/disable-auto-recording',
    enableHostControl: '/zoom/recording-test/enable-host-control',
    testR2Connection: '/zoom/recording-test/test-r2-connection',
    checkRecordingWorkflow: '/zoom/recording-test/check-recording-workflow',
    testR2Upload: '/zoom/recording-test/test-r2-upload',
    listRecordings: '/zoom/recording-test/list-recordings',
    listBucketContents: '/zoom/recording-test/list-bucket-contents',
    listAllZoomRecordings: '/zoom/recording-test/list-all-zoom-recordings',
    
    // Webhook endpoints
    webhookEvents: '/webhooks/zoom/events',
    webhookValidation: '/webhooks/zoom/validation',
    webhookDebug: '/webhooks/zoom/debug'
  },
  testMeetingId: '88982449475', // Default test meeting ID
  testCourseId: '1' // Default test course ID
};

/**
 * Make HTTP request with proper Content-Length header
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const bodyString = options.body || '';
    const bodyLength = Buffer.byteLength(bodyString, 'utf8');
    
    const req = client.request(url, {
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
 * Test Zoom API connection and credentials
 */
async function testZoomCredentials() {
  try {
    console.log('🔍 Testing Zoom API credentials...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.testR2Connection}`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Zoom API credentials working');
      console.log(`   R2 Connection: ${response.data.data ? 'Connected' : 'Not connected'}`);
      return true;
    } else {
      console.log('❌ Zoom API credentials failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom credentials test error: ${error.message}`);
    return false;
  }
}

/**
 * Test Zoom meeting details retrieval
 */
async function testZoomMeetingDetails(meetingId) {
  try {
    console.log(`🔍 Testing Zoom meeting details for ID: ${meetingId}...`);
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.zoomDetails}/${meetingId}`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Zoom meeting details retrieved');
      console.log(`   Meeting Topic: ${response.data.data?.topic || 'N/A'}`);
      console.log(`   Meeting Status: ${response.data.data?.status || 'N/A'}`);
      return true;
    } else {
      console.log('❌ Zoom meeting details failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom meeting details test error: ${error.message}`);
    return false;
  }
}

/**
 * Test Zoom recording status
 */
async function testZoomRecordingStatus(meetingId) {
  try {
    console.log(`🔍 Testing Zoom recording status for ID: ${meetingId}...`);
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.recordingStatus}/${meetingId}`);
    
    if (response.status === 200) {
      console.log('✅ Zoom recording status retrieved');
      console.log(`   Status: ${response.data.status || 'N/A'}`);
      console.log(`   Message: ${response.data.message || 'N/A'}`);
      return true;
    } else {
      console.log('❌ Zoom recording status failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom recording status test error: ${error.message}`);
    return false;
  }
}

/**
 * Test R2 connection
 */
async function testR2Connection() {
  try {
    console.log('🔍 Testing R2 cloud storage connection...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.testR2Connection}`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ R2 connection working');
      console.log(`   Bucket: ${response.data.data?.bucket || 'N/A'}`);
      console.log(`   Region: ${response.data.data?.region || 'N/A'}`);
      return true;
    } else {
      console.log('❌ R2 connection failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ R2 connection test error: ${error.message}`);
    return false;
  }
}

/**
 * Test R2 upload functionality
 */
async function testR2Upload(meetingId) {
  try {
    console.log(`🔍 Testing R2 upload for meeting ID: ${meetingId}...`);
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.testR2Upload}/${meetingId}`, {
      method: 'POST'
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ R2 upload successful');
      console.log(`   R2 Key: ${response.data.data?.r2Key || 'N/A'}`);
      console.log(`   R2 URL: ${response.data.data?.r2Url || 'N/A'}`);
      console.log(`   File Size: ${formatBytes(response.data.data?.fileSize || 0)}`);
      return true;
    } else {
      console.log('❌ R2 upload failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ R2 upload test error: ${error.message}`);
    return false;
  }
}

/**
 * Test Zoom recording workflow
 */
async function testRecordingWorkflow(meetingId) {
  try {
    console.log(`🔍 Testing recording workflow for meeting ID: ${meetingId}...`);
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.checkRecordingWorkflow}/${meetingId}`);
    
    if (response.status === 200) {
      console.log('✅ Recording workflow check completed');
      console.log(`   Status: ${response.data.status || 'N/A'}`);
      console.log(`   Details: ${response.data.details || 'N/A'}`);
      return true;
    } else {
      console.log('❌ Recording workflow check failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Recording workflow test error: ${error.message}`);
    return false;
  }
}

/**
 * Test Zoom meetings list
 */
async function testZoomMeetingsList() {
  try {
    console.log('🔍 Testing Zoom meetings list...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.getMeetings}`);
    
    if (response.status === 200) {
      console.log('✅ Zoom meetings list retrieved');
      console.log(`   Meetings Count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
      return true;
    } else {
      console.log('❌ Zoom meetings list failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom meetings list test error: ${error.message}`);
    return false;
  }
}

/**
 * Test Zoom recordings list
 */
async function testZoomRecordingsList() {
  try {
    console.log('🔍 Testing Zoom recordings list...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.listAllZoomRecordings}`);
    
    if (response.status === 200) {
      console.log('✅ Zoom recordings list retrieved');
      console.log(`   Recordings Count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
      return true;
    } else {
      console.log('❌ Zoom recordings list failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom recordings list test error: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook endpoints
 */
async function testWebhookEndpoints() {
  try {
    console.log('🔍 Testing webhook endpoints...');
    
    // Test webhook validation
    const validationResponse = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.webhookValidation}`, {
      method: 'POST',
      headers: {
        'x-zoom-validation-token': 'test-token'
      },
      body: JSON.stringify({ test: 'validation' })
    });
    
    const validationWorks = validationResponse.status === 200 || validationResponse.status === 201;
    console.log(`   Validation Endpoint: ${validationWorks ? '✅ Working' : '❌ Failed'}`);
    
    // Test webhook debug
    const debugResponse = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.webhookDebug}`, {
      method: 'POST',
      body: JSON.stringify({ test: 'debug' })
    });
    
    const debugWorks = debugResponse.status === 200 || debugResponse.status === 201;
    console.log(`   Debug Endpoint: ${debugWorks ? '✅ Working' : '❌ Failed'}`);
    
    return validationWorks && debugWorks;
  } catch (error) {
    console.log(`❌ Webhook endpoints test error: ${error.message}`);
    return false;
  }
}

/**
 * Format file size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Comprehensive Zoom Testing');
  console.log('='.repeat(60));
  console.log('📋 Configuration:');
  console.log(`   Base URL: ${CONFIG.baseUrl}`);
  console.log(`   Test Meeting ID: ${CONFIG.testMeetingId}`);
  console.log(`   Test Course ID: ${CONFIG.testCourseId}`);
  console.log('');
  
  const results = {
    credentials: await testZoomCredentials(),
    r2Connection: await testR2Connection(),
    meetingDetails: await testZoomMeetingDetails(CONFIG.testMeetingId),
    recordingStatus: await testZoomRecordingStatus(CONFIG.testMeetingId),
    recordingWorkflow: await testRecordingWorkflow(CONFIG.testMeetingId),
    r2Upload: await testR2Upload(CONFIG.testMeetingId),
    meetingsList: await testZoomMeetingsList(),
    recordingsList: await testZoomRecordingsList(),
    webhookEndpoints: await testWebhookEndpoints()
  };
  
  console.log('\n📊 Comprehensive Zoom Test Results:');
  console.log('='.repeat(60));
  console.log(`   Zoom Credentials: ${results.credentials ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   R2 Connection: ${results.r2Connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Meeting Details: ${results.meetingDetails ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recording Status: ${results.recordingStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recording Workflow: ${results.recordingWorkflow ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   R2 Upload: ${results.r2Upload ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Meetings List: ${results.meetingsList ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Recordings List: ${results.recordingsList ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Webhook Endpoints: ${results.webhookEndpoints ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n🎯 Summary:');
  console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL ZOOM TESTS PASSED! Your Zoom integration is fully functional!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    
    console.log('\n💡 Troubleshooting Tips:');
    if (!results.credentials) {
      console.log('   - Check ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET environment variables');
    }
    if (!results.r2Connection) {
      console.log('   - Check R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME environment variables');
    }
    if (!results.webhookEndpoints) {
      console.log('   - Check ZOOM_WEBHOOK_SECRET environment variable');
      console.log('   - Ensure webhook routes are properly registered');
    }
  }
}

// Run the comprehensive test
if (require.main === module) {
  main().catch(console.error);
}

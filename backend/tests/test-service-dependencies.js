#!/usr/bin/env node

/**
 * Test script to check if all services are properly available
 * This will help us identify which service is causing the 500 error
 */

const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api'
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
 * Test R2 service
 */
async function testR2Service() {
  try {
    console.log('🔍 Testing R2 service...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/test-r2-connection`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ R2 service working');
      return true;
    } else {
      console.log('❌ R2 service failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ R2 service test error: ${error.message}`);
    return false;
  }
}

/**
 * Test Zoom API service
 */
async function testZoomApiService() {
  try {
    console.log('🔍 Testing Zoom API service...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/zoom-details/88982449475`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Zoom API service working');
      return true;
    } else {
      console.log('❌ Zoom API service failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom API service test error: ${error.message}`);
    return false;
  }
}

/**
 * Test manual R2 upload (this will test the full pipeline)
 */
async function testManualR2Upload() {
  try {
    console.log('🔍 Testing manual R2 upload...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/test-r2-upload/88982449475`, {
      method: 'POST'
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Manual R2 upload working');
      console.log(`   R2 Key: ${response.data.data?.r2Key || 'N/A'}`);
      console.log(`   R2 URL: ${response.data.data?.r2Url || 'N/A'}`);
      return true;
    } else {
      console.log('❌ Manual R2 upload failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Manual R2 upload test error: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Service Dependencies Test');
  console.log('='.repeat(50));
  
  const results = {
    r2Service: await testR2Service(),
    zoomApiService: await testZoomApiService(),
    manualUpload: await testManualR2Upload()
  };
  
  console.log('\n📊 Service Test Results:');
  console.log(`   R2 Service: ${results.r2Service ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Zoom API Service: ${results.zoomApiService ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Manual Upload: ${results.manualUpload ? '✅ WORKING' : '❌ FAILED'}`);
  
  const allWorking = Object.values(results).every(Boolean);
  
  if (allWorking) {
    console.log('\n🎉 ALL SERVICES WORKING!');
    console.log('   The issue might be in the webhook processing logic.');
  } else {
    console.log('\n⚠️ SOME SERVICES FAILED!');
    console.log('   This explains why webhook processing fails.');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}


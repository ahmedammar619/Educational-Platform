#!/usr/bin/env node

/**
 * Test script to check if Zoom API download works
 * This will help us identify if the issue is in the Zoom API download
 */

const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  testDownloadUrl: 'https://us02web.zoom.us/rec/download/i_RKvUstdeO-6ArMYKmRkvaA2nuq76Np5uEjiHKBdyzw1dRnyWxu6omigoK4Ztes83xrFT991Ft1a8gx.xNkjqK38bxoE268b'
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
 * Test Zoom API download directly
 */
async function testZoomDownload() {
  try {
    console.log('🔍 Testing Zoom API download...');
    console.log(`   Download URL: ${CONFIG.testDownloadUrl}`);
    
    // Try to download directly with curl/fetch
    const response = await fetch(CONFIG.testDownloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   Response Status: ${response.status}`);
    console.log(`   Response Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (response.status === 200) {
      console.log('✅ Direct download works');
      return true;
    } else if (response.status === 401 || response.status === 403) {
      console.log('❌ Download requires authentication');
      return false;
    } else if (response.status === 404) {
      console.log('❌ Download URL not found');
      return false;
    } else {
      console.log(`❌ Download failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Download test error: ${error.message}`);
    return false;
  }
}

/**
 * Test if we can create a simple endpoint to test Zoom API service
 */
async function testZoomApiServiceEndpoint() {
  try {
    console.log('🔍 Testing Zoom API service endpoint...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/zoom-details/88982449475`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Zoom API service working');
      console.log(`   Meeting Topic: ${response.data.data?.topic || 'N/A'}`);
      console.log(`   Recording Files: ${response.data.data?.recording_files?.length || 0}`);
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
 * Main test execution
 */
async function main() {
  console.log('🚀 Zoom Download Test');
  console.log('='.repeat(50));
  
  const apiTest = await testZoomApiServiceEndpoint();
  console.log('');
  const downloadTest = await testZoomDownload();
  
  console.log('\n📊 Zoom Download Test Results:');
  console.log(`   Zoom API Service: ${apiTest ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Direct Download: ${downloadTest ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (!downloadTest) {
    console.log('\n💡 Zoom Download Issue:');
    console.log('   The Zoom download URLs might be:');
    console.log('   1. Expired (Zoom URLs expire after some time)');
    console.log('   2. Require authentication tokens');
    console.log('   3. Invalid or corrupted');
    console.log('   This explains why webhook processing fails.');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}


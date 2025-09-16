#!/usr/bin/env node

/**
 * Script to test Zoom API credentials and connection
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    testR2Connection: '/zoom/recording-test/test-r2-connection',
    getZoomDetails: '/zoom/recording-test/zoom-details'
  }
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'GET',
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
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test R2 connection
async function testR2Connection() {
  try {
    console.log('🔍 Testing R2 connection...');
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.testR2Connection}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      console.log('✅ R2 connection works');
      return true;
    } else {
      console.log(`❌ R2 connection failed: ${response.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ R2 connection request failed: ${error.message}`);
    return false;
  }
}

// Test Zoom API with a specific meeting
async function testZoomApi(meetingId) {
  try {
    console.log(`🔍 Testing Zoom API with meeting: ${meetingId}`);
    const url = `${CONFIG.baseUrl}${CONFIG.endpoints.getZoomDetails}/${meetingId}`;
    const response = await makeRequest(url);
    
    if (response.success) {
      console.log('✅ Zoom API works');
      console.log(`📋 Meeting details retrieved successfully`);
      return true;
    } else {
      console.log(`❌ Zoom API failed: ${response.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Zoom API request failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Test Zoom API Credentials');
  console.log('='.repeat(50));
  
  // Test R2 first
  const r2Works = await testR2Connection();
  
  // Test Zoom API
  const meetingId = '88982449475';
  const zoomWorks = await testZoomApi(meetingId);
  
  console.log('\n📊 Results:');
  console.log(`   R2 Connection: ${r2Works ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Zoom API: ${zoomWorks ? '✅ Working' : '❌ Failed'}`);
  
  if (!zoomWorks) {
    console.log('\n💡 Zoom API Issues:');
    console.log('   1. Check ZOOM_ACCOUNT_ID environment variable');
    console.log('   2. Check ZOOM_CLIENT_ID environment variable');
    console.log('   3. Check ZOOM_CLIENT_SECRET environment variable');
    console.log('   4. Verify Zoom app credentials in Zoom marketplace');
    console.log('   5. Check if Zoom app has recording permissions');
  }
  
  if (r2Works && zoomWorks) {
    console.log('\n🎯 Both systems work! The issue might be:');
    console.log('   1. Webhook endpoint not accessible from Zoom');
    console.log('   2. Webhook secret mismatch');
    console.log('   3. Webhook events not configured properly');
  }
  
  console.log('\n✅ Test completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testR2Connection,
  testZoomApi
};

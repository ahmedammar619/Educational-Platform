#!/usr/bin/env node

/**
 * Test script to check YouTube service configuration
 * This will help us identify if YouTube service is causing the 500 error
 */

require('dotenv').config();
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
 * Test if we can create a simple endpoint to test YouTube service
 */
async function testYouTubeServiceEndpoint() {
  try {
    console.log('🔍 Testing YouTube service endpoint...');
    
    // Try to access a non-existent endpoint to see if we get 404 or auth error
    const response = await makeRequest(`${CONFIG.baseUrl}/youtube/test`);
    
    if (response.status === 404) {
      console.log('✅ YouTube service endpoint not found (expected)');
      return true;
    } else if (response.status === 401) {
      console.log('⚠️ YouTube service requires authentication');
      return false;
    } else {
      console.log(`❓ Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ YouTube service test error: ${error.message}`);
    return false;
  }
}

/**
 * Check environment variables for YouTube
 */
function checkYouTubeEnvironment() {
  console.log('🔍 Checking YouTube environment variables...');
  
  const requiredVars = [
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET', 
    'YOUTUBE_REFRESH_TOKEN',
    'YOUTUBE_CHANNEL_ID'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ All YouTube environment variables are set');
    return true;
  } else {
    console.log('❌ Missing YouTube environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 YouTube Service Test');
  console.log('='.repeat(50));
  
  const envCheck = checkYouTubeEnvironment();
  const endpointTest = await testYouTubeServiceEndpoint();
  
  console.log('\n📊 YouTube Service Test Results:');
  console.log(`   Environment Variables: ${envCheck ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   Service Endpoint: ${endpointTest ? '✅ OK' : '❌ FAILED'}`);
  
  if (!envCheck) {
    console.log('\n💡 YouTube Service Issue:');
    console.log('   The RecordingService tries to upload to YouTube,');
    console.log('   but YouTube credentials are missing.');
    console.log('   This could be causing the 500 error in webhook processing.');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}


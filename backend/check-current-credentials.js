#!/usr/bin/env node

/**
 * Script to check current Zoom credentials configuration
 * This will help identify what's missing or incorrect
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    testR2Connection: '/zoom/recording-test/test-r2-connection'
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

// Test if we can access environment variables through the API
async function checkCredentialsViaAPI() {
  try {
    console.log('🔍 Checking credentials via API...');
    
    // Try to get R2 connection info (this works)
    const r2Response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoints.testR2Connection}`);
    
    if (r2Response.success) {
      console.log('✅ R2 credentials are working');
      console.log(`   Bucket: ${r2Response.data.bucketName}`);
      console.log(`   Region: ${r2Response.data.region}`);
      console.log(`   Endpoint: ${r2Response.data.endpoint}`);
    }
    
    // Try to test Zoom API (this fails)
    try {
      const zoomResponse = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/zoom-details/88982449475`);
      if (zoomResponse.success) {
        console.log('✅ Zoom credentials are working');
      } else {
        console.log('❌ Zoom credentials failed:', zoomResponse.error);
      }
    } catch (error) {
      console.log('❌ Zoom API test failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Check Current Zoom Credentials');
  console.log('='.repeat(50));
  
  await checkCredentialsViaAPI();
  
  console.log('\n📋 What to Check in Zoom Marketplace:');
  console.log('1. Go to https://marketplace.zoom.us');
  console.log('2. Sign in and go to "Develop" > "Build App"');
  console.log('3. Find your app and check:');
  console.log('   - App Credentials (Account ID, Client ID, Client Secret)');
  console.log('   - Scopes/Permissions (recording:read, recording:write)');
  console.log('   - Webhook configuration');
  
  console.log('\n🔧 Environment Variables to Check:');
  console.log('   ZOOM_ACCOUNT_ID - Your Zoom Account ID');
  console.log('   ZOOM_CLIENT_ID - Your App Client ID');
  console.log('   ZOOM_CLIENT_SECRET - Your App Client Secret');
  console.log('   ZOOM_WEBHOOK_SECRET - Your Webhook Secret');
  
  console.log('\n💡 Common Issues:');
  console.log('   - Credentials copied incorrectly');
  console.log('   - App not published/activated');
  console.log('   - Missing recording permissions');
  console.log('   - Webhook URL not accessible');
  
  console.log('\n✅ Check completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkCredentialsViaAPI
};

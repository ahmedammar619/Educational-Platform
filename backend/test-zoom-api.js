#!/usr/bin/env node

/**
 * Simple script to test Zoom API connection
 */

const https = require('https');
const http = require('http');

// Test Zoom API connection
async function testZoomApiConnection() {
  try {
    console.log('🔍 Testing Zoom API connection...');
    const url = 'http://localhost:3000/api/zoom/recording-test/test-r2-connection';
    const response = await makeRequest(url);
    
    if (response.success) {
      console.log('✅ R2 connection works');
      console.log('📋 R2 Details:', response.data);
    } else {
      console.log('❌ R2 connection failed:', response.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

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

// Main execution
async function main() {
  console.log('🚀 Zoom API Connection Test');
  console.log('='.repeat(50));
  
  await testZoomApiConnection();
  
  console.log('\n💡 To check Zoom recordings:');
  console.log('   1. Go to Zoom marketplace');
  console.log('   2. Click on "Recordings"');
  console.log('   3. Click on "Cloud"');
  console.log('   4. Look for your meeting recordings');
  console.log('   5. Copy the Meeting ID (should be numeric, not UUID)');
  console.log('   6. Use that ID to check recordings');
  
  console.log('\n✅ Test completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

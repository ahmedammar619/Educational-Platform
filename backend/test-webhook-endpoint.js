#!/usr/bin/env node

/**
 * Script to test webhook endpoint accessibility
 * This tests if your webhook URL is reachable from the internet
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  // Local testing
  localUrl: 'http://localhost:3000/api/webhooks/zoom/events',
  // Production URL (update this with your actual domain)
  productionUrl: 'https://backend-production-ece4.up.railway.app/api/webhooks/zoom/events',
  // Validation endpoint
  validationUrl: 'https://backend-production-ece4.up.railway.app/api/webhooks/zoom/validation'
};

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

// Test local webhook endpoint
async function testLocalWebhook() {
  try {
    console.log('🔍 Testing local webhook endpoint...');
    const response = await makeRequest(CONFIG.localUrl, {
      method: 'POST',
      body: JSON.stringify({ test: 'local webhook test' })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Local webhook endpoint is accessible');
      return true;
    } else {
      console.log('❌ Local webhook endpoint returned error');
      return false;
    }
  } catch (error) {
    console.log(`❌ Local webhook test failed: ${error.message}`);
    return false;
  }
}

// Test production webhook endpoint
async function testProductionWebhook() {
  try {
    console.log('🔍 Testing production webhook endpoint...');
    const response = await makeRequest(CONFIG.productionUrl, {
      method: 'POST',
      body: JSON.stringify({ test: 'production webhook test' })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Production webhook endpoint is accessible');
      return true;
    } else {
      console.log('❌ Production webhook endpoint returned error');
      return false;
    }
  } catch (error) {
    console.log(`❌ Production webhook test failed: ${error.message}`);
    return false;
  }
}

// Test webhook validation endpoint
async function testWebhookValidation() {
  try {
    console.log('🔍 Testing webhook validation endpoint...');
    const response = await makeRequest(CONFIG.validationUrl, {
      method: 'POST',
      headers: {
        'x-zoom-validation-token': 'test-validation-token'
      },
      body: JSON.stringify({ test: 'validation test' })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook validation endpoint is accessible');
      return true;
    } else {
      console.log('❌ Webhook validation endpoint returned error');
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook validation test failed: ${error.message}`);
    return false;
  }
}

// Test with ngrok (if available)
async function testWithNgrok() {
  try {
    console.log('🔍 Testing with ngrok tunnel...');
    
    // Try common ngrok URLs
    const ngrokUrls = [
      'https://your-ngrok-url.ngrok.io/api/webhooks/zoom/events',
      'http://localhost:4040/api/tunnels' // ngrok status page
    ];
    
    console.log('💡 To test with ngrok:');
    console.log('   1. Install ngrok: npm install -g ngrok');
    console.log('   2. Run: ngrok http 3000');
    console.log('   3. Use the https URL in Zoom webhook configuration');
    console.log('   4. Update CONFIG.ngrokUrl with your ngrok URL');
    
    return false; // Manual setup required
  } catch (error) {
    console.log(`❌ Ngrok test failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Webhook Endpoint Testing');
  console.log('='.repeat(50));
  
  console.log('📋 Testing webhook endpoints:');
  console.log(`   Local: ${CONFIG.localUrl}`);
  console.log(`   Production: ${CONFIG.productionUrl}`);
  console.log(`   Validation: ${CONFIG.validationUrl}`);
  console.log('');
  
  const localWorks = await testLocalWebhook();
  console.log('');
  
  const productionWorks = await testProductionWebhook();
  console.log('');
  
  const validationWorks = await testWebhookValidation();
  console.log('');
  
  await testWithNgrok();
  
  console.log('\n📊 Results Summary:');
  console.log(`   Local Webhook: ${localWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Production Webhook: ${productionWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Validation Endpoint: ${validationWorks ? '✅ Working' : '❌ Failed'}`);
  
  if (!productionWorks) {
    console.log('\n💡 Production webhook issues:');
    console.log('   1. Check if your server is running');
    console.log('   2. Check if the URL is correct');
    console.log('   3. Check firewall/network settings');
    console.log('   4. Use ngrok for local testing');
  }
  
  if (localWorks && !productionWorks) {
    console.log('\n🎯 Solution: Use ngrok for testing');
    console.log('   1. Install ngrok: npm install -g ngrok');
    console.log('   2. Run: ngrok http 3000');
    console.log('   3. Use the https URL in Zoom webhook settings');
  }
  
  console.log('\n✅ Webhook testing completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testLocalWebhook,
  testProductionWebhook,
  testWebhookValidation
};

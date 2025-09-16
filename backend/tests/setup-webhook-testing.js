#!/usr/bin/env node

/**
 * Script to help setup webhook testing with ngrok
 * This provides step-by-step instructions for webhook testing
 */

const { exec } = require('child_process');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  localPort: 3000,
  ngrokCommand: 'ngrok http 3000',
  webhookEndpoint: '/api/webhooks/zoom/events'
};

// Check if ngrok is installed
async function checkNgrokInstallation() {
  return new Promise((resolve) => {
    exec('ngrok version', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ ngrok is not installed');
        console.log('💡 Install ngrok: npm install -g ngrok');
        resolve(false);
      } else {
        console.log('✅ ngrok is installed');
        console.log(`   Version: ${stdout.trim()}`);
        resolve(true);
      }
    });
  });
}

// Get ngrok tunnel URL
async function getNgrokUrl() {
  return new Promise((resolve) => {
    exec('curl -s http://localhost:4040/api/tunnels', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Could not get ngrok URL');
        console.log('💡 Make sure ngrok is running: ngrok http 3000');
        resolve(null);
      } else {
        try {
          const data = JSON.parse(stdout);
          const httpsTunnel = data.tunnels.find(tunnel => tunnel.proto === 'https');
          if (httpsTunnel) {
            console.log(`✅ ngrok tunnel found: ${httpsTunnel.public_url}`);
            resolve(httpsTunnel.public_url);
          } else {
            console.log('❌ No HTTPS tunnel found');
            resolve(null);
          }
        } catch (error) {
          console.log('❌ Could not parse ngrok response');
          resolve(null);
        }
      }
    });
  });
}

// Test webhook URL accessibility
async function testWebhookUrl(webhookUrl) {
  try {
    console.log(`🔍 Testing webhook URL: ${webhookUrl}`);
    
    const response = await makeRequest(webhookUrl, {
      method: 'POST',
      body: JSON.stringify({ test: 'webhook accessibility test' })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Webhook URL is accessible');
      return true;
    } else {
      console.log('❌ Webhook URL returned error');
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook URL test failed: ${error.message}`);
    return false;
  }
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

// Main execution
async function main() {
  console.log('🚀 Webhook Testing Setup');
  console.log('='.repeat(50));
  
  console.log('📋 Setting up webhook testing with ngrok...');
  console.log('');
  
  // Check ngrok installation
  const ngrokInstalled = await checkNgrokInstallation();
  console.log('');
  
  if (!ngrokInstalled) {
    console.log('💡 Installation Instructions:');
    console.log('   1. Install ngrok: npm install -g ngrok');
    console.log('   2. Sign up at https://ngrok.com');
    console.log('   3. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('   4. Run: ngrok config add-authtoken YOUR_TOKEN');
    console.log('   5. Run: ngrok http 3000');
    console.log('');
    return;
  }
  
  // Get ngrok URL
  const ngrokUrl = await getNgrokUrl();
  console.log('');
  
  if (!ngrokUrl) {
    console.log('💡 Start ngrok:');
    console.log('   1. Run: ngrok http 3000');
    console.log('   2. Copy the HTTPS URL');
    console.log('   3. Run this script again');
    console.log('');
    return;
  }
  
  // Test webhook URL
  const webhookUrl = `${ngrokUrl}${CONFIG.webhookEndpoint}`;
  const webhookWorks = await testWebhookUrl(webhookUrl);
  console.log('');
  
  console.log('📊 Setup Results:');
  console.log(`   ngrok Installed: ${ngrokInstalled ? '✅ Yes' : '❌ No'}`);
  console.log(`   ngrok Running: ${ngrokUrl ? '✅ Yes' : '❌ No'}`);
  console.log(`   Webhook Accessible: ${webhookWorks ? '✅ Yes' : '❌ No'}`);
  
  if (webhookWorks) {
    console.log('\n🎯 Webhook URL for Zoom:');
    console.log(`   ${webhookUrl}`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Copy the webhook URL above');
    console.log('   2. Go to Zoom Marketplace');
    console.log('   3. Find your app');
    console.log('   4. Go to "Event Subscriptions"');
    console.log('   5. Add the webhook URL');
    console.log('   6. Select events: recording.completed, recording.started, meeting.ended');
    console.log('   7. Save the configuration');
    console.log('');
    console.log('🧪 Test the webhook:');
    console.log('   node test-webhook-events.js');
  }
  
  console.log('\n✅ Webhook setup completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkNgrokInstallation,
  getNgrokUrl,
  testWebhookUrl
};

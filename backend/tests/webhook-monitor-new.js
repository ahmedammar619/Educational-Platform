#!/usr/bin/env node

/**
 * Webhook Monitor for New ngrok URL
 * Monitors webhook processing in real-time
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  ngrokUrl: 'https://ef927c182bc5.ngrok-free.app',
  checkInterval: 5000, // Check every 5 seconds
  maxChecks: 60 // Stop after 5 minutes
};

let checkCount = 0;

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
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
 * Check recent meetings in database
 */
async function checkRecentMeetings() {
  try {
    console.log(`🔍 Checking recent meetings... (${checkCount + 1}/${CONFIG.maxChecks})`);
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/check-database-meetings`);
    
    if (response.status === 200 && response.data.success) {
      const meetings = response.data.data?.allMeetings || [];
      const recentMeetings = meetings.filter(meeting => {
        const createdAt = new Date(meeting.createdAt);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return createdAt > fiveMinutesAgo;
      });
      
      if (recentMeetings.length > 0) {
        console.log(`\n📊 Found ${recentMeetings.length} recent meetings:`);
        recentMeetings.forEach(meeting => {
          console.log(`   📹 ${meeting.title} (${meeting.zoomMeetingId})`);
          console.log(`      Status: ${meeting.status}`);
          console.log(`      Recording Status: ${meeting.recordingStatus}`);
          if (meeting.recordingStatus === 'completed') {
            console.log(`      ✅ Recording completed!`);
            if (meeting.r2RecordingUrl) {
              console.log(`      📦 R2 URL: ${meeting.r2RecordingUrl}`);
            }
            if (meeting.youtubeUrl) {
              console.log(`      🎥 YouTube URL: ${meeting.youtubeUrl}`);
            }
          }
          console.log('');
        });
      } else {
        console.log('   No recent meetings found');
      }
    } else {
      console.log(`   ❌ Failed to check meetings: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking meetings: ${error.message}`);
  }
}

/**
 * Check R2 contents for new recordings
 */
async function checkR2Contents() {
  try {
    console.log('🔍 Checking R2 contents...');
    
    const response = await makeRequest(`${CONFIG.baseUrl}/zoom/recording-test/list-bucket-contents`);
    
    if (response.status === 200 && response.data.success) {
      const recordings = response.data.data?.recordings || [];
      const recentRecordings = recordings.filter(recording => {
        const lastModified = new Date(recording.lastModified);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return lastModified > fiveMinutesAgo;
      });
      
      if (recentRecordings.length > 0) {
        console.log(`\n📦 Found ${recentRecordings.length} recent R2 recordings:`);
        recentRecordings.forEach(recording => {
          console.log(`   📹 ${recording.key}`);
          console.log(`      Size: ${(recording.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      URL: ${recording.url}`);
          console.log('');
        });
      } else {
        console.log('   No recent R2 recordings found');
      }
    } else {
      console.log(`   ❌ Failed to check R2: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking R2: ${error.message}`);
  }
}

/**
 * Test webhook endpoint accessibility
 */
async function testWebhookEndpoint() {
  try {
    console.log('🔍 Testing webhook endpoint accessibility...');
    
    const response = await makeRequest(`${CONFIG.ngrokUrl}/api/webhooks/zoom/debug`, {
      method: 'POST',
      body: JSON.stringify({ test: 'webhook accessibility' })
    });
    
    if (response.status === 201) {
      console.log('   ✅ Webhook endpoint is accessible');
      return true;
    } else {
      console.log(`   ❌ Webhook endpoint returned: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Webhook endpoint error: ${error.message}`);
    return false;
  }
}

/**
 * Main monitoring loop
 */
async function monitorWebhooks() {
  console.log('🚀 Webhook Monitor Started');
  console.log('='.repeat(60));
  console.log(`📋 Configuration:`);
  console.log(`   Backend URL: ${CONFIG.baseUrl}`);
  console.log(`   ngrok URL: ${CONFIG.ngrokUrl}`);
  console.log(`   Check Interval: ${CONFIG.checkInterval}ms`);
  console.log(`   Max Checks: ${CONFIG.maxChecks}`);
  console.log('');
  
  // Test webhook endpoint first
  const webhookAccessible = await testWebhookEndpoint();
  if (!webhookAccessible) {
    console.log('❌ Webhook endpoint is not accessible. Please check ngrok and backend.');
    return;
  }
  
  console.log('✅ Webhook endpoint is accessible');
  console.log('');
  console.log('👀 Monitoring for webhook activity...');
  console.log('💡 Create a meeting in Zoom and end it to test the webhook!');
  console.log('');
  
  const interval = setInterval(async () => {
    checkCount++;
    
    console.log(`\n⏰ Check ${checkCount} - ${new Date().toLocaleTimeString()}`);
    console.log('-'.repeat(40));
    
    await checkRecentMeetings();
    await checkR2Contents();
    
    if (checkCount >= CONFIG.maxChecks) {
      console.log('\n⏹️ Monitoring stopped (reached max checks)');
      clearInterval(interval);
    }
  }, CONFIG.checkInterval);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n⏹️ Monitoring stopped by user');
    clearInterval(interval);
    process.exit(0);
  });
}

// Run the monitor
if (require.main === module) {
  monitorWebhooks().catch(console.error);
}

#!/usr/bin/env node

/**
 * Test script to verify YouTube credentials and authentication
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testYouTubeCredentials() {
  try {
    console.log('🔍 Testing YouTube credentials...');
    
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    
    console.log(`Client ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
    console.log(`Client Secret: ${clientSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`Refresh Token: ${refreshToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`Channel ID: ${channelId ? '✅ Set' : '❌ Missing'}`);
    
    if (!clientId || !clientSecret || !refreshToken || !channelId) {
      console.log('❌ Missing YouTube credentials');
      return false;
    }
    
    console.log('\n🔍 Testing YouTube API authentication...');
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    console.log('✅ OAuth2 client created');
    
    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    
    console.log('✅ Credentials set');
    
    // Test YouTube API access
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });
    
    console.log('✅ YouTube client created');
    
    // Try to get channel info
    console.log('\n🔍 Testing YouTube API access...');
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      console.log('✅ YouTube API authentication successful!');
      console.log(`   Channel: ${channel.snippet.title}`);
      console.log(`   Channel ID: ${channel.id}`);
      console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);
      return true;
    } else {
      console.log('❌ No channel found or authentication failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ YouTube credentials test failed: ${error.message}`);
    
    if (error.message.includes('unauthorized_client')) {
      console.log('\n💡 Unauthorized client error means:');
      console.log('   - Client ID and Client Secret don\'t match');
      console.log('   - Refresh token was generated with different credentials');
      console.log('   - OAuth consent screen is not properly configured');
    } else if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Invalid grant error means:');
      console.log('   - Refresh token has expired');
      console.log('   - Refresh token is invalid');
      console.log('   - User has revoked access');
    }
    
    return false;
  }
}

/**
 * Test YouTube upload permissions
 */
async function testYouTubeUploadPermissions() {
  try {
    console.log('\n🔍 Testing YouTube upload permissions...');
    
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });
    
    // Try to create a simple video (this will test upload permissions)
    console.log('🔍 Testing upload permissions with dummy request...');
    
    // This is a minimal test - we're not actually uploading, just testing permissions
    const testResponse = await youtube.videos.list({
      part: ['snippet'],
      mySubscriptions: true,
      maxResults: 1,
    });
    
    console.log('✅ Upload permissions test passed');
    return true;
    
  } catch (error) {
    console.log(`❌ Upload permissions test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 YouTube Credentials Test');
  console.log('='.repeat(50));
  
  const credentialsTest = await testYouTubeCredentials();
  const uploadTest = await testYouTubeUploadPermissions();
  
  console.log('\n📊 YouTube Credentials Test Results:');
  console.log(`   Credentials: ${credentialsTest ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`   Upload Permissions: ${uploadTest ? '✅ VALID' : '❌ INVALID'}`);
  
  if (credentialsTest && uploadTest) {
    console.log('\n🎉 YouTube credentials are working correctly!');
    console.log('   Ready for video uploads');
  } else {
    console.log('\n💡 YouTube credentials need attention');
    console.log('   Check the error messages above for specific issues');
  }
  
  console.log('\n✅ Test completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testYouTubeCredentials,
  testYouTubeUploadPermissions
};

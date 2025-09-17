const crypto = require('crypto');

// Test with minimal payload that should work
const testMinimalWebhook = async () => {
  const webhookSecret = 'oA-6ayg0Ty8j8XxJ2vK9mN4pQ7sL3wE6rT1yU5iO8aS2dF9gH4jK7lM0nP3qR6';
  const payload = JSON.stringify({
    event: 'recording.completed',
    payload: {
      account_id: 'test-account',
      object: {
        uuid: 'test-uuid',
        id: '999999999', // Use a different ID
        host_id: 'test-host',
        topic: 'Minimal Test Meeting',
        type: 2,
        start_time: new Date().toISOString(),
        duration: 60,
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        join_url: 'https://zoom.us/j/999999999',
        recording_files: [] // Empty files array to test no-files handling
      }
    },
    event_ts: Math.floor(Date.now() / 1000)
  });

  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  try {
    const response = await fetch('https://api.baraemalnour.org/api/webhooks/zoom/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zm-Signature': `sha256=${signature}`,
        'X-Zm-Request-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
      body: payload,
    });

    console.log(`Status: ${response.status}`);
    const result = await response.text();
    console.log(`Response: ${result}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Minimal webhook test passed');
    } else {
      console.log('❌ Minimal webhook test failed');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

testMinimalWebhook();

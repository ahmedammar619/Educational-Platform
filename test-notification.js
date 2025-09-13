// Simple test script to create a test notification
const axios = require('axios');

async function testNotification() {
  try {
    // You'll need to replace this with your actual JWT token and user ID
    const token = 'YOUR_JWT_TOKEN_HERE';
    const studentUserId = 'STUDENT_USER_ID_HERE';
    
    const response = await axios.post('http://localhost:3000/api/notifications/test', {
      userId: studentUserId,
      type: 'assignment_published',
      message: 'Test assignment notification'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Test notification created:', response.data);
  } catch (error) {
    console.error('Error creating test notification:', error.response?.data || error.message);
  }
}

testNotification();

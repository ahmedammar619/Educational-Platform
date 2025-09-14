const axios = require('axios');

// Test script to check if teacher API endpoints are working
async function testTeacherEndpoints() {
  const baseURL = 'http://localhost:3000';
  
  // You'll need to replace this with a valid teacher JWT token
  const teacherToken = 'YOUR_TEACHER_JWT_TOKEN_HERE';
  
  const headers = {
    'Authorization': `Bearer ${teacherToken}`,
    'Content-Type': 'application/json'
  };

  console.log('🧪 Testing Teacher API Endpoints...\n');

  // Test endpoints that might be causing loading issues
  const endpoints = [
    '/api/materials/courses/1/posts',
    '/api/materials/courses/1/files',
    '/api/materials/courses/1/assignments',
    '/api/materials/courses/1/attendance/bulk',
    '/api/teachers/classes'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const startTime = Date.now();
      
      const response = await axios.get(`${baseURL}${endpoint}`, { 
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Success: ${response.status} (${duration}ms)`);
      console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

// Run the test
testTeacherEndpoints().catch(console.error);

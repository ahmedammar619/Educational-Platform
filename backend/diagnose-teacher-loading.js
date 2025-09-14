const axios = require('axios');

async function diagnoseTeacherLoading() {
  console.log('🔍 Diagnosing Teacher Loading Issues...\n');
  
  const baseURL = 'http://localhost:3000';
  
  // Test basic connectivity
  try {
    console.log('1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${baseURL}/api/health`, { timeout: 5000 });
    console.log('✅ Backend is running:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend connectivity issue:', error.message);
    console.log('   Make sure the backend is running on port 3000');
    return;
  }
  
  // Test authentication endpoint
  try {
    console.log('\n2. Testing authentication endpoint...');
    const authResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    }, { timeout: 5000 });
    console.log('✅ Auth endpoint working:', authResponse.status);
  } catch (error) {
    console.log('⚠️ Auth endpoint issue (expected if no test user):', error.response?.status);
  }
  
  // Test materials endpoints without auth (should return 401)
  const materialsEndpoints = [
    '/api/materials/courses/1/posts',
    '/api/materials/courses/1/files',
    '/api/materials/courses/1/assignments',
    '/api/materials/courses/1/attendance/bulk'
  ];
  
  console.log('\n3. Testing materials endpoints (should return 401 without auth)...');
  for (const endpoint of materialsEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, { timeout: 5000 });
      console.log(`⚠️ ${endpoint}: ${response.status} (unexpected - should be 401)`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ ${endpoint}: 401 Unauthorized (expected)`);
      } else {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'Network Error'} - ${error.message}`);
      }
    }
  }
  
  // Test teacher endpoints without auth
  console.log('\n4. Testing teacher endpoints (should return 401 without auth)...');
  try {
    const response = await axios.get(`${baseURL}/api/teachers/classes`, { timeout: 5000 });
    console.log(`⚠️ /api/teachers/classes: ${response.status} (unexpected - should be 401)`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ /api/teachers/classes: 401 Unauthorized (expected)`);
    } else {
      console.log(`❌ /api/teachers/classes: ${error.response?.status || 'Network Error'} - ${error.message}`);
    }
  }
  
  console.log('\n📋 Diagnosis Summary:');
  console.log('   - If backend connectivity fails: Start the backend server');
  console.log('   - If materials endpoints return 401: This is expected without authentication');
  console.log('   - If any endpoint returns 500: Check backend logs for database/query issues');
  console.log('   - If any endpoint times out: Check for infinite loops or slow queries');
  console.log('\n💡 Next steps:');
  console.log('   1. Check browser console for JavaScript errors');
  console.log('   2. Check browser Network tab for failed requests');
  console.log('   3. Check backend logs for database connection issues');
  console.log('   4. Verify teacher user has proper role and permissions');
}

diagnoseTeacherLoading().catch(console.error);

// Test CORS configuration
const http = require('http');

console.log('🧪 Testing CORS Configuration...\n');

// Test 1: Check if server is running
const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cors-test',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    }, (res) => {
      console.log('✅ Server is running');
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`🔒 CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials']}`);
      console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      
      if (res.headers['access-control-allow-origin'] === 'http://localhost:5173' || 
          res.headers['access-control-allow-origin'] === '*') {
        console.log('✅ CORS is properly configured for localhost:5173');
      } else {
        console.log('❌ CORS is not properly configured for localhost:5173');
      }
      
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ Server is not running or CORS is blocking the request');
      console.log('Error:', err.message);
      reject(err);
    });

    req.end();
  });
};

// Test 2: Simulate preflight request
const testPreflight = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cors-test',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    }, (res) => {
      console.log('\n✅ Preflight request successful');
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`🔒 Preflight CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      console.log(`   Access-Control-Max-Age: ${res.headers['access-control-max-age']}`);
      
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ Preflight request failed');
      console.log('Error:', err.message);
      reject(err);
    });

    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    await testServer();
    await testPreflight();
    
    console.log('\n🎯 CORS Testing Complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Try logging in from your frontend again');
    console.log('3. Check the browser console for CORS errors');
    console.log('4. If issues persist, check the backend console for CORS logs');
    
  } catch (error) {
    console.log('\n❌ CORS testing failed');
    console.log('Make sure your backend server is running on port 3000');
  }
}

runTests();

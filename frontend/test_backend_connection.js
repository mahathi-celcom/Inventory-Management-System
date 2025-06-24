// Test Backend Connection Script
// Run with: node test_backend_connection.js

const http = require('http');

const testEndpoints = [
  { path: '/api/vendors', method: 'GET' },
  { path: '/api/assets/stats', method: 'GET' },
  { path: '/api/asset-pos', method: 'GET' },
];

function testConnection(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: endpoint.path,
      method: endpoint.method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${endpoint.method} ${endpoint.path} - Status: ${res.statusCode}`);
      resolve({ success: true, status: res.statusCode, endpoint });
    });

    req.on('error', (err) => {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - Error: ${err.message}`);
      resolve({ success: false, error: err.message, endpoint });
    });

    req.on('timeout', () => {
      console.log(`⏱️ ${endpoint.method} ${endpoint.path} - Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', endpoint });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing Backend Connection...\n');
  console.log('Expected backend URL: http://localhost:8080');
  console.log('Expected endpoints:');
  testEndpoints.forEach(ep => console.log(`  - ${ep.method} ${ep.path}`));
  console.log('\n' + '='.repeat(50));

  for (const endpoint of testEndpoints) {
    await testConnection(endpoint);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Connection tests completed!');
  console.log('\n📋 Troubleshooting steps if tests fail:');
  console.log('1. Ensure Spring Boot backend is running on port 8080');
  console.log('2. Check if firewall is blocking local connections');
  console.log('3. Verify CORS configuration in Spring Boot');
  console.log('4. Confirm API endpoints are properly mapped');
  console.log('5. Start frontend with: ng serve (uses proxy.conf.js)');
}

runTests(); 
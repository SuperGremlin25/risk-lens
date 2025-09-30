#!/usr/bin/env node

/**
 * Deployment validation script
 * Tests deployed worker endpoints to ensure they're working correctly
 */

const https = require('https');
const { URL } = require('url');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function validateDeployment(baseUrl) {
  console.log(`🔍 Validating deployment at: ${baseUrl}\n`);
  
  let allPassed = true;

  // Test 1: Health check endpoint
  try {
    console.log('Testing /api/health endpoint...');
    const healthResponse = await makeRequest(`${baseUrl}/api/health`);
    
    if (healthResponse.status === 200) {
      const healthData = JSON.parse(healthResponse.data);
      if (healthData.status === 'ok') {
        console.log('✅ Health check passed');
      } else {
        console.error('❌ Health check returned unexpected status:', healthData);
        allPassed = false;
      }
    } else {
      console.error('❌ Health check failed with status:', healthResponse.status);
      allPassed = false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    allPassed = false;
  }

  // Test 2: Main page loads
  try {
    console.log('Testing main page...');
    const pageResponse = await makeRequest(baseUrl);
    
    if (pageResponse.status === 200 && pageResponse.data.includes('RiskLens')) {
      console.log('✅ Main page loads correctly');
    } else {
      console.error('❌ Main page failed to load properly');
      allPassed = false;
    }
  } catch (error) {
    console.error('❌ Main page error:', error.message);
    allPassed = false;
  }

  // Test 3: CORS headers
  try {
    console.log('Testing CORS headers...');
    const corsResponse = await makeRequest(`${baseUrl}/api/health`, {
      method: 'OPTIONS'
    });
    
    if (corsResponse.headers['access-control-allow-origin']) {
      console.log('✅ CORS headers present');
    } else {
      console.error('❌ CORS headers missing');
      allPassed = false;
    }
  } catch (error) {
    console.error('❌ CORS test error:', error.message);
    allPassed = false;
  }

  // Test 4: API validation (test with empty request)
  try {
    console.log('Testing API validation...');
    const apiResponse = await makeRequest(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: '' })
    });
    
    if (apiResponse.status === 400) {
      console.log('✅ API validation working (correctly rejected empty request)');
    } else {
      console.error('❌ API validation not working properly, status:', apiResponse.status);
      allPassed = false;
    }
  } catch (error) {
    console.error('❌ API validation test error:', error.message);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All deployment validation tests passed!');
    console.log('🚀 Your RiskLens application is ready for production');
    return true;
  } else {
    console.error('❌ Some validation tests failed');
    console.error('Please check the deployment and fix any issues');
    return false;
  }
}

// Main execution
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('Usage: node validate-deployment.js <base-url>');
    console.error('Example: node validate-deployment.js https://risk-lens.your-subdomain.workers.dev');
    process.exit(1);
  }

  validateDeployment(baseUrl)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { validateDeployment };
#!/usr/bin/env node

/**
 * API endpoint tests for RiskLens
 * These tests can be run against a deployed worker
 */

// Simple API testing framework
class ApiTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log(`🌐 Running API tests against: ${this.baseUrl}\n`);
    
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 API Test Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  async makeRequest(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const method = options.method || 'GET';
    const headers = options.headers || {};
    const body = options.body;

    // Use dynamic import for node-fetch to handle ES modules
    let fetch;
    try {
      const module = await import('node-fetch');
      fetch = module.default;
    } catch (error) {
      // Fallback for environments without node-fetch
      throw new Error('node-fetch not available. Install with: npm install node-fetch');
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

// Test sample contract text
const sampleContract = `
This Service Agreement ("Agreement") is entered into on January 1, 2024, between Company A and Company B. 
This agreement shall be governed by the laws of Texas. The parties agree to unlimited liability for any damages 
arising from this contract. Payment is due within 30 days of invoice date. This contract automatically renews 
each year unless terminated by either party with 30 days written notice. The contractor shall maintain professional 
liability insurance coverage of at least $2 million. Any disputes shall be resolved through binding arbitration.
`;

async function runApiTests(baseUrl) {
  const tester = new ApiTester(baseUrl);

  // Test 1: Health check
  tester.test('Health check endpoint responds correctly', async () => {
    const response = await tester.makeRequest('/api/health');
    tester.assert(response.status === 200, `Expected 200, got ${response.status}`);
    tester.assert(response.data.status === 'ok', 'Health check should return ok status');
  });

  // Test 2: CORS preflight
  tester.test('CORS preflight request works', async () => {
    const response = await tester.makeRequest('/api/health', {
      method: 'OPTIONS'
    });
    tester.assert(response.status === 200, 'CORS preflight should return 200');
    tester.assert(response.headers['access-control-allow-origin'], 'CORS headers should be present');
  });

  // Test 3: Main page loads
  tester.test('Main page loads with RiskLens UI', async () => {
    const response = await tester.makeRequest('/');
    tester.assert(response.status === 200, 'Main page should return 200');
    tester.assert(typeof response.data === 'string', 'Should return HTML content');
    tester.assert(response.data.includes('RiskLens'), 'Should contain RiskLens title');
  });

  // Test 4: API validation - empty request
  tester.test('API rejects empty analysis request', async () => {
    const response = await tester.makeRequest('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' })
    });
    tester.assert(response.status === 400, 'Should reject empty request with 400');
    tester.assert(response.data.error, 'Should return error message');
  });

  // Test 5: API validation - no text field
  tester.test('API rejects request without text field', async () => {
    const response = await tester.makeRequest('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    tester.assert(response.status === 400, 'Should reject request without text field');
  });

  // Test 6: Valid contract analysis (if not rate limited)
  tester.test('API accepts valid contract analysis request', async () => {
    const response = await tester.makeRequest('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sampleContract })
    });
    
    // Could be 200 (success) or 429 (rate limited) - both are acceptable
    tester.assert(
      response.status === 200 || response.status === 429,
      `Expected 200 or 429, got ${response.status}`
    );
    
    if (response.status === 200) {
      tester.assert(response.data.summary || response.data.redFlags, 'Should return analysis data');
      console.log('  📋 Analysis completed successfully');
    } else {
      console.log('  ⏱️  Rate limited (expected behavior)');
    }
  });

  // Test 7: Invalid endpoint
  tester.test('Invalid API endpoint returns 404', async () => {
    const response = await tester.makeRequest('/api/nonexistent');
    tester.assert(response.status === 404, 'Invalid endpoint should return 404');
  });

  return await tester.run();
}

// Main execution
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.log('🔧 No URL provided - running offline API structure tests...\n');
    
    // Run basic offline tests
    const basicTests = require('./basic-tests.js');
    const runner = new basicTests.TestRunner();
    
    // Add API-specific offline tests
    runner.test('API endpoint structure in worker code', () => {
      const fs = require('fs');
      const path = require('path');
      const workerCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker.js'), 'utf8');
      
      runner.assert(workerCode.includes('handleApiRequest'), 'Missing handleApiRequest function');
      runner.assert(workerCode.includes('analyzeContract'), 'Missing analyzeContract function');
      runner.assert(workerCode.includes('/api/health'), 'Missing health endpoint');
      runner.assert(workerCode.includes('/api/analyze'), 'Missing analyze endpoint');
    });
    
    runner.run().then(success => {
      if (success) {
        console.log('\n💡 To test against deployed API, run:');
        console.log('node test/api-tests.js https://your-worker.your-subdomain.workers.dev');
      }
      process.exit(success ? 0 : 1);
    });
  } else {
    runApiTests(baseUrl)
      .then(success => {
        process.exit(success ? 0 : 1);
      })
      .catch(error => {
        console.error('API tests failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { runApiTests };
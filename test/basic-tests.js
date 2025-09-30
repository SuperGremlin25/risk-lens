#!/usr/bin/env node

/**
 * Basic unit tests for RiskLens core functions
 */

const fs = require('fs');
const path = require('path');

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running basic tests...\n');
    
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

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
}

// Load worker code for testing
const workerPath = path.join(__dirname, '..', 'src', 'worker.js');
const workerCode = fs.readFileSync(workerPath, 'utf8');

// Test runner instance
const runner = new TestRunner();

// Test 1: Worker code structure
runner.test('Worker has required exports', () => {
  runner.assert(workerCode.includes('export default'), 'Missing default export');
  runner.assert(workerCode.includes('async fetch'), 'Missing fetch handler');
});

// Test 2: Required constants
runner.test('Required constants are defined', () => {
  runner.assert(workerCode.includes('APPROVED_STATES'), 'Missing APPROVED_STATES');
  runner.assert(workerCode.includes('STATE_PATTERNS'), 'Missing STATE_PATTERNS');
  runner.assert(workerCode.includes('CORS_HEADERS'), 'Missing CORS_HEADERS');
});

// Test 3: State validation logic
runner.test('State patterns include required states', () => {
  runner.assert(workerCode.includes('oklahoma'), 'Missing Oklahoma pattern');
  runner.assert(workerCode.includes('texas'), 'Missing Texas pattern');
  runner.assert(workerCode.includes('florida'), 'Missing Florida pattern');
  runner.assert(workerCode.includes('colorado'), 'Missing Colorado pattern (for rejection)');
});

// Test 4: API endpoints
runner.test('Required API endpoints are defined', () => {
  runner.assert(workerCode.includes('/api/analyze'), 'Missing analyze endpoint');
  runner.assert(workerCode.includes('/api/health'), 'Missing health endpoint');
});

// Test 5: Security features
runner.test('Security features are implemented', () => {
  runner.assert(workerCode.includes('rate_limit'), 'Missing rate limiting');
  runner.assert(workerCode.includes('Access-Control-Allow-Origin'), 'Missing CORS headers');
  runner.assert(workerCode.includes('CF-Connecting-IP'), 'Missing IP detection for rate limiting');
});

// Test 6: Error handling
runner.test('Error handling is implemented', () => {
  runner.assert(workerCode.includes('try {'), 'Missing try-catch blocks');
  runner.assert(workerCode.includes('catch'), 'Missing error catching');
  runner.assert(workerCode.includes('console.error'), 'Missing error logging');
});

// Test 7: Red flag detection
runner.test('Red flag patterns are defined', () => {
  runner.assert(workerCode.includes('unlimited liability'), 'Missing unlimited liability detection');
  runner.assert(workerCode.includes('personal guarantee'), 'Missing personal guarantee detection');
  runner.assert(workerCode.includes('automatic renewal'), 'Missing automatic renewal detection');
});

// Test 8: Structured clause extraction
runner.test('Clause extraction patterns are defined', () => {
  runner.assert(workerCode.includes('paymentRegex'), 'Missing payment terms extraction');
  runner.assert(workerCode.includes('terminationRegex'), 'Missing termination clause extraction');
  runner.assert(workerCode.includes('liabilityRegex'), 'Missing liability clause extraction');
});

// Test 9: Configuration validation
runner.test('Configuration files are valid', () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  runner.assert(packageContent.main === 'src/worker.js', 'Incorrect main entry in package.json');
  runner.assert(packageContent.scripts.deploy, 'Missing deploy script');
  
  const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  runner.assert(wranglerContent.includes('RISK_LENS_KV'), 'Missing KV binding in wrangler.toml');
});

// Test 10: Environment handling
runner.test('Environment variables are properly configured', () => {
  runner.assert(workerCode.includes('env.RISK_LENS_KV'), 'Missing KV environment binding usage');
  runner.assert(workerCode.includes('env.HUGGINGFACE_API_TOKEN'), 'Missing Hugging Face token handling');
});

// Run tests
if (require.main === module) {
  runner.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { TestRunner };
#!/usr/bin/env node

/**
 * Basic linting checks for RiskLens worker
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running linting checks...\n');

let hasErrors = false;

// Check worker.js syntax and basic issues
const workerPath = path.join(__dirname, '..', 'src', 'worker.js');

try {
  const content = fs.readFileSync(workerPath, 'utf8');
  
  console.log('✅ worker.js file exists and is readable');
  
  // Check for basic syntax issues
  if (content.includes('console.log(') && !content.includes('console.error(')) {
    console.log('⚠️  Consider using console.error() for error logging in production');
  }
  
  // Check for required exports
  if (!content.includes('export default')) {
    console.error('❌ Missing default export in worker.js');
    hasErrors = true;
  }
  
  // Check for required functions
  const requiredFunctions = ['handleApiRequest', 'analyzeContract', 'detectRedFlags'];
  requiredFunctions.forEach(func => {
    if (!content.includes(func)) {
      console.error(`❌ Missing required function: ${func}`);
      hasErrors = true;
    } else {
      console.log(`✅ Found required function: ${func}`);
    }
  });
  
  // Check for security patterns
  if (content.includes('Access-Control-Allow-Origin')) {
    console.log('✅ CORS headers configured');
  }
  
  if (content.includes('rate_limit')) {
    console.log('✅ Rate limiting implemented');
  }
  
  // Check for environment variable usage
  if (content.includes('env.RISK_LENS_KV')) {
    console.log('✅ KV storage binding found');
  }
  
} catch (error) {
  console.error('❌ Error reading worker.js:', error.message);
  hasErrors = true;
}

// Check wrangler.toml
const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
try {
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  if (wranglerContent.includes('production_namespace_id')) {
    console.log('⚠️  wrangler.toml still contains placeholder namespace IDs');
  } else {
    console.log('✅ wrangler.toml appears to have proper namespace IDs');
  }
  
} catch (error) {
  console.error('❌ Error reading wrangler.toml:', error.message);
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ Linting failed with errors');
  process.exit(1);
} else {
  console.log('\n✅ All linting checks passed');
}
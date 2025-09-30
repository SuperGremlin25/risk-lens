#!/usr/bin/env node

/**
 * Setup script for Cloudflare KV namespaces
 * Run this before deploying to create required KV namespaces
 */

const { execSync } = require('child_process');

console.log('🔧 Setting up Cloudflare KV namespaces for RiskLens...\n');

try {
  // Check if user is authenticated
  try {
    execSync('npx wrangler whoami', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ You are not authenticated with Cloudflare.');
    console.log('Please run: npx wrangler login');
    process.exit(1);
  }

  console.log('📝 Creating KV namespaces...');

  // Create production namespace
  console.log('Creating production KV namespace...');
  const prodResult = execSync('npx wrangler kv:namespace create "RISK_LENS_KV"', { encoding: 'utf8' });
  console.log(prodResult);

  // Create preview namespace
  console.log('Creating preview KV namespace...');
  const previewResult = execSync('npx wrangler kv:namespace create "RISK_LENS_KV" --preview', { encoding: 'utf8' });
  console.log(previewResult);

  console.log('✅ KV namespaces created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy the namespace IDs from above output');
  console.log('2. Update wrangler.toml with the actual namespace IDs');
  console.log('3. Replace "production_namespace_id" and "preview_namespace_id" with actual IDs');
  console.log('4. Run "npm run deploy" to deploy your worker');

} catch (error) {
  console.error('❌ Error setting up KV namespaces:', error.message);
  process.exit(1);
}
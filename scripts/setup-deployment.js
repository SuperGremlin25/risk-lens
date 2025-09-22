#!/usr/bin/env node
/**
 * RiskLens Deployment Setup Script
 * This script helps set up the deployment configuration for RiskLens
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 RiskLens Deployment Setup');
console.log('================================\n');

// Check if user is authenticated
function checkAuthentication() {
  try {
    console.log('Checking Cloudflare authentication...');
    const result = execSync('npx wrangler whoami', { encoding: 'utf8' });
    console.log('✅ Authenticated with Cloudflare\n');
    return true;
  } catch (error) {
    console.log('❌ Not authenticated with Cloudflare');
    console.log('Please run: npx wrangler login\n');
    return false;
  }
}

// Create KV namespaces
function createKVNamespaces() {
  console.log('Creating KV namespaces...');
  
  try {
    // Create production namespace
    console.log('Creating production namespace...');
    const prodResult = execSync('npx wrangler kv namespace create "RISK_LENS_KV"', { encoding: 'utf8' });
    console.log(prodResult);
    
    // Create preview namespace
    console.log('Creating preview namespace...');
    const previewResult = execSync('npx wrangler kv namespace create "RISK_LENS_KV" --preview', { encoding: 'utf8' });
    console.log(previewResult);
    
    console.log('\n✅ KV namespaces created successfully!');
    console.log('\n📝 Please update your wrangler.toml file with the namespace IDs shown above.');
    console.log('   Look for the "id" values in the output and update the [[kv_namespaces]] section.\n');
    
    return true;
  } catch (error) {
    console.log('❌ Failed to create KV namespaces');
    console.log('Error:', error.message);
    return false;
  }
}

// Check if wrangler.toml has placeholder IDs
function checkWranglerConfig() {
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  
  if (!fs.existsSync(wranglerPath)) {
    console.log('❌ wrangler.toml not found');
    return false;
  }
  
  const content = fs.readFileSync(wranglerPath, 'utf8');
  
  if (content.includes('preview_namespace_id') || content.includes('production_namespace_id')) {
    console.log('⚠️  wrangler.toml still contains placeholder namespace IDs');
    console.log('   Please update them with the actual IDs from the KV namespace creation step.\n');
    return false;
  }
  
  console.log('✅ wrangler.toml appears to be configured correctly\n');
  return true;
}

// Deploy the application
function deploy() {
  console.log('Deploying to Cloudflare Workers...');
  
  try {
    const result = execSync('npm run deploy', { encoding: 'utf8' });
    console.log(result);
    console.log('\n🎉 Deployment successful!\n');
    return true;
  } catch (error) {
    console.log('❌ Deployment failed');
    console.log('Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('This script will help you set up RiskLens for deployment.\n');
  
  // Step 1: Check authentication  
  if (!checkAuthentication()) {
    console.log('Please authenticate first and run this script again.');
    process.exit(1);
  }
  
  // Step 2: Create KV namespaces
  console.log('Do you want to create KV namespaces? (y/n)');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Create KV namespaces? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createKVNamespaces();
    }
    
    readline.question('\nHave you updated wrangler.toml with the namespace IDs? (y/n): ', (configAnswer) => {
      if (configAnswer.toLowerCase() === 'y' || configAnswer.toLowerCase() === 'yes') {
        checkWranglerConfig();
        
        readline.question('Deploy to Cloudflare Workers? (y/n): ', (deployAnswer) => {
          if (deployAnswer.toLowerCase() === 'y' || deployAnswer.toLowerCase() === 'yes') {
            deploy();
          }
          
          console.log('\n🏁 Setup complete!');
          console.log('If you need help, check DEPLOYMENT.md for detailed instructions.');
          readline.close();
        });
      } else {
        console.log('\n📝 Please update wrangler.toml with the namespace IDs and run the deploy command manually:');
        console.log('   npm run deploy\n');
        readline.close();
      }
    });
  });
}

main().catch(console.error);
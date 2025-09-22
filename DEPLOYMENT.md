# RiskLens Deployment Guide

This guide provides comprehensive instructions for deploying RiskLens to Cloudflare Workers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment](#quick-deployment)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Custom Domains](#custom-domains)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Options](#advanced-options)

## Prerequisites

### Required Tools
- **Node.js**: Version 16 or higher ([Download](https://nodejs.org/))
- **Git**: For cloning the repository
- **Cloudflare Account**: Free account at [cloudflare.com](https://cloudflare.com)

### Account Setup
1. Create a Cloudflare account if you don't have one
2. Verify your email address
3. Note your account ID (found in the right sidebar of your Cloudflare dashboard)

## Quick Deployment

For experienced users who want to deploy quickly:

```bash
# 1. Clone and setup
git clone https://github.com/SuperGremlin25/risk-lens.git
cd risk-lens
npm install

# 2. Authenticate with Cloudflare
npx wrangler login

# 3. Create KV namespaces
npx wrangler kv:namespace create "RISK_LENS_KV"
npx wrangler kv:namespace create "RISK_LENS_KV" --preview

# 4. Update wrangler.toml with the provided namespace IDs

# 5. Deploy
npm run deploy
```

## Detailed Setup

### Step 1: Environment Setup

#### Install Node.js
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version for your operating system
3. Follow the installation instructions
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Clone Repository
```bash
git clone https://github.com/SuperGremlin25/risk-lens.git
cd risk-lens
```

#### Install Dependencies
```bash
npm install
```

This installs:
- Wrangler CLI (Cloudflare Workers deployment tool)
- TypeScript definitions for Cloudflare Workers
- All necessary dependencies

### Step 2: Cloudflare Authentication

#### Login to Cloudflare
```bash
npx wrangler login
```

This command:
1. Opens your default web browser
2. Redirects you to Cloudflare's authentication page
3. Prompts you to log in to your Cloudflare account
4. Asks for permission to access your account via Wrangler
5. Stores authentication tokens locally

#### Verify Authentication
```bash
npx wrangler whoami
```

Expected output:
```
Getting User settings...
👋 You are logged in with an OAuth Token, associated with the email 'your-email@example.com'!
┌─────────────────────────────────────┬──────────────────────────────────────┐
│ Account Name                        │ Account ID                           │
├─────────────────────────────────────┼──────────────────────────────────────┤
│ Your Account Name                   │ abc123def456...                      │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

### Step 3: KV Namespace Creation

Cloudflare KV (Key-Value) storage is used for:
- Rate limiting (preventing abuse)
- Caching analysis results
- Storing temporary data

#### Create Production Namespace
```bash
npx wrangler kv:namespace create "RISK_LENS_KV"
```

Expected output:
```json
{ binding = "RISK_LENS_KV", id = "def456ghi789..." }
```

#### Create Preview Namespace
```bash
npx wrangler kv:namespace create "RISK_LENS_KV" --preview
```

Expected output:
```json
{ binding = "RISK_LENS_KV", preview_id = "abc123def456..." }
```

**Important**: Save both IDs - you'll need them in the next step.

### Step 4: Configuration

#### Update wrangler.toml
Open `wrangler.toml` in your text editor and replace the placeholder IDs:

```toml
name = "risk-lens"
main = "src/worker.js"
compatibility_date = "2024-01-15"

[[kv_namespaces]]
binding = "RISK_LENS_KV"
preview_id = "abc123def456..."  # Replace with your preview_id
id = "def456ghi789..."          # Replace with your production id

[vars]
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models"
```

#### Worker Name (Optional)
You can customize the Worker name, which affects your app's URL:
```toml
name = "my-contract-analyzer"  # Results in: my-contract-analyzer.your-subdomain.workers.dev
```

### Step 5: Optional Enhancements

#### Hugging Face Integration
For better AI-powered summaries:

1. **Get API Token**:
   - Visit [Hugging Face](https://huggingface.co/settings/tokens)
   - Create a new token with "Read" permissions
   - Copy the token

2. **Add to Cloudflare**:
   ```bash
   npx wrangler secret put HUGGINGFACE_API_TOKEN
   ```
   When prompted, paste your token.

3. **Verify Secret**:
   ```bash
   npx wrangler secret list
   ```

### Step 6: Deployment

#### Test Locally First
```bash
npm run dev
```

1. Open http://localhost:8787 in your browser
2. Test the PDF upload functionality
3. Try the contract analysis features
4. Check browser console for errors

#### Deploy to Production
```bash
npm run deploy
```

Expected output:
```
 ⛅️ wrangler 4.38.0
──────────────────
Total Upload: 1.23 MiB / gzip: 456.78 KiB
Uploaded risk-lens (1.23s)
Published risk-lens (1.23s)
  https://risk-lens.your-subdomain.workers.dev
Current Deployment ID: abc123-def456-ghi789
```

#### Verify Deployment
1. Visit the provided URL
2. Test the application functionality
3. Check that all features work as expected

## Configuration

### Environment Variables

#### Local Development (.env)
Create a `.env` file for local development:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Optional: For enhanced AI summaries
HUGGINGFACE_API_TOKEN=your_token_here
```

#### Production Secrets
For production, use Wrangler secrets instead of `.env`:
```bash
npx wrangler secret put HUGGINGFACE_API_TOKEN
npx wrangler secret put OTHER_SECRET_NAME
```

### Wrangler Configuration

#### Basic Configuration
```toml
name = "risk-lens"                    # Worker name
main = "src/worker.js"               # Entry point
compatibility_date = "2024-01-15"    # Runtime version
```

#### KV Namespaces
```toml
[[kv_namespaces]]
binding = "RISK_LENS_KV"             # Variable name in code
preview_id = "preview_namespace_id"   # For local/preview
id = "production_namespace_id"        # For production
```

#### Environment Variables
```toml
[vars]
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models"
DEBUG_MODE = false
```

## Custom Domains

### Using Cloudflare Dashboard

1. **Add Domain to Cloudflare**:
   - Add your domain to Cloudflare
   - Update nameservers
   - Wait for DNS propagation

2. **Configure Worker Route**:
   - Go to Workers & Pages in your Cloudflare dashboard
   - Select your Worker
   - Go to "Settings" → "Triggers"
   - Add Custom Domain: `contracts.yourdomain.com`

3. **Update DNS**:
   - The custom domain will automatically create necessary DNS records

### Using Wrangler CLI

```bash
# Add custom domain
npx wrangler route add contracts.yourdomain.com

# List routes
npx wrangler route list
```

## Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Symptom: "Error: Not authenticated"
# Solution: Re-authenticate
npx wrangler logout
npx wrangler login
npx wrangler whoami
```

#### KV Namespace Errors
```bash
# Symptom: "Error: KV namespace not found"
# Solution: Verify namespace IDs in wrangler.toml

# List all KV namespaces
npx wrangler kv:namespace list

# Check specific namespace
npx wrangler kv:namespace get --binding RISK_LENS_KV --key test
```

#### Deployment Failures
```bash
# Get detailed error information
npx wrangler deploy --debug

# Check real-time logs
npx wrangler tail

# View recent logs
npx wrangler tail --since 1h
```

#### Local Development Issues
```bash
# If port 8787 is in use
npx wrangler dev --port 8788

# For local-only mode (no Cloudflare API calls)
npx wrangler dev --local

# Debug mode with verbose output
npx wrangler dev --debug
```

### Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Not authenticated` | Not logged in to Cloudflare | Run `npx wrangler login` |
| `KV namespace not found` | Wrong namespace ID in config | Update `wrangler.toml` with correct IDs |
| `Worker threw exception` | Runtime error in code | Check logs with `npx wrangler tail` |
| `Exceeded account limits` | Too many requests/storage | Upgrade Cloudflare plan or reduce usage |
| `DNS resolution failed` | Domain not configured | Check DNS settings in Cloudflare dashboard |

### Performance Issues

#### Slow Response Times
1. **Check geographic distribution**: Workers run globally, but KV might have regional latency
2. **Monitor usage**: High traffic might hit rate limits
3. **Optimize code**: Large contract texts might cause timeouts

#### Memory Issues
1. **Worker memory limit**: 128MB per request
2. **Large PDFs**: Client-side processing has browser limits
3. **Solution**: Add file size validation and chunking

### Debugging

#### Enable Debug Mode
```javascript
// In worker.js, add debug logging
console.log('Debug info:', { request: request.url, timestamp: Date.now() });
```

#### View Logs
```bash
# Real-time logs
npx wrangler tail

# Filtered logs
npx wrangler tail --grep "ERROR"

# Logs from specific time
npx wrangler tail --since 30m
```

#### Test API Endpoints
```bash
# Health check
curl https://your-worker.workers.dev/api/health

# Contract analysis
curl -X POST https://your-worker.workers.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test contract."}'
```

## Advanced Options

### Multiple Environments

#### Setup
Create different configurations for staging/production:

```toml
# wrangler.toml
[env.staging]
name = "risk-lens-staging"
[[env.staging.kv_namespaces]]
binding = "RISK_LENS_KV"
id = "staging_namespace_id"

[env.production]
name = "risk-lens-production"
[[env.production.kv_namespaces]]
binding = "RISK_LENS_KV"
id = "production_namespace_id"
```

#### Deploy to Specific Environment
```bash
# Deploy to staging
npx wrangler deploy --env staging

# Deploy to production
npx wrangler deploy --env production
```

### CI/CD Integration

#### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### Required Secrets
In your GitHub repository settings, add:
- `CLOUDFLARE_API_TOKEN`: Create in Cloudflare dashboard → My Profile → API Tokens

### Monitoring and Analytics

#### Cloudflare Analytics
1. View in Cloudflare Workers dashboard
2. Monitor requests, errors, and performance
3. Set up alerts for high error rates

#### Custom Metrics
```javascript
// In worker.js, add custom analytics
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const start = Date.now();
  
  // Your app logic here
  const response = await yourAppLogic(request);
  
  // Log metrics
  console.log('Request processed', {
    duration: Date.now() - start,
    status: response.status,
    path: new URL(request.url).pathname
  });
  
  return response;
}
```

### Cost Optimization

#### Free Tier Limits
- 100,000 requests/day
- 1GB KV storage
- 1ms CPU time per request

#### Optimization Tips
1. **Cache responses**: Use KV for frequently accessed data
2. **Minimize KV operations**: Batch reads/writes when possible
3. **Optimize code**: Reduce CPU usage per request
4. **Monitor usage**: Set up alerts for approaching limits

## Support

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [KV Storage Guide](https://developers.cloudflare.com/workers/runtime-apis/kv/)

### Community
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Community](https://community.cloudflare.com/)
- [GitHub Issues](https://github.com/SuperGremlin25/risk-lens/issues)

### Getting Help
When reporting issues, include:
1. Node.js and Wrangler versions
2. Complete error messages
3. Steps to reproduce
4. Your `wrangler.toml` configuration (without sensitive data)
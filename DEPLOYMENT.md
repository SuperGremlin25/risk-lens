# RiskLens Production Deployment Guide

This guide will help you deploy RiskLens to production on Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: You'll need a Cloudflare account with Workers enabled
2. **Node.js**: Version 18 or higher
3. **Git**: For version control
4. **Wrangler CLI**: Included in project dependencies

## Step-by-Step Deployment

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/SuperGremlin25/risk-lens.git
cd risk-lens

# Install dependencies
npm install
```

### 2. Cloudflare Authentication

```bash
# Login to Cloudflare
npx wrangler login
```

This will open a browser window to authenticate with Cloudflare.

### 3. Create KV Namespaces

RiskLens uses Cloudflare KV for caching and rate limiting. Create the required namespaces:

```bash
# Run the automated setup script
npm run setup:kv
```

Or manually create them:

```bash
# Create production namespace
npx wrangler kv:namespace create "RISK_LENS_KV"
# Create preview namespace  
npx wrangler kv:namespace create "RISK_LENS_KV" --preview
```

### 4. Update Configuration

Edit `wrangler.toml` and replace the placeholder namespace IDs with the ones generated in step 3:

```toml
[[kv_namespaces]]
binding = "RISK_LENS_KV"
preview_id = "your_preview_namespace_id_here"
id = "your_production_namespace_id_here"
```

### 5. Set Environment Variables (Optional)

For enhanced AI summaries, add your Hugging Face API token:

```bash
# Set the secret in Cloudflare
npx wrangler secret put HUGGINGFACE_API_TOKEN
```

When prompted, enter your Hugging Face API token. The application will work without this token using fallback summaries.

### 6. Deploy to Production

```bash
# Run pre-deployment checks
npm run pre-deploy

# Deploy to production
npm run deploy:production
```

### 7. Verify Deployment

```bash
# Test the deployment (replace with your actual Worker URL)
npm run validate:deployment https://risk-lens-production.your-subdomain.workers.dev
```

## Environment Management

### Staging Environment

For testing before production:

```bash
# Deploy to staging
npm run deploy:staging
```

### Development Environment

For local development:

```bash
# Start local development server
npm run dev
```

## CI/CD with GitHub Actions

The repository includes GitHub Actions for automated deployment:

### Required Secrets

Add these secrets to your GitHub repository settings:

1. **CLOUDFLARE_API_TOKEN**: Your Cloudflare API token
2. **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID
3. **HUGGINGFACE_API_TOKEN**: (Optional) Your Hugging Face API token

### Automatic Deployment

- **Push to main**: Triggers staging deployment
- **Manual workflow**: Allows deployment to production
- **Pull requests**: Runs tests only

## Monitoring and Maintenance

### Health Monitoring

The application includes a health check endpoint:

```
GET https://your-worker-url/api/health
```

### Rate Limiting

- Default: 10 requests per hour per IP
- Stored in Cloudflare KV with 1-hour TTL
- Automatic cleanup of expired entries

### Logs and Debugging

View real-time logs:

```bash
npx wrangler tail risk-lens-production
```

### Security Updates

1. Regularly run `npm audit` for security vulnerabilities
2. Keep dependencies updated
3. Monitor Cloudflare security advisories

## Troubleshooting

### Common Issues

**1. Namespace ID errors**
```
Error: Unknown binding type KV
```
Solution: Ensure KV namespace IDs are correctly set in `wrangler.toml`

**2. Authentication issues**
```
Error: Not authenticated
```
Solution: Run `npx wrangler login` again

**3. Rate limiting during deployment**
```
Error: Too many requests
```
Solution: Wait a few minutes and try again

**4. Missing secrets**
```
Error: HUGGINGFACE_API_TOKEN is not defined
```
Solution: Either set the secret or ignore (app works without it)

### Performance Optimization

1. **Caching**: Results are cached for 24 hours in KV
2. **Edge Computing**: Runs on Cloudflare's global edge network
3. **Client-side PDF**: PDF processing happens in the browser

### Rollback Procedure

If you need to rollback a deployment:

```bash
# View deployment history
npx wrangler deployments list risk-lens-production

# Rollback to previous version
npx wrangler rollback risk-lens-production [version-id]
```

## Domain Configuration (Optional)

To use a custom domain:

1. Add your domain to Cloudflare
2. Configure DNS to point to your Worker
3. Update Worker routes in Cloudflare dashboard

## Cost Considerations

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **KV Storage**: Free tier includes 10GB storage
- **Bandwidth**: Free on Cloudflare's network
- **Hugging Face API**: Optional, has its own pricing

## Support and Updates

- Monitor GitHub releases for updates
- Review security advisories regularly  
- Keep documentation updated with any customizations

## Production Checklist

Before going live, ensure:

- [ ] KV namespaces created and configured
- [ ] Wrangler.toml updated with correct namespace IDs
- [ ] GitHub Actions secrets configured
- [ ] Health check endpoint responds
- [ ] Rate limiting is working
- [ ] CORS headers are properly configured
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and alerting set up
- [ ] Backup and rollback procedures tested

## Security Considerations

- No persistent data storage (contracts are processed in memory only)
- Rate limiting prevents abuse
- CORS headers properly configured
- Input validation on all endpoints
- HTTPS enforced by Cloudflare
- No sensitive data in logs

For questions or issues, please check the troubleshooting section above or create an issue in the GitHub repository.
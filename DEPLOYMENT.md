# RiskLens Production Deployment Guide

This guide will walk you through deploying RiskLens to Cloudflare Workers for production use.

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account (free tier works)
- Git installed
- Basic command line knowledge

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Cloudflare Account Setup

### 2.1 Create/Login to Cloudflare Account
1. Go to https://dash.cloudflare.com/
2. Sign up or log in to your account
3. Note your Account ID (found in the URL or dashboard)

### 2.2 Get API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Set permissions:
   - Account > Workers Scripts > Edit
   - Account > Workers KV Storage > Edit
5. Click "Continue to summary" → "Create Token"
6. **Save this token securely** - you'll need it for deployment

## Step 3: Create KV Namespaces

KV namespaces are required for caching and rate limiting.

### 3.1 Login to Wrangler
```bash
npx wrangler login
```
This will open a browser window to authenticate.

### 3.2 Create Preview Namespace
```bash
npx wrangler kv:namespace create "RISK_LENS_KV" --preview
```

You'll see output like:
```
{ binding = "RISK_LENS_KV", preview_id = "abc123def456" }
```

### 3.3 Create Production Namespace
```bash
npx wrangler kv:namespace create "RISK_LENS_KV"
```

You'll see output like:
```
{ binding = "RISK_LENS_KV", id = "xyz789ghi012" }
```

### 3.4 Update wrangler.toml
Open `wrangler.toml` and update the KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "RISK_LENS_KV"
preview_id = "abc123def456"  # Your preview_id from step 3.2
id = "xyz789ghi012"          # Your id from step 3.3
```

## Step 4: Configure Secrets (Optional but Recommended)

The Hugging Face API token enables AI-powered contract summaries. Without it, the app uses a fallback summarization method.

### 4.1 Get Hugging Face API Token
1. Go to https://huggingface.co/
2. Sign up or log in
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token

### 4.2 Set the Secret
```bash
npx wrangler secret put HUGGINGFACE_API_TOKEN
```

When prompted, paste your Hugging Face API token and press Enter.

## Step 5: Test Locally

Before deploying to production, test locally:

```bash
npm run dev
```

Open http://localhost:8787 in your browser and test the application:
- Upload a sample PDF contract
- Paste contract text
- Verify analysis works correctly

Press Ctrl+C to stop the local server.

## Step 6: Deploy to Production

### 6.1 Deploy
```bash
npm run deploy
```

You'll see output like:
```
Published risk-lens (X.XX sec)
  https://risk-lens.your-subdomain.workers.dev
```

### 6.2 Test Production Deployment
Visit the URL provided and test all features:
- ✅ PDF upload and analysis
- ✅ Text paste and analysis
- ✅ Red flag detection
- ✅ Clause extraction
- ✅ Jurisdiction validation

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. Go to Cloudflare Dashboard → Workers & Pages
2. Click on your "risk-lens" worker
3. Go to "Triggers" tab
4. Click "Add Custom Domain"
5. Enter your domain (e.g., risklens.yourdomain.com)
6. Follow DNS setup instructions

### 7.2 Update DNS
If your domain is on Cloudflare:
- DNS records will be added automatically

If your domain is elsewhere:
- Add a CNAME record pointing to your workers.dev URL

## Step 8: GitHub Actions Setup (Optional)

For automatic deployments on push to main branch:

### 8.1 Add GitHub Secrets
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: Your API token from Step 2.2
   - `CLOUDFLARE_ACCOUNT_ID`: Your Account ID from Step 2.1

### 8.2 Add Hugging Face Secret (Optional)
If using Hugging Face:
- Add `HUGGINGFACE_API_TOKEN` as a GitHub secret

### 8.3 Update GitHub Workflow
The workflow in `.github/workflows/deploy.yml` will automatically deploy on push to main.

## Step 9: Monitoring and Maintenance

### 9.1 View Logs
```bash
npx wrangler tail
```

### 9.2 View Analytics
1. Go to Cloudflare Dashboard → Workers & Pages
2. Click on "risk-lens"
3. View the "Metrics" tab for:
   - Request count
   - Error rate
   - CPU time
   - Bandwidth

### 9.3 Update KV Data (if needed)
```bash
# List KV keys
npx wrangler kv:key list --binding=RISK_LENS_KV

# Get a value
npx wrangler kv:key get "key-name" --binding=RISK_LENS_KV

# Delete a key
npx wrangler kv:key delete "key-name" --binding=RISK_LENS_KV
```

## Troubleshooting

### Error: "KV namespace not found"
- Verify KV namespace IDs in `wrangler.toml` are correct
- Run the KV creation commands again if needed

### Error: "Authentication error"
- Run `npx wrangler login` again
- Verify your API token has correct permissions

### Error: "Module not found"
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### PDF Upload Not Working
- Check browser console for errors
- Verify PDF.js is loading correctly (check Network tab)
- Try pasting text directly as a workaround

### Analysis Returns Errors
- Check Hugging Face API status
- Verify HUGGINGFACE_API_TOKEN is set correctly
- App should fall back to basic summarization if API fails

### Rate Limiting Issues
- Default: 10 requests per hour per IP
- Adjust in `src/worker.js` if needed (line 79)
- Clear KV cache if testing: `npx wrangler kv:key delete "rate_limit:YOUR_IP" --binding=RISK_LENS_KV`

## Cost Estimation

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- 10ms CPU time per request
- Sufficient for most small-to-medium deployments

### Cloudflare KV (Free Tier)
- 100,000 reads/day
- 1,000 writes/day
- 1 GB storage

### Hugging Face API (Free Tier)
- 30,000 characters/month
- Rate limited to prevent abuse
- Consider upgrading for production use

### Estimated Monthly Cost
- **Free tier**: $0/month (up to limits)
- **Light usage** (1,000 analyses/month): $0-5/month
- **Medium usage** (10,000 analyses/month): $5-20/month

## Security Considerations

1. **Rate Limiting**: Enabled by default (10 req/hour per IP)
2. **CORS**: Configured to allow cross-origin requests
3. **Input Validation**: All inputs are validated
4. **No Data Storage**: Contracts are not permanently stored
5. **Caching**: Results cached for 24 hours (can be disabled)

## Next Steps

1. **Monitor Usage**: Check Cloudflare analytics regularly
2. **Update Dependencies**: Run `npm update` monthly
3. **Review Logs**: Check for errors and unusual patterns
4. **Backup Configuration**: Keep `wrangler.toml` settings documented
5. **Scale as Needed**: Upgrade Cloudflare plan if you exceed free tier

## Support

- **Documentation**: See README.md and PRD.md
- **Issues**: Report bugs on GitHub
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

---

**Congratulations!** 🎉 Your RiskLens application is now deployed and ready for production use.

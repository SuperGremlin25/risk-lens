# RiskLens Deployment Checklist

Use this checklist to ensure a successful deployment of RiskLens to Cloudflare Workers.

## Pre-Deployment

### Prerequisites
- [ ] Node.js v16+ installed
- [ ] Git installed
- [ ] Cloudflare account created and verified
- [ ] Repository cloned locally

### Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Cloudflare authentication completed (`npx wrangler login`)
- [ ] Authentication verified (`npx wrangler whoami`)

## Configuration

### KV Namespaces
- [ ] Production KV namespace created (`npx wrangler kv namespace create "RISK_LENS_KV"`)
- [ ] Preview KV namespace created (`npx wrangler kv namespace create "RISK_LENS_KV" --preview`)
- [ ] Namespace IDs copied from command output
- [ ] `wrangler.toml` updated with actual namespace IDs (replace placeholders)

### Optional Enhancements
- [ ] Hugging Face account created (if using AI features)
- [ ] Hugging Face API token generated
- [ ] API token added as Worker secret (`npx wrangler secret put HUGGINGFACE_API_TOKEN`)

## Testing

### Local Testing
- [ ] Local development server started (`npm run dev`)
- [ ] Application accessible at http://localhost:8787
- [ ] PDF upload functionality tested
- [ ] Text input functionality tested
- [ ] Contract analysis working
- [ ] No console errors in browser

### Configuration Validation
- [ ] `wrangler.toml` syntax is valid
- [ ] No placeholder values remaining in configuration
- [ ] Environment variables properly set

## Deployment

### Initial Deployment
- [ ] Deployment command executed (`npm run deploy`)
- [ ] Deployment completed without errors
- [ ] Worker URL obtained from deployment output
- [ ] Application accessible via Worker URL

### Post-Deployment Verification
- [ ] All application features working on deployed version
- [ ] PDF processing functional
- [ ] API endpoints responding correctly
- [ ] No errors in Worker logs (`npx wrangler tail`)

## Production Setup

### Domain Configuration (Optional)
- [ ] Custom domain added to Cloudflare
- [ ] DNS configured correctly
- [ ] SSL certificate active
- [ ] Worker route configured for custom domain

### Monitoring
- [ ] Cloudflare Workers dashboard accessible
- [ ] Request metrics visible
- [ ] Error logging configured
- [ ] Usage limits understood

### Security
- [ ] Sensitive data not exposed in code
- [ ] API tokens stored as Worker secrets (not in code)
- [ ] Rate limiting configured and working
- [ ] CORS headers properly set

## Post-Deployment

### Documentation
- [ ] Deployment URL documented
- [ ] Access credentials shared with team (if applicable)
- [ ] Update any external documentation with new URL

### Backup & Recovery
- [ ] Worker configuration backed up
- [ ] KV namespace IDs documented
- [ ] Deployment process documented for future use

### Maintenance
- [ ] Update schedule planned
- [ ] Monitoring alerts configured
- [ ] Support contact information available

## Common Issues Checklist

If deployment fails, check:

- [ ] Cloudflare authentication is valid
- [ ] KV namespace IDs are correct in `wrangler.toml`
- [ ] No syntax errors in Worker code
- [ ] Account limits not exceeded
- [ ] Network connectivity to Cloudflare

If application doesn't work after deployment:

- [ ] Check Worker logs (`npx wrangler tail`)
- [ ] Verify all secrets are properly set
- [ ] Test API endpoints individually
- [ ] Check browser console for client-side errors
- [ ] Verify KV namespace is accessible

## Quick Commands Reference

```bash
# Authentication
npx wrangler whoami

# Create KV namespaces
npx wrangler kv namespace create "RISK_LENS_KV"
npx wrangler kv namespace create "RISK_LENS_KV" --preview

# Deploy
npm run deploy

# View logs
npx wrangler tail

# Local development
npm run dev

# Interactive setup
npm run setup
```

## Emergency Rollback

If you need to rollback a deployment:

```bash
# List recent deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback [deployment-id]
```

---

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions or create an issue on GitHub.
# RiskLens Deployment Checklist

Use this checklist to ensure your deployment is production-ready.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm dependencies installed (`npm install`)
- [ ] Cloudflare account created
- [ ] Wrangler CLI authenticated (`npx wrangler login`)

### 2. Cloudflare Configuration
- [ ] Account ID obtained from dashboard
- [ ] API Token created with Workers permissions
- [ ] KV preview namespace created
- [ ] KV production namespace created
- [ ] `wrangler.toml` updated with correct KV namespace IDs

### 3. Secrets Configuration
- [ ] Hugging Face account created (optional)
- [ ] Hugging Face API token obtained (optional)
- [ ] `HUGGINGFACE_API_TOKEN` secret set via `wrangler secret put` (optional)

### 4. Local Testing
- [ ] Local dev server starts successfully (`npm run dev`)
- [ ] Homepage loads at http://localhost:8787
- [ ] PDF upload functionality works
- [ ] Text paste functionality works
- [ ] Contract analysis completes successfully
- [ ] Red flags are detected correctly
- [ ] Clause extraction displays results
- [ ] Jurisdiction validation works
- [ ] Error handling displays user-friendly messages

### 5. Code Quality
- [ ] No console errors in browser
- [ ] No TODO or FIXME comments in main branch (per user rules)
- [ ] All placeholder values replaced with actual values
- [ ] `.env` file not committed (check `.gitignore`)
- [ ] Secrets not hardcoded in source files

## Deployment Checklist

### 6. Initial Deployment
- [ ] Run `npm run deploy`
- [ ] Deployment completes without errors
- [ ] Workers.dev URL provided in output
- [ ] URL is accessible in browser

### 7. Production Testing
- [ ] Homepage loads correctly on production URL
- [ ] All static assets load (no 404 errors)
- [ ] PDF upload works on production
- [ ] Text paste works on production
- [ ] Analysis API endpoint responds correctly
- [ ] Health check endpoint works (`/api/health`)
- [ ] Rate limiting is functional (test with multiple requests)
- [ ] Caching works (same contract analyzed twice should be faster)
- [ ] Error messages display correctly
- [ ] Mobile responsiveness verified

### 8. Performance Verification
- [ ] Page load time < 3 seconds
- [ ] Analysis completes in < 30 seconds
- [ ] No memory errors in Cloudflare logs
- [ ] CPU time within acceptable limits

### 9. Security Verification
- [ ] CORS headers configured correctly
- [ ] Rate limiting active (10 req/hour per IP)
- [ ] No sensitive data in logs
- [ ] Secrets not exposed in client-side code
- [ ] Input validation working

## Post-Deployment Checklist

### 10. Monitoring Setup
- [ ] Cloudflare Analytics dashboard reviewed
- [ ] Error tracking configured
- [ ] Log tailing tested (`npx wrangler tail`)
- [ ] Alert thresholds set (optional)

### 11. Documentation
- [ ] README.md updated with production URL
- [ ] DEPLOYMENT.md reviewed and accurate
- [ ] Team members have access to Cloudflare dashboard
- [ ] Secrets documented (not the values, just what's needed)

### 12. Custom Domain (Optional)
- [ ] Custom domain added in Cloudflare
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] Domain resolves correctly
- [ ] Redirects configured (www to non-www, etc.)

### 13. GitHub Actions (Optional)
- [ ] `CLOUDFLARE_API_TOKEN` added to GitHub secrets
- [ ] `CLOUDFLARE_ACCOUNT_ID` added to GitHub secrets
- [ ] `HUGGINGFACE_API_TOKEN` added to GitHub secrets (optional)
- [ ] GitHub Actions workflow tested
- [ ] Automatic deployment on push to main verified

### 14. Backup and Recovery
- [ ] `wrangler.toml` configuration backed up
- [ ] KV namespace IDs documented
- [ ] API tokens stored securely
- [ ] Rollback procedure documented

## Maintenance Checklist (Monthly)

### 15. Regular Maintenance
- [ ] Check Cloudflare Analytics for usage patterns
- [ ] Review error logs for issues
- [ ] Update npm dependencies (`npm update`)
- [ ] Test all features still work after updates
- [ ] Review and clear old KV cache entries if needed
- [ ] Check for Cloudflare service updates
- [ ] Verify SSL certificate is valid
- [ ] Review rate limiting effectiveness

### 16. Security Audit
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review access logs for suspicious activity
- [ ] Rotate API tokens if needed
- [ ] Check for new security best practices
- [ ] Verify CORS configuration still appropriate

## Troubleshooting Reference

### Common Issues and Solutions

**Issue**: KV namespace not found
- **Solution**: Verify IDs in `wrangler.toml` match created namespaces

**Issue**: Authentication error
- **Solution**: Run `npx wrangler login` again

**Issue**: PDF upload fails
- **Solution**: Check PDF.js CDN is accessible, try text paste instead

**Issue**: Analysis returns 429 (rate limit)
- **Solution**: Wait 1 hour or clear rate limit key from KV

**Issue**: Analysis returns 403 (jurisdiction)
- **Solution**: Contract is from unsupported state (see approved list)

**Issue**: Deployment fails
- **Solution**: Check API token permissions, verify account ID

## Production Readiness Score

Count your checkmarks:
- **50-60 checks**: ✅ Production Ready
- **40-49 checks**: ⚠️ Almost Ready (review unchecked items)
- **< 40 checks**: ❌ Not Ready (complete critical items first)

### Critical Items (Must Complete)
1. KV namespaces created and configured
2. Local testing passed
3. Production deployment successful
4. Production testing passed
5. Security verification complete

---

**Last Updated**: Before each deployment
**Next Review**: After deployment completion

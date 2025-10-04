# RiskLens Quick Start Guide

Get your RiskLens app deployed to production in under 15 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Cloudflare account (free tier is fine)
- [ ] 15 minutes of time

## 5-Step Deployment

### Step 1: Install Dependencies (2 min)

```bash
npm install
```

### Step 2: Cloudflare Login (3 min)

```bash
npx wrangler login
```

This opens your browser to authenticate with Cloudflare.

### Step 3: Create KV Namespaces (2 min)

Run these commands and **save the output**:

```bash
npx wrangler kv:namespace create "RISK_LENS_KV" --preview
npx wrangler kv:namespace create "RISK_LENS_KV"
```

You'll get output like:

```text
{ binding = "RISK_LENS_KV", preview_id = "abc123..." }
{ binding = "RISK_LENS_KV", id = "xyz789..." }
```

### Step 4: Update Configuration (2 min)

Open `wrangler.toml` and update lines 11-12:

```toml
preview_id = "abc123..."  # Paste your preview_id here
id = "xyz789..."          # Paste your id here
```

### Step 5: Deploy (1 min)

```bash
npm run deploy
```

**Done!** 🎉 Your app is live at the URL shown in the output.

## Optional: Add AI Summaries

For better contract summaries, add a Hugging Face API token:

1. Get token from <https://huggingface.co/settings/tokens>
2. Run: `npx wrangler secret put HUGGINGFACE_API_TOKEN`
3. Paste your token when prompted

## Test Your Deployment

Visit your workers.dev URL and:

1. Paste sample contract text
2. Click "Analyze Contract"
3. Verify results appear

## Troubleshooting

**"KV namespace not found"**
→ Double-check the IDs in `wrangler.toml` match the output from Step 3

**"Authentication error"**
→ Run `npx wrangler login` again

**"Module not found"**
→ Run `npm install` again

## Next Steps

- [ ] Add custom domain (see DEPLOYMENT.md)
- [ ] Set up GitHub Actions (see DEPLOYMENT.md)
- [ ] Monitor usage in Cloudflare dashboard
- [ ] Review DEPLOYMENT-CHECKLIST.md for production readiness

## Need More Help?

- **Full Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Checklist**: See [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- **Issues**: Check GitHub Issues

---

**Estimated Total Time**: 10-15 minutes
**Cost**: $0/month (free tier)

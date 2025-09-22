# RiskLens 🔍

Drop a PDF contract → instant plain-English summary, red flags, and structured clause extraction (payment terms, dates, termination, indemnity, liability, IP, auto-renewal, governing law, insurance, etc.).

![RiskLens UI](https://github.com/user-attachments/assets/972180eb-4337-45c3-ac7a-18fefedc4668)
![Analysis Results](https://github.com/user-attachments/assets/95617dd4-ac61-4b0a-9553-319addf3d7ad)

## Features

- **PDF Text Extraction**: Client-side PDF processing using PDF.js (no server overhead)
- **Smart Contract Analysis**: AI-powered contract analysis with Hugging Face integration
- **Red Flags Detection**: Automatically identifies potentially problematic clauses
- **Structured Data Extraction**: Extracts key contract elements:
  - Payment terms
  - Important dates
  - Termination clauses
  - Liability and indemnity provisions
  - Intellectual property terms
  - Auto-renewal clauses
  - Governing law
  - Insurance requirements

## Architecture

- **Frontend**: React + Vite embedded in Cloudflare Worker (single file deployment)
- **Backend**: Cloudflare Worker (serves UI + API)
- **Storage**: Cloudflare KV (rate limiting + caching)
- **AI**: Hugging Face API for contract summarization (with fallback)
- **PDF Processing**: PDF.js for client-side text extraction

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

3. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

> 📚 **Need detailed deployment instructions?** See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive setup guide.
>
> 🚀 **Quick deployment setup?** Run `npm run setup` for an interactive setup wizard.

## Deployment Guide

### Prerequisites

1. **Node.js**: Install Node.js (v16 or higher)
2. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
3. **Wrangler CLI**: Included as a dependency (no separate installation needed)

### Step-by-Step Deployment

#### 1. Clone and Setup
```bash
git clone https://github.com/SuperGremlin25/risk-lens.git
cd risk-lens
npm install
```

#### 2. Cloudflare Authentication
```bash
# Login to Cloudflare (opens browser for authentication)
npx wrangler login

# Verify authentication
npx wrangler whoami
```

#### 3. Create KV Namespace
Create a Cloudflare KV namespace for caching and rate limiting:

```bash
# Create production namespace
npx wrangler kv:namespace create "RISK_LENS_KV"

# Create preview namespace (for development)
npx wrangler kv:namespace create "RISK_LENS_KV" --preview
```

This will output namespace IDs like:
```
{ binding = "RISK_LENS_KV", preview_id = "abc123...", id = "def456..." }
```

#### 4. Update Configuration
Update `wrangler.toml` with your actual namespace IDs:

```toml
name = "risk-lens"
main = "src/worker.js"
compatibility_date = "2024-01-15"

[[kv_namespaces]]
binding = "RISK_LENS_KV"
preview_id = "your_preview_namespace_id_here"
id = "your_production_namespace_id_here"

[vars]
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models"
```

#### 5. Optional: Hugging Face Integration
For enhanced AI summaries (optional):

1. Get a free API token from [Hugging Face](https://huggingface.co/settings/tokens)
2. Add it as a Cloudflare Worker secret:
```bash
npx wrangler secret put HUGGINGFACE_API_TOKEN
```
3. When prompted, paste your Hugging Face API token

#### 6. Deploy
```bash
# Deploy to production
npm run deploy

# Or deploy with custom name
npx wrangler deploy --name my-risk-lens-app
```

#### 7. Access Your App
After successful deployment, Wrangler will provide your app URL:
```
Published risk-lens (1.23s)
  https://risk-lens.your-subdomain.workers.dev
```

### Development Workflow

#### Local Development
```bash
# Start local development server
npm run dev

# Access at http://localhost:8787
# Changes auto-reload during development
```

#### Testing Changes
```bash
# Preview changes before deploying
npx wrangler dev

# Deploy to preview environment
npx wrangler deploy --env preview
```

### Configuration Options

#### Environment Variables

Copy `.env.example` to `.env` for local development:
```bash
cp .env.example .env
```

Available environment variables:
- `HUGGINGFACE_API_TOKEN`: Optional Hugging Face API token for enhanced summaries (set as Worker secret in production)

#### Wrangler Configuration

Key `wrangler.toml` settings:
- `name`: Your Worker's name (affects the URL)
- `compatibility_date`: Cloudflare Workers runtime version
- `kv_namespaces`: KV storage configuration
- `vars`: Environment variables accessible in your Worker

### Troubleshooting

#### Common Issues

**1. Authentication Errors**
```bash
# Re-authenticate if login expires
npx wrangler logout
npx wrangler login
```

**2. KV Namespace Issues**
```bash
# List your KV namespaces
npx wrangler kv:namespace list

# Delete and recreate if needed
npx wrangler kv:namespace delete --binding RISK_LENS_KV --namespace-id <id>
```

**3. Deployment Failures**
```bash
# Check Worker logs
npx wrangler tail

# Deploy with verbose logging
npx wrangler deploy --debug
```

**4. Local Development Issues**
- Ensure port 8787 is available
- Check firewall settings
- Try `npx wrangler dev --local` for purely local mode

#### Error Messages

- **"Error: Not authenticated"**: Run `npx wrangler login`
- **"KV namespace not found"**: Check namespace IDs in `wrangler.toml`
- **"Worker threw exception"**: Check logs with `npx wrangler tail`

### Production Checklist

Before deploying to production:

- [ ] Update `wrangler.toml` with correct KV namespace IDs
- [ ] Set Hugging Face API token as Worker secret (optional)
- [ ] Test locally with `npm run dev`
- [ ] Verify all API endpoints work
- [ ] Check Worker logs for errors
- [ ] Set up custom domain (optional)
- [ ] Monitor usage and costs in Cloudflare dashboard

### Scaling and Monitoring

- **Usage Limits**: Free tier includes 100,000 requests/day
- **Monitoring**: View metrics in Cloudflare Workers dashboard
- **Logs**: Use `npx wrangler tail` for real-time logs
- **Custom Domains**: Configure in Cloudflare Workers dashboard

## Usage

1. **Upload PDF**: Drag and drop a PDF contract or click to browse
2. **Paste Text**: Alternatively, paste contract text directly
3. **Analyze**: Click "Analyze Contract" to get instant results
4. **Review**: Get summary, red flags, and structured clause extraction

## API Endpoints

- `GET /`: Serves the main application UI
- `GET /api/health`: Health check endpoint
- `POST /api/analyze`: Contract analysis endpoint
  ```json
  {
    "text": "Your contract text here..."
  }
  ```

## Development

- `npm run dev`: Start development server
- `npm run deploy`: Deploy to Cloudflare Workers

## License

MIT

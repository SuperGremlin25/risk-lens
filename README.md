# RiskLens 🔍

Drop a PDF contract → instant plain-English summary, red flags, and structured clause extraction (payment terms, dates, termination, indemnity, liability, IP, auto-renewal, governing law, insurance, etc.).

![RiskLens UI](https://github.com/user-attachments/assets/e62738cf-1324-43df-b0da-f6ef6e4e2a22)
![Analysis Results](https://github.com/user-attachments/assets/9a340717-6cd9-4f69-b6e3-89dff10d94fa)

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

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:8787 to test the application locally.

### Production Deployment

1. **One-time setup:**
   ```bash
   # Authenticate with Cloudflare
   npx wrangler login
   
   # Create KV namespaces
   npm run setup:kv
   
   # Update wrangler.toml with the generated namespace IDs
   ```

2. **Deploy to production:**
   ```bash
   # Run pre-deployment checks
   npm run pre-deploy
   
   # Deploy to production
   npm run deploy:production
   ```

3. **Verify deployment:**
   ```bash
   # Replace with your actual Worker URL
   npm run validate:deployment https://your-worker-url.workers.dev
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Configuration

### Environment Variables

The application works out of the box, but you can enhance it with:

- `HUGGINGFACE_API_TOKEN`: Optional Hugging Face API token for enhanced AI summaries (stored as Cloudflare secret)

### Cloudflare Setup

The automated setup script handles KV namespace creation:

```bash
npm run setup:kv
```

Or manually:
1. Create KV namespaces: `npx wrangler kv:namespace create "RISK_LENS_KV"`
2. Create preview namespace: `npx wrangler kv:namespace create "RISK_LENS_KV" --preview`
3. Update `wrangler.toml` with your KV namespace IDs
4. Deploy: `npm run deploy:production`

## Usage

1. **Upload PDF**: Drag and drop a PDF contract or click to browse
2. **Paste Text**: Alternatively, paste contract text directly
3. **Analyze**: Click "Analyze Contract" to get instant results
4. **Review**: Get summary, red flags, and structured clause extraction

## API Endpoints

- `GET /`: Serves the main application UI
- `GET /api/health`: Health check endpoint with system status
- `POST /api/analyze`: Contract analysis endpoint
  ```json
  {
    "text": "Your contract text here..."
  }
  ```

## Development & Testing

- `npm run dev`: Start development server (http://localhost:8787)
- `npm run test`: Run unit tests
- `npm run test:api`: Test API endpoints
- `npm run lint`: Run linting checks
- `npm run pre-deploy`: Run all pre-deployment checks
- `npm run security-audit`: Check for security vulnerabilities

## Production Scripts

- `npm run deploy:staging`: Deploy to staging environment
- `npm run deploy:production`: Deploy to production environment
- `npm run setup:kv`: Create required KV namespaces
- `npm run validate:deployment <url>`: Validate deployed application

## Monitoring

- Health check: `GET /api/health`
- Rate limiting: 10 requests per hour per IP
- Caching: 24-hour TTL for analysis results
- Real-time logs: `npx wrangler tail your-worker-name`

## Production Features

- 🔒 **Security**: Rate limiting, input validation, security headers
- ⚡ **Performance**: Edge caching, client-side PDF processing
- 🔍 **Monitoring**: Health checks, structured logging, error tracking
- 🚀 **CI/CD**: Automated testing and deployment via GitHub Actions
- 🌐 **Global**: Runs on Cloudflare's global edge network

## License

MIT

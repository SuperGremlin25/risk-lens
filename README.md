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

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `HUGGINGFACE_API_TOKEN`: Optional Hugging Face API token for enhanced summaries

### Cloudflare Setup

1. Create a KV namespace: `wrangler kv:namespace create "RISK_LENS_KV"`
2. Update `wrangler.toml` with your KV namespace IDs
3. Deploy: `npm run deploy`

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

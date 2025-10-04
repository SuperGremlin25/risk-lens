# RiskLens Setup Script for Windows (PowerShell)
# This script helps automate the initial setup process

Write-Host "🔍 RiskLens Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check if wrangler is available
Write-Host "Checking Wrangler CLI..." -ForegroundColor Yellow
try {
    $wranglerVersion = npx wrangler --version
    Write-Host "✅ Wrangler available" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler not available" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Cloudflare:" -ForegroundColor Yellow
Write-Host "   npx wrangler login" -ForegroundColor White
Write-Host ""
Write-Host "2. Create KV namespaces:" -ForegroundColor Yellow
Write-Host "   npx wrangler kv:namespace create `"RISK_LENS_KV`" --preview" -ForegroundColor White
Write-Host "   npx wrangler kv:namespace create `"RISK_LENS_KV`"" -ForegroundColor White
Write-Host ""
Write-Host "3. Update wrangler.toml with the namespace IDs from step 2" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. (Optional) Set Hugging Face API token:" -ForegroundColor Yellow
Write-Host "   npx wrangler secret put HUGGINGFACE_API_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "5. Test locally:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "6. Deploy to production:" -ForegroundColor Yellow
Write-Host "   npm run deploy" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to continue with Cloudflare login
Write-Host "Would you like to login to Cloudflare now? (y/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Opening Cloudflare login..." -ForegroundColor Yellow
    npx wrangler login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully logged in to Cloudflare" -ForegroundColor Green
        Write-Host ""
        Write-Host "Would you like to create KV namespaces now? (y/n): " -ForegroundColor Yellow -NoNewline
        $kvResponse = Read-Host
        
        if ($kvResponse -eq "y" -or $kvResponse -eq "Y") {
            Write-Host ""
            Write-Host "Creating preview KV namespace..." -ForegroundColor Yellow
            npx wrangler kv:namespace create "RISK_LENS_KV" --preview
            
            Write-Host ""
            Write-Host "Creating production KV namespace..." -ForegroundColor Yellow
            npx wrangler kv:namespace create "RISK_LENS_KV"
            
            Write-Host ""
            Write-Host "⚠️  IMPORTANT: Copy the namespace IDs above and update wrangler.toml" -ForegroundColor Yellow
            Write-Host ""
        }
    } else {
        Write-Host "❌ Failed to login to Cloudflare" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Setup complete! 🎉" -ForegroundColor Green
Write-Host "See DEPLOYMENT.md for next steps" -ForegroundColor Cyan

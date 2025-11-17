# Integrating RiskLens Worker with Your Cloudflare Page

You have two options to integrate this Worker with your existing Cloudflare Page.

## 🎯 Option 1: Embed as iFrame (Easiest - 5 minutes)

Add this to your existing Cloudflare Page HTML:

```html
<iframe 
  src="https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 8px;">
</iframe>
```

**Pros:**
- Quick and easy
- No code changes needed
- Worker runs independently

**Cons:**
- Looks like embedded content
- Limited styling control

---

## 🎯 Option 2: API Integration (Recommended - 30 minutes)

Use the Worker as an API backend for your existing page.

### Step 1: Update Worker CORS for Your Domain

Add your Cloudflare Page domain to the CORS headers. What's your page URL?

For example, if your page is `https://mysite.pages.dev`, update `worker.js`:

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://mysite.pages.dev', // Your domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Step 2: Add JavaScript to Your Cloudflare Page

Add this to your existing page:

```html
<!-- Add this where you want the contract analyzer -->
<div id="risk-lens-container">
  <h2>Contract Analysis</h2>
  
  <textarea 
    id="contract-text" 
    placeholder="Paste your contract text here..."
    rows="10"
    style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 8px;">
  </textarea>
  
  <button 
    onclick="analyzeContract()" 
    style="margin-top: 10px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer;">
    Analyze Contract
  </button>
  
  <div id="results" style="margin-top: 20px;"></div>
</div>

<script>
async function analyzeContract() {
  const text = document.getElementById('contract-text').value;
  const resultsDiv = document.getElementById('results');
  
  if (!text.trim()) {
    resultsDiv.innerHTML = '<p style="color: red;">Please enter contract text</p>';
    return;
  }
  
  resultsDiv.innerHTML = '<p>Analyzing...</p>';
  
  try {
    const response = await fetch('https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    
    const analysis = await response.json();
    displayResults(analysis);
  } catch (error) {
    resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

function displayResults(analysis) {
  const resultsDiv = document.getElementById('results');
  
  let html = '<div style="background: #f8f9ff; padding: 20px; border-radius: 8px;">';
  
  // Summary
  html += '<h3>Summary</h3>';
  html += `<p>${analysis.summary}</p>`;
  
  // Red Flags
  html += '<h3>Red Flags</h3>';
  if (analysis.redFlags.length > 0) {
    html += '<ul>';
    analysis.redFlags.forEach(flag => {
      html += `<li style="color: #c33;">${flag}</li>`;
    });
    html += '</ul>';
  } else {
    html += '<p style="color: #5c5;">No major red flags detected</p>';
  }
  
  // Jurisdiction
  if (analysis.jurisdiction) {
    html += '<h3>Jurisdiction</h3>';
    html += `<p>Approved states: ${analysis.jurisdiction.approvedStates.join(', ')}</p>`;
  }
  
  html += '</div>';
  resultsDiv.innerHTML = html;
}
</script>
```

### Step 3: Deploy Updated Worker

```powershell
npx wrangler deploy
```

---

## 🎯 Option 3: Custom Domain Route (Advanced)

Route a subdomain or path from your Cloudflare Page to the Worker.

### Example: mysite.com/analyze → Worker

1. Go to your Cloudflare Page settings
2. Add a custom route: `/analyze/*` → `risk-lens` worker
3. Users access it at: `https://yoursite.com/analyze`

**Setup:**
1. Go to: Cloudflare Dashboard → Workers → Your Worker → Settings → Triggers
2. Click "Add route"
3. Enter: `yoursite.com/analyze/*`
4. Select zone: Your domain
5. Save

---

## 📊 Usage Tracking

After deploying the updated worker with usage tracking, you'll see in logs:

```
📊 Daily API usage: 1024 chars
```

To check total usage for today:

```powershell
npx wrangler kv:key get "api_usage:2025-10-04" --binding=RISK_LENS_KV
```

---

## 🚀 Quick Start

**For fastest integration:**

1. Tell me your Cloudflare Page URL
2. I'll update the CORS settings
3. Copy the HTML/JS code above to your page
4. Deploy and test!

---

## 💡 Need Help?

Let me know:
- What's your Cloudflare Page URL?
- Which integration option do you prefer?
- Do you want me to generate the exact code for your setup?

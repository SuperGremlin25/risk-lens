/**
 * RiskLens Cloudflare Worker
 * Serves UI and provides API for contract analysis
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response('', { headers: CORS_HEADERS });
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }

    // Serve static files
    return handleStaticRequest(url);
  }
};

async function handleApiRequest(request, env, url) {
  try {
    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      return await analyzeContract(request, env);
    }
    
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

async function analyzeContract(request, env) {
  // Rate limiting check
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `rate_limit:${clientIP}`;
  
  const currentCount = await env.RISK_LENS_KV.get(rateLimitKey);
  if (currentCount && parseInt(currentCount) > 10) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const body = await request.json();
  const { text } = body;

  if (!text || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'No text provided' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  // Cache check
  const cacheKey = `analysis:${hashText(text)}`;
  const cachedResult = await env.RISK_LENS_KV.get(cacheKey);
  if (cachedResult) {
    return new Response(cachedResult, {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  // Analyze the contract
  const analysis = await performContractAnalysis(text, env);

  // Update rate limit
  await env.RISK_LENS_KV.put(rateLimitKey, 
    String((parseInt(currentCount) || 0) + 1), 
    { expirationTtl: 3600 }
  );

  // Cache result
  await env.RISK_LENS_KV.put(cacheKey, JSON.stringify(analysis), {
    expirationTtl: 86400 // 24 hours
  });

  return new Response(JSON.stringify(analysis), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

async function performContractAnalysis(text, env) {
  // Extract structured clauses
  const clauses = extractStructuredClauses(text);
  
  // Generate summary using Hugging Face
  const summary = await generateSummary(text, env);
  
  // Detect red flags
  const redFlags = detectRedFlags(text);

  return {
    summary,
    redFlags,
    clauses,
    timestamp: new Date().toISOString()
  };
}

function extractStructuredClauses(text) {
  const clauses = {};
  
  // Payment terms
  const paymentRegex = /payment[s]?\s+(?:terms?|due|within|shall be made)[\s\S]{0,200}/gi;
  const paymentMatches = text.match(paymentRegex);
  clauses.paymentTerms = paymentMatches || [];

  // Termination clauses
  const terminationRegex = /terminat(?:e|ion)[\s\S]{0,200}/gi;
  const terminationMatches = text.match(terminationRegex);
  clauses.termination = terminationMatches || [];

  // Liability and indemnity
  const liabilityRegex = /(?:liability|indemnif|indemnit)[\s\S]{0,200}/gi;
  const liabilityMatches = text.match(liabilityRegex);
  clauses.liability = liabilityMatches || [];

  // Intellectual property
  const ipRegex = /(?:intellectual property|copyright|trademark|patent)[\s\S]{0,200}/gi;
  const ipMatches = text.match(ipRegex);
  clauses.intellectualProperty = ipMatches || [];

  // Auto-renewal
  const renewalRegex = /(?:auto[- ]?renew|automatic(?:ally)? renew|renew(?:al)?)[\s\S]{0,200}/gi;
  const renewalMatches = text.match(renewalRegex);
  clauses.autoRenewal = renewalMatches || [];

  // Governing law
  const lawRegex = /(?:governing law|governed by|applicable law)[\s\S]{0,200}/gi;
  const lawMatches = text.match(lawRegex);
  clauses.governingLaw = lawMatches || [];

  // Insurance
  const insuranceRegex = /insurance[\s\S]{0,200}/gi;
  const insuranceMatches = text.match(insuranceRegex);
  clauses.insurance = insuranceMatches || [];

  // Extract dates
  const dateRegex = /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi;
  const dates = text.match(dateRegex) || [];
  clauses.dates = [...new Set(dates)]; // Remove duplicates

  return clauses;
}

async function generateSummary(text, env) {
  try {
    const response = await fetch(`${env.HUGGINGFACE_API_URL}/facebook/bart-large-cnn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.substring(0, 1024), // Limit input size
        parameters: {
          max_length: 150,
          min_length: 50,
          do_sample: false
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    return result[0]?.summary_text || generateFallbackSummary(text);
  } catch (error) {
    console.error('Summary generation error:', error);
    return generateFallbackSummary(text);
  }
}

function generateFallbackSummary(text) {
  // Simple extractive summary as fallback
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 3).join('. ').trim();
  return summary + (summary.endsWith('.') ? '' : '.');
}

function detectRedFlags(text) {
  const redFlags = [];
  
  const redFlagPatterns = [
    { pattern: /unlimited liability/gi, flag: 'Unlimited liability clause detected' },
    { pattern: /personal guarantee/gi, flag: 'Personal guarantee requirement found' },
    { pattern: /automatic renewal/gi, flag: 'Automatic renewal clause found' },
    { pattern: /non[- ]?compete/gi, flag: 'Non-compete clause detected' },
    { pattern: /sole discretion/gi, flag: 'Sole discretion clause found' },
    { pattern: /without cause/gi, flag: 'Termination without cause clause found' },
    { pattern: /liquidated damages/gi, flag: 'Liquidated damages clause detected' },
    { pattern: /assignment[^.]{0,50}without[^.]{0,50}consent/gi, flag: 'Assignment without consent clause found' },
    { pattern: /exclusive/gi, flag: 'Exclusivity clause detected' },
    { pattern: /penalty/gi, flag: 'Penalty clause found' }
  ];

  redFlagPatterns.forEach(({ pattern, flag }) => {
    if (pattern.test(text)) {
      redFlags.push(flag);
    }
  });

  return redFlags;
}

function handleStaticRequest(url) {
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response(HTML_CONTENT, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

function hashText(text) {
  // Simple hash function for caching
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiskLens - Contract Analysis</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .upload-section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .upload-area:hover {
            border-color: #764ba2;
            background-color: #f8f9ff;
        }
        
        .upload-area.dragover {
            border-color: #764ba2;
            background-color: #f0f0ff;
        }
        
        .upload-icon {
            font-size: 4rem;
            color: #667eea;
            margin-bottom: 20px;
        }
        
        .upload-text {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 10px;
        }
        
        .upload-hint {
            font-size: 0.9rem;
            color: #999;
        }
        
        #fileInput {
            display: none;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s ease;
            margin: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .analysis-section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: none;
        }
        
        .analysis-section.visible {
            display: block;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .summary {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        
        .red-flags {
            margin-bottom: 30px;
        }
        
        .red-flag {
            background: #fee;
            border: 1px solid #fcc;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            color: #c33;
        }
        
        .clauses {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .clause-category {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .clause-title {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
            text-transform: capitalize;
        }
        
        .clause-item {
            background: white;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 3px solid #667eea;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error {
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #fcc;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 RiskLens</h1>
            <p>Drop a PDF contract → instant analysis, red flags, and structured clause extraction</p>
        </div>
        
        <div class="upload-section">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📄</div>
                <div class="upload-text">Drop your PDF contract here or click to browse</div>
                <div class="upload-hint">Supports PDF files up to 10MB</div>
                <input type="file" id="fileInput" accept=".pdf">
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn" id="analyzeBtn" disabled>Analyze Contract</button>
            </div>
        </div>
        
        <div class="analysis-section" id="analysisSection">
            <div class="loading" id="loadingDiv">
                <div class="spinner"></div>
                <p>Analyzing your contract...</p>
            </div>
            
            <div id="resultsDiv" style="display: none;">
                <h2 class="section-title">📋 Contract Summary</h2>
                <div class="summary" id="summaryDiv"></div>
                
                <h2 class="section-title">🚩 Red Flags</h2>
                <div class="red-flags" id="redFlagsDiv"></div>
                
                <h2 class="section-title">📑 Extracted Clauses</h2>
                <div class="clauses" id="clausesDiv"></div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        let selectedFile = null;
        let extractedText = '';
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const analysisSection = document.getElementById('analysisSection');
        const loadingDiv = document.getElementById('loadingDiv');
        const resultsDiv = document.getElementById('resultsDiv');
        
        // Upload area interactions
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);
        analyzeBtn.addEventListener('click', analyzeContract);
        
        function handleDragOver(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        }
        
        function handleDragLeave(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        }
        
        function handleDrop(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                selectedFile = files[0];
                updateUploadArea();
            }
        }
        
        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                selectedFile = file;
                updateUploadArea();
            }
        }
        
        function updateUploadArea() {
            if (selectedFile) {
                uploadArea.innerHTML = \`
                    <div class="upload-icon">✅</div>
                    <div class="upload-text">Selected: \${selectedFile.name}</div>
                    <div class="upload-hint">File size: \${(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                \`;
                analyzeBtn.disabled = false;
            }
        }
        
        async function extractTextFromPDF(file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\\n';
                }
                
                return fullText;
            } catch (error) {
                console.error('PDF extraction error:', error);
                throw new Error('Failed to extract text from PDF');
            }
        }
        
        async function analyzeContract() {
            if (!selectedFile) return;
            
            analysisSection.classList.add('visible');
            loadingDiv.style.display = 'block';
            resultsDiv.style.display = 'none';
            analyzeBtn.disabled = true;
            
            try {
                // Extract text from PDF
                extractedText = await extractTextFromPDF(selectedFile);
                
                if (!extractedText.trim()) {
                    throw new Error('No text could be extracted from the PDF');
                }
                
                // Send to API for analysis
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: extractedText })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Analysis failed');
                }
                
                const analysis = await response.json();
                displayResults(analysis);
                
            } catch (error) {
                console.error('Analysis error:', error);
                showError(error.message);
            } finally {
                loadingDiv.style.display = 'none';
                analyzeBtn.disabled = false;
            }
        }
        
        function displayResults(analysis) {
            // Display summary
            document.getElementById('summaryDiv').textContent = analysis.summary;
            
            // Display red flags
            const redFlagsDiv = document.getElementById('redFlagsDiv');
            if (analysis.redFlags.length > 0) {
                redFlagsDiv.innerHTML = analysis.redFlags
                    .map(flag => \`<div class="red-flag">⚠️ \${flag}</div>\`)
                    .join('');
            } else {
                redFlagsDiv.innerHTML = '<div style="color: #5c5; font-weight: bold;">✅ No major red flags detected</div>';
            }
            
            // Display clauses
            const clausesDiv = document.getElementById('clausesDiv');
            const clauseCategories = Object.entries(analysis.clauses)
                .filter(([key, value]) => Array.isArray(value) && value.length > 0)
                .map(([key, value]) => {
                    const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const items = value.map(item => 
                        \`<div class="clause-item">\${item.length > 200 ? item.substring(0, 200) + '...' : item}</div>\`
                    ).join('');
                    
                    return \`
                        <div class="clause-category">
                            <div class="clause-title">\${title}</div>
                            \${items}
                        </div>
                    \`;
                }).join('');
            
            clausesDiv.innerHTML = clauseCategories || '<div>No specific clauses extracted</div>';
            
            resultsDiv.style.display = 'block';
        }
        
        function showError(message) {
            resultsDiv.innerHTML = \`<div class="error">❌ \${message}</div>\`;
            resultsDiv.style.display = 'block';
        }
    </script>
</body>
</html>
`;
# Product Requirements Document (PRD)
## RiskLens API Integration for Existing Webpage

**Project Name:** RiskLens Webpage Integration  
**Version:** 1.0.0  
**Date:** October 4, 2025  
**Author:** Development Team  
**Status:** Ready for Implementation

---

## Executive Summary

Integrate the RiskLens contract analysis Worker as an API backend into an existing Cloudflare Pages website. Users will be able to analyze contracts directly from the webpage without leaving the site, providing a seamless, native experience.

---

## Problem Statement

Currently, RiskLens exists as a standalone Worker application. The goal is to embed contract analysis functionality into an existing webpage to:

- Provide contract analysis without redirecting users
- Maintain consistent branding and UX with the existing site
- Leverage the existing Worker API infrastructure
- Keep costs at $0 for the integration (only HF API usage costs apply)

---

## Goals and Objectives

### Business Goals
- Increase user engagement by adding contract analysis to existing site
- Provide value-added service without additional infrastructure costs
- Maintain seamless user experience

### Technical Goals
- Integrate Worker API with existing Cloudflare Page
- Implement proper CORS configuration
- Ensure secure API communication
- Track API usage for cost monitoring

### User Goals
- Analyze contracts without leaving the webpage
- Get instant results with AI-powered summaries
- See red flags and structured clause extraction
- Mobile-responsive experience

---

## Technical Architecture

### Current Setup
- **Existing Site**: Cloudflare Page (URL: TBD)
- **Worker API**: `
- **Backend**: Cloudflare Worker with KV storage
- **AI**: Hugging Face API (facebook/bart-large-cnn)

### Integration Method
**API Integration** (Option 2 from integration guide)

**Why API Integration:**
- ✅ Native look and feel
- ✅ Full styling control
- ✅ No iframe limitations
- ✅ Better SEO
- ✅ $0 additional cost

---

## Features and Requirements

### Core Features

#### 1. Contract Input Interface
**Requirements:**
- Large textarea for contract text input (min 10 rows)
- File upload support for PDF contracts (client-side extraction)
- Character count display
- Clear/reset button
- Input validation

**Acceptance Criteria:**
- Textarea accepts at least 10,000 characters
- PDF upload extracts text using PDF.js
- Shows character count in real-time
- Validates input before submission

#### 2. Analysis Trigger
**Requirements:**
- "Analyze Contract" button
- Loading state during analysis
- Disabled state when no input
- Error handling for failed requests

**Acceptance Criteria:**
- Button disabled when textarea empty
- Shows loading spinner during API call
- Displays error messages clearly
- Handles network failures gracefully

#### 3. Results Display
**Requirements:**
- AI-generated summary section
- Red flags list with warning icons
- Structured clauses breakdown:
  - Payment terms
  - Termination clauses
  - Liability & indemnity
  - Intellectual property
  - Auto-renewal
  - Governing law
  - Insurance requirements
  - Important dates
- Jurisdiction validation display

**Acceptance Criteria:**
- Summary displays in readable format
- Red flags highlighted in red/warning color
- Clauses organized in collapsible sections
- Jurisdiction shows approved states
- Mobile responsive layout

#### 4. API Integration
**Requirements:**
- POST to `/api/analyze` endpoint
- Proper CORS headers
- JSON request/response handling
- Error response handling

**Acceptance Criteria:**
- API calls succeed from webpage domain
- Handles 200, 403, 429, 500 status codes
- Displays appropriate error messages
- Timeout handling (30 seconds)

---

## Implementation Specifications

### Frontend (Webpage)

#### HTML Structure
```html
<div id="risk-lens-analyzer">
  <h2>Contract Analysis</h2>
  
  <!-- Input Section -->
  <div class="input-section">
    <textarea id="contract-input"></textarea>
    <div class="input-controls">
      <button id="upload-pdf">Upload PDF</button>
      <button id="clear-input">Clear</button>
      <span id="char-count">0 characters</span>
    </div>
  </div>
  
  <!-- Action Button -->
  <button id="analyze-btn">Analyze Contract</button>
  
  <!-- Results Section -->
  <div id="results-section" style="display: none;">
    <div id="summary"></div>
    <div id="red-flags"></div>
    <div id="clauses"></div>
    <div id="jurisdiction"></div>
  </div>
  
  <!-- Loading State -->
  <div id="loading" style="display: none;">
    <div class="spinner"></div>
    <p>Analyzing your contract...</p>
  </div>
  
  <!-- Error Display -->
  <div id="error" style="display: none;"></div>
</div>
```

#### JavaScript API Integration
```javascript
const API_ENDPOINT = 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/api/analyze';

async function analyzeContract(text) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}
```

### Backend (Worker)

#### CORS Configuration Update
```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://your-page.pages.dev', // Update with actual URL
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

#### API Response Format
```json
{
  "summary": "AI-generated contract summary...",
  "redFlags": [
    "Unlimited liability clause detected",
    "Automatic renewal clause found"
  ],
  "clauses": {
    "paymentTerms": ["Payment due within 30 days..."],
    "termination": ["Either party may terminate..."],
    "liability": ["Company A shall indemnify..."],
    "intellectualProperty": [],
    "autoRenewal": ["Contract automatically renews..."],
    "governingLaw": ["Governed by laws of Texas..."],
    "insurance": [],
    "dates": ["January 1, 2024", "December 31, 2024"]
  },
  "jurisdiction": {
    "detectedStates": ["texas"],
    "approvedStates": ["texas"]
  },
  "timestamp": "2025-10-04T05:00:00.000Z"
}
```

---

## User Experience Flow

### Happy Path
1. User navigates to webpage
2. User pastes contract text OR uploads PDF
3. Character count updates in real-time
4. User clicks "Analyze Contract"
5. Loading spinner appears
6. Results display within 5-30 seconds
7. User reviews summary, red flags, and clauses
8. User can analyze another contract

### Error Paths

#### Invalid Jurisdiction
- **Trigger**: Contract from unsupported state
- **Response**: 403 status
- **Display**: "This analyzer only supports contracts from: [list]. Detected: [state]"

#### Rate Limit Exceeded
- **Trigger**: >10 requests/hour from same IP
- **Response**: 429 status
- **Display**: "Rate limit exceeded. Please try again in 1 hour."

#### API Error
- **Trigger**: HuggingFace API failure
- **Response**: 500 status
- **Display**: "Analysis failed. Using basic summarization. [error details]"

#### Network Error
- **Trigger**: Network timeout or connection failure
- **Display**: "Network error. Please check your connection and try again."

---

## Styling Guidelines

### Design Principles
- Match existing webpage branding
- Mobile-first responsive design
- Clear visual hierarchy
- Accessible (WCAG 2.1 AA)

### Color Scheme (Customizable)
- **Primary**: #667eea (purple-blue gradient)
- **Success**: #5c5 (green)
- **Warning**: #c33 (red)
- **Background**: #f8f9ff (light purple)
- **Text**: #333 (dark gray)

### Typography
- Headers: 1.5-2rem, bold
- Body: 1rem, regular
- Code/Clauses: 0.9rem, monospace

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (flexible layout)
- Desktop: > 1024px (multi-column)

---

## Security Considerations

### API Security
- ✅ CORS restricted to specific domain
- ✅ Rate limiting (10 req/hour per IP)
- ✅ Input validation (max text length)
- ✅ No sensitive data storage
- ✅ HTTPS only

### Data Privacy
- ✅ Contracts not permanently stored
- ✅ 24-hour cache expiration
- ✅ No user tracking
- ✅ No PII collection

---

## Performance Requirements

### Response Times
- **API Call**: < 30 seconds (95th percentile)
- **Page Load**: < 3 seconds
- **UI Interaction**: < 100ms

### Scalability
- **Concurrent Users**: 100+ supported
- **Daily Requests**: Up to 100,000 (free tier)
- **Cache Hit Rate**: > 60% target

---

## Cost Analysis

### Infrastructure Costs
- **Cloudflare Page**: $0 (already deployed)
- **Cloudflare Worker**: $0 (within free tier)
- **Cloudflare KV**: $0 (within free tier)
- **API Integration**: $0 (no additional cost)

### Variable Costs (Hugging Face)
- **Free Tier**: 30,000 chars/month (~29 analyses)
- **Paid Tier**: $9/month for 1M chars (~1,000 analyses)

### Total Monthly Cost
- **Light Usage** (< 30 analyses): $0/month
- **Medium Usage** (100-1,000 analyses): $9/month
- **Heavy Usage** (1,000+ analyses): $9-20/month

---

## Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Get Cloudflare Page URL from user
- [ ] Update CORS headers in worker.js
- [ ] Deploy updated Worker
- [ ] Test CORS from webpage domain

### Phase 2: Frontend Integration (Day 1-2)
- [ ] Add HTML structure to webpage
- [ ] Implement JavaScript API integration
- [ ] Add PDF upload functionality (PDF.js)
- [ ] Style to match existing site
- [ ] Add loading states
- [ ] Implement error handling

### Phase 3: Testing (Day 2-3)
- [ ] Test with valid contracts
- [ ] Test with invalid jurisdictions
- [ ] Test rate limiting
- [ ] Test error scenarios
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

### Phase 4: Deployment (Day 3)
- [ ] Deploy to Cloudflare Page
- [ ] Verify API connectivity
- [ ] Monitor logs for errors
- [ ] Check usage tracking

### Phase 5: Monitoring (Ongoing)
- [ ] Daily usage checks
- [ ] Error rate monitoring
- [ ] HuggingFace API costs
- [ ] User feedback collection

---

## Success Metrics

### Technical Metrics
- **API Success Rate**: > 95%
- **Average Response Time**: < 15 seconds
- **Error Rate**: < 5%
- **Cache Hit Rate**: > 60%

### Business Metrics
- **Daily Active Users**: Track engagement
- **Analyses per User**: Average usage
- **Conversion Rate**: If monetizing
- **User Satisfaction**: Feedback score > 4/5

### Cost Metrics
- **Daily HF API Usage**: < 1,000 chars (free tier)
- **Monthly Cost**: Target < $10/month
- **Cost per Analysis**: < $0.01

---

## Risks and Mitigations

### Technical Risks

#### Risk: CORS Issues
- **Impact**: API calls fail from webpage
- **Mitigation**: Test CORS thoroughly, use wildcard for testing, lock down for production

#### Risk: Rate Limiting Too Strict
- **Impact**: Legitimate users blocked
- **Mitigation**: Monitor rate limit hits, adjust if needed, implement user feedback

#### Risk: HuggingFace API Downtime
- **Impact**: No AI summaries
- **Mitigation**: Fallback summarization already implemented, graceful degradation

### Business Risks

#### Risk: Unexpected API Costs
- **Impact**: Budget overrun
- **Mitigation**: Usage tracking implemented, daily monitoring, alerts at thresholds

#### Risk: Low Adoption
- **Impact**: Wasted development effort
- **Mitigation**: User testing before full deployment, feedback loop, iterative improvements

---

## Timeline

### Week 1: Implementation
- **Day 1**: CORS setup, basic integration
- **Day 2**: Frontend development, styling
- **Day 3**: Testing, bug fixes
- **Day 4**: Deployment, monitoring
- **Day 5**: Buffer for issues

### Week 2: Optimization
- **Day 1-2**: Performance tuning
- **Day 3-4**: User feedback incorporation
- **Day 5**: Documentation updates

---

## Dependencies

### External Services
- Cloudflare Pages (existing)
- Cloudflare Workers (deployed)
- Hugging Face API (configured)
- PDF.js CDN (for PDF upload)

### Required Information
- **Cloudflare Page URL**: [TO BE PROVIDED]
- **Domain Name**: [TO BE PROVIDED]
- **Branding Guidelines**: [TO BE PROVIDED]

---

## Next Steps

### Immediate Actions
1. **Provide Webpage URL**: Share your Cloudflare Page URL
2. **Review Design**: Confirm styling preferences
3. **Update CORS**: I'll update worker.js with your domain
4. **Generate Code**: I'll create exact copy-paste code for your page

### Questions to Answer
1. What's your Cloudflare Page URL?
2. Do you want PDF upload functionality?
3. Any specific styling requirements?
4. Where on the page should the analyzer appear?

---

## Appendix

### API Endpoint Reference

#### POST /api/analyze
**Request:**
```json
{
  "text": "Contract text here..."
}
```

**Response (200):**
```json
{
  "summary": "...",
  "redFlags": [...],
  "clauses": {...},
  "jurisdiction": {...}
}
```

**Response (403 - Invalid Jurisdiction):**
```json
{
  "error": "This analyzer only supports contracts from: ..."
}
```

**Response (429 - Rate Limit):**
```json
{
  "error": "Rate limit exceeded"
}
```

### Usage Tracking Commands

**Check today's usage:**
```powershell
npx wrangler kv:key get "api_usage:2025-10-04" --binding=RISK_LENS_KV
```

**View logs:**
```powershell
npx wrangler tail
```

---

## Conclusion

This integration provides a seamless, cost-effective way to add contract analysis to your existing webpage. With $0 additional infrastructure costs and comprehensive error handling, users get a native experience while you maintain full control over branding and UX.

**Ready to implement?** Provide your Cloudflare Page URL and I'll generate the exact code you need!

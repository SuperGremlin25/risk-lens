# Security Policy

## Security Overview

RiskLens takes security seriously. This document outlines our security measures and best practices.

## Data Handling

### Contract Content
- **No Permanent Storage:** Contract text is never stored permanently
- **Transient Processing:** Analysis occurs in memory only
- **Caching:** Results are cached for 24 hours to improve performance
- **Encryption:** All data transmission uses HTTPS/TLS

### Rate Limiting
- **IP-based Limiting:** 10 requests per hour per IP address
- **KV Storage:** Rate limit counters stored in Cloudflare KV with 1-hour TTL
- **Automatic Cleanup:** Expired rate limit data is automatically removed

## Input Validation

### Text Input
- **Length Limits:** Maximum contract text size enforced
- **Content Sanitization:** All inputs are validated before processing
- **Type Checking:** Strict type validation for API requests

### File Upload
- **Type Validation:** Only PDF files accepted
- **Size Limits:** 10MB maximum file size
- **Client-side Processing:** PDF text extraction occurs client-side to reduce server load

## API Security

### CORS Protection
- **Origin Validation:** CORS headers properly configured
- **Preflight Handling:** OPTIONS requests handled appropriately
- **Allowed Methods:** GET, POST, OPTIONS only

### Error Handling
- **Information Disclosure:** Error messages don't expose internal system details
- **Status Codes:** Appropriate HTTP status codes returned
- **Logging:** Errors logged for monitoring without exposing sensitive data

## Infrastructure Security

### Cloudflare Workers
- **Serverless:** No persistent servers to attack
- **Edge Computing:** Distributed across global edge network
- **DDoS Protection:** Built-in Cloudflare DDoS mitigation

### KV Storage
- **Access Control:** KV namespace access restricted to worker
- **Encryption:** Data encrypted at rest
- **TTL Expiration:** Automatic data expiration prevents data accumulation

## AI Service Security

### Hugging Face Integration
- **API Token:** Secure token storage in environment variables
- **Fallback Mode:** System continues operating if AI service unavailable
- **Input Limits:** Contract text truncated to prevent API abuse

## Monitoring and Incident Response

### Logging
- **Error Tracking:** All errors logged with appropriate detail level
- **Performance Monitoring:** Response times and error rates tracked
- **Health Checks:** `/api/health` endpoint for service monitoring

### Incident Response
- **Automated Alerts:** Critical errors trigger alerts
- **Rollback Capability:** Quick deployment rollback via Wrangler
- **Communication:** Security incidents communicated to users transparently

## Compliance

### Data Privacy
- **GDPR Compliance:** No personal data stored or processed
- **Minimal Data Retention:** Contract data exists only during analysis
- **User Consent:** Clear terms of service regarding data handling

### Legal Compliance
- **Jurisdiction Limits:** Only approved US states supported
- **Disclaimer:** Clear legal disclaimers in UI
- **Accuracy Notice:** Analysis results clearly marked as AI-generated

## Security Best Practices

### Development
- **Code Reviews:** All changes reviewed before deployment
- **Automated Testing:** CI/CD pipeline includes security checks
- **Dependency Scanning:** Regular security audits of dependencies

### Deployment
- **Environment Separation:** Development and production environments isolated
- **Secret Management:** API keys and secrets stored securely
- **Access Control:** Deployment access restricted to authorized personnel

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do Not** create public GitHub issues for security vulnerabilities
2. Email security concerns to: [security contact email]
3. Include detailed description and steps to reproduce
4. Allow reasonable time for response and fix

## Security Updates

Security updates will be:
- Deployed as soon as possible after identification
- Communicated to users through release notes
- Documented in this security policy

## Contact

For security-related questions or concerns, contact the development team through appropriate channels.
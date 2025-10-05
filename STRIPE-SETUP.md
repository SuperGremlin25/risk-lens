# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe payments for RiskLens.

## 📋 Prerequisites

- Stripe account (sign up at https://stripe.com)
- Cloudflare Workers account
- RiskLens deployed to Cloudflare Workers

---

## 🔧 Step 1: Create Stripe Products & Prices

### 1.1 Log into Stripe Dashboard

Go to https://dashboard.stripe.com

### 1.2 Create Products

Navigate to **Products** → **Add Product** and create the following:

#### **Starter Plan**
- **Name**: RiskLens Starter
- **Description**: 50 contract analyses per month with AI summaries
- **Pricing**: $29.00 USD / month
- **Billing Period**: Monthly, recurring
- **Copy the Price ID** (starts with `price_`) - you'll need this

#### **Professional Plan**
- **Name**: RiskLens Professional
- **Description**: 250 analyses/month + API access + team collaboration
- **Pricing**: $99.00 USD / month
- **Billing Period**: Monthly, recurring
- **Copy the Price ID**

#### **Business Plan**
- **Name**: RiskLens Business
- **Description**: 1,000 analyses/month + unlimited API + white-label
- **Pricing**: $299.00 USD / month
- **Billing Period**: Monthly, recurring
- **Copy the Price ID**

### 1.3 Update Price IDs in Code

Edit `src/stripe-integration.js` and update the `stripePriceId` values:

```javascript
export const PRICING_TIERS = {
  starter: {
    // ...
    stripePriceId: 'price_YOUR_ACTUAL_STARTER_PRICE_ID'
  },
  professional: {
    // ...
    stripePriceId: 'price_YOUR_ACTUAL_PROFESSIONAL_PRICE_ID'
  },
  business: {
    // ...
    stripePriceId: 'price_YOUR_ACTUAL_BUSINESS_PRICE_ID'
  }
};
```

---

## 🔑 Step 2: Get Your Stripe API Keys

### 2.1 Get Secret Key

1. Go to **Developers** → **API Keys**
2. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
3. **IMPORTANT**: Never commit this to git!

### 2.2 Set Secret in Cloudflare Workers

```powershell
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your secret key when prompted
```

---

## 🪝 Step 3: Configure Stripe Webhooks

Webhooks allow Stripe to notify your app about subscription events (payments, cancellations, etc.)

### 3.1 Get Your Worker URL

Your webhook endpoint will be:
```
https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/webhooks/stripe
```

Or if using a custom domain:
```
https://yourdomain.com/webhooks/stripe
```

### 3.2 Create Webhook in Stripe

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL from above
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
   - `customer.subscription.trial_will_end`
5. Click **Add endpoint**

### 3.3 Get Webhook Signing Secret

1. Click on your newly created webhook
2. Click **Reveal** next to **Signing secret**
3. Copy the secret (starts with `whsec_`)

### 3.4 Set Webhook Secret in Cloudflare Workers

```powershell
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your webhook signing secret when prompted
```

---

## 🔐 Step 4: Configure JWT Authentication

Generate a secure random secret for JWT tokens:

```powershell
# Generate a random 64-character secret
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Your JWT Secret: $secret"

# Set it in Cloudflare Workers
npx wrangler secret put JWT_SECRET
# Paste the generated secret when prompted
```

---

## 🧪 Step 5: Test the Integration

### 5.1 Use Stripe Test Mode

Make sure you're using **test mode** API keys (they start with `sk_test_` and `whsec_test_`)

### 5.2 Test Credit Cards

Stripe provides test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiration date and any 3-digit CVC.

### 5.3 Test Subscription Flow

1. Deploy your worker: `npm run deploy`
2. Visit your worker URL
3. Try creating a subscription with a test card
4. Check Stripe Dashboard → **Payments** to see the test payment
5. Check Cloudflare Workers logs: `npm run logs`

### 5.4 Test Webhook Delivery

1. Go to **Developers** → **Webhooks** in Stripe
2. Click on your webhook
3. Click **Send test webhook**
4. Select an event type (e.g., `customer.subscription.created`)
5. Check your worker logs to see if it was received

---

## 🚀 Step 6: Go Live

### 6.1 Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)
2. Get your **live** API keys from **Developers** → **API Keys**
3. Update your secrets with live keys:

```powershell
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your LIVE secret key (starts with sk_live_)

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your LIVE webhook secret (starts with whsec_)
```

### 6.2 Update Webhook for Production

1. Create a new webhook endpoint in **Live mode**
2. Use your production URL
3. Select the same events as before
4. Update the webhook secret

### 6.3 Enable Customer Portal

The customer portal allows users to manage their subscriptions:

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate test link** (or **Activate** for live mode)
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans
   - ✅ Show pricing table

---

## 📊 Step 7: Monitor & Analytics

### 7.1 Stripe Dashboard

Monitor your revenue in real-time:
- **Home** → See daily revenue, MRR, customer count
- **Payments** → View all transactions
- **Subscriptions** → Manage active subscriptions
- **Customers** → View customer details

### 7.2 Cloudflare Analytics

Monitor API usage:
```powershell
npm run logs
```

Or view in Cloudflare Dashboard:
- Workers → Your Worker → Metrics

### 7.3 Set Up Alerts

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Enable email notifications for failed webhooks
3. Set up alerts for failed payments

---

## 🛡️ Security Checklist

- [ ] Never commit API keys to git
- [ ] Use environment variables for all secrets
- [ ] Verify webhook signatures (already implemented)
- [ ] Use HTTPS only (Cloudflare Workers enforces this)
- [ ] Implement rate limiting (already implemented)
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up 2FA on your Stripe account
- [ ] Regularly rotate JWT secrets

---

## 🔄 API Endpoints Reference

Your RiskLens API now includes these endpoints:

### **Public Endpoints**
- `GET /api/health` - Health check
- `GET /api/pricing` - Get pricing tiers

### **Authenticated Endpoints**
- `POST /api/analyze` - Analyze contract (requires auth)
- `GET /api/subscription` - Get user subscription info
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/payment-intent` - Create pay-as-you-go payment
- `POST /api/customer-portal` - Get customer portal URL
- `POST /api/generate-api-key` - Generate API key for user

### **Webhook Endpoint**
- `POST /webhooks/stripe` - Stripe webhook handler (Stripe only)

---

## 🧪 Testing Checklist

- [ ] Free tier: 3 analyses/month limit works
- [ ] Starter tier: 50 analyses/month, AI summaries enabled
- [ ] Professional tier: 250 analyses/month, API access works
- [ ] Business tier: 1,000 analyses/month
- [ ] Usage counter increments correctly
- [ ] Monthly limits reset properly
- [ ] Subscription upgrade/downgrade works
- [ ] Subscription cancellation works
- [ ] Payment failure handling works
- [ ] Webhook signature verification works
- [ ] JWT authentication works
- [ ] API key authentication works

---

## 🆘 Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify webhook is enabled in Stripe
3. Check Cloudflare Workers logs for errors
4. Test webhook delivery in Stripe Dashboard

### Authentication Errors

1. Verify JWT_SECRET is set: `npx wrangler secret list`
2. Check token expiration
3. Ensure Authorization header format: `Bearer <token>`

### Subscription Not Updating

1. Check webhook events are being received
2. Verify webhook signature is valid
3. Check KV namespace is accessible
4. Review worker logs for errors

### Payment Failures

1. Check Stripe Dashboard for decline reason
2. Verify test card numbers in test mode
3. Check customer has valid payment method
4. Review Stripe Radar for fraud blocks

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

## 💡 Next Steps

1. **Add Email Notifications**: Integrate with SendGrid or Mailgun for welcome emails, payment receipts, etc.
2. **Build Frontend**: Create a React/Next.js frontend with Stripe Elements for checkout
3. **Add Analytics**: Integrate with Google Analytics or Mixpanel
4. **Implement Referral Program**: Use Stripe's affiliate features
5. **Add Team Features**: Implement team management for Professional/Business tiers
6. **Create Admin Dashboard**: Build internal dashboard for customer support

---

## 🎉 You're Ready!

Your RiskLens app is now monetized with Stripe! Start acquiring customers and generating revenue.

**Remember**: Start with test mode, validate everything works, then switch to live mode.

Good luck! 🚀

/**
 * Stripe Integration Module
 * Handles subscription management, usage tracking, and billing
 */

// Pricing tier limits
export const PRICING_TIERS = {
    free: {
        name: 'Free',
        monthlyLimit: 3,
        features: ['basic_analysis', 'state_compliance', 'clause_extraction'],
        price: 0
    },
    starter: {
        name: 'Starter',
        monthlyLimit: 50,
        features: ['basic_analysis', 'state_compliance', 'clause_extraction', 'ai_summary', 'pdf_export'],
        price: 2900, // $29.00 in cents
        stripePriceId: 'price_starter_monthly' // Replace with actual Stripe Price ID
    },
    professional: {
        name: 'Professional',
        monthlyLimit: 250,
        features: ['basic_analysis', 'state_compliance', 'clause_extraction', 'ai_summary', 'pdf_export', 'api_access', 'bulk_upload', 'team_collaboration'],
        price: 9900, // $99.00 in cents
        stripePriceId: 'price_professional_monthly'
    },
    business: {
        name: 'Business',
        monthlyLimit: 1000,
        features: ['basic_analysis', 'state_compliance', 'clause_extraction', 'ai_summary', 'pdf_export', 'api_access', 'bulk_upload', 'team_collaboration', 'white_label', 'dedicated_support'],
        price: 29900, // $299.00 in cents
        stripePriceId: 'price_business_monthly'
    }
};

// Pay-as-you-go pricing
export const PAY_AS_YOU_GO_PRICE = 199; // $1.99 in cents
export const OVERAGE_PRICE = 150; // $1.50 per analysis beyond limit

/**
 * Verify Stripe webhook signature
 */
export async function verifyStripeWebhook(request, env) {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('Missing webhook signature or secret');
    }

    // Parse signature header
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t=')).split('=')[1];
    const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.split('=')[1]);

    // Construct expected signature
    const payload = `${timestamp}.${body}`;
    const expectedSignature = await computeHmacSha256(payload, env.STRIPE_WEBHOOK_SECRET);

    // Verify signature
    const isValid = signatures.some(sig => sig === expectedSignature);

    if (!isValid) {
        throw new Error('Invalid webhook signature');
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - parseInt(timestamp) > 300) {
        throw new Error('Webhook timestamp too old');
    }

    return JSON.parse(body);
}

/**
 * Compute HMAC SHA-256 signature
 */
async function computeHmacSha256(data, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Get user's subscription details from KV
 */
export async function getUserSubscription(userId, env) {
    const subKey = `subscription:${userId}`;
    const subData = await env.RISK_LENS_KV.get(subKey);

    if (!subData) {
        return {
            tier: 'free',
            status: 'active',
            customerId: null,
            subscriptionId: null,
            currentPeriodEnd: null
        };
    }

    return JSON.parse(subData);
}

/**
 * Update user's subscription in KV
 */
export async function updateUserSubscription(userId, subscriptionData, env) {
    const subKey = `subscription:${userId}`;
    await env.RISK_LENS_KV.put(subKey, JSON.stringify(subscriptionData));
}

/**
 * Get user's usage for current billing period
 */
export async function getUserUsage(userId, env) {
    const now = new Date();
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageKey = `usage:${userId}:${periodKey}`;

    const usageData = await env.RISK_LENS_KV.get(usageKey);

    if (!usageData) {
        return {
            count: 0,
            periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
        };
    }

    return JSON.parse(usageData);
}

/**
 * Increment user's usage counter
 */
export async function incrementUserUsage(userId, env) {
    const now = new Date();
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageKey = `usage:${userId}:${periodKey}`;

    const currentUsage = await getUserUsage(userId, env);
    const newCount = currentUsage.count + 1;

    const updatedUsage = {
        count: newCount,
        periodStart: currentUsage.periodStart,
        periodEnd: currentUsage.periodEnd,
        lastUsed: now.toISOString()
    };

    // Store with expiration at end of next month (to keep historical data for one month)
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const ttl = Math.floor((nextMonthEnd - now) / 1000);

    await env.RISK_LENS_KV.put(usageKey, JSON.stringify(updatedUsage), { expirationTtl: ttl });

    return updatedUsage;
}

/**
 * Check if user can perform analysis (within limits)
 */
export async function canUserAnalyze(userId, env) {
    const subscription = await getUserSubscription(userId, env);
    const usage = await getUserUsage(userId, env);
    const tier = PRICING_TIERS[subscription.tier];

    if (!tier) {
        return { allowed: false, reason: 'Invalid subscription tier' };
    }

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.tier !== 'free') {
        return { allowed: false, reason: 'Subscription inactive' };
    }

    // Check usage limits
    if (usage.count >= tier.monthlyLimit) {
        return {
            allowed: false,
            reason: 'Monthly limit reached',
            usage: usage.count,
            limit: tier.monthlyLimit,
            tier: subscription.tier
        };
    }

    return {
        allowed: true,
        usage: usage.count,
        limit: tier.monthlyLimit,
        remaining: tier.monthlyLimit - usage.count,
        tier: subscription.tier
    };
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(userId, priceId, env, successUrl, cancelUrl) {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'mode': 'subscription',
            'customer': userId, // Or create new customer
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            'success_url': successUrl,
            'cancel_url': cancelUrl,
            'metadata[user_id]': userId
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error.message}`);
    }

    return await response.json();
}

/**
 * Create pay-as-you-go payment intent
 */
export async function createPaymentIntent(userId, env) {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'amount': PAY_AS_YOU_GO_PRICE.toString(),
            'currency': 'usd',
            'metadata[user_id]': userId,
            'metadata[type]': 'pay_as_you_go'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error.message}`);
    }

    return await response.json();
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, env) {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error.message}`);
    }

    return await response.json();
}

/**
 * Get Stripe customer portal URL
 */
export async function createCustomerPortalSession(customerId, env, returnUrl) {
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'customer': customerId,
            'return_url': returnUrl
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error.message}`);
    }

    return await response.json();
}

/**
 * Handle overage charges
 */
export async function handleOverageCharge(userId, overageCount, env) {
    const subscription = await getUserSubscription(userId, env);

    if (!subscription.customerId) {
        throw new Error('No customer ID found for overage billing');
    }

    const amount = overageCount * OVERAGE_PRICE;

    const response = await fetch('https://api.stripe.com/v1/invoiceitems', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'customer': subscription.customerId,
            'amount': amount.toString(),
            'currency': 'usd',
            'description': `Overage charges: ${overageCount} analyses beyond plan limit`
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error.message}`);
    }

    return await response.json();
}

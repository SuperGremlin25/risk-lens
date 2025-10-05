/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscription lifecycle management
 */

import { verifyStripeWebhook, updateUserSubscription } from './stripe-integration.js';

/**
 * Handle incoming Stripe webhooks
 */
export async function handleStripeWebhook(request, env) {
  try {
    // Verify webhook signature
    const event = await verifyStripeWebhook(request, env);
    
    console.log(`📨 Stripe webhook received: ${event.type}`);
    
    // Route to appropriate handler
    switch (event.type) {
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event.data.object, env);
      
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object, env);
      
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object, env);
      
      case 'invoice.payment_succeeded':
        return await handlePaymentSucceeded(event.data.object, env);
      
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event.data.object, env);
      
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event.data.object, env);
      
      case 'customer.subscription.trial_will_end':
        return await handleTrialWillEnd(event.data.object, env);
      
      default:
        console.log(`⚠️ Unhandled webhook type: ${event.type}`);
        return { received: true, handled: false };
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    throw error;
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription, env) {
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return { received: true, error: 'Missing user_id' };
  }
  
  // Determine tier from price ID
  const tier = getTierFromPriceId(subscription.items.data[0].price.id);
  
  const subscriptionData = {
    tier,
    status: subscription.status,
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: new Date().toISOString()
  };
  
  await updateUserSubscription(userId, subscriptionData, env);
  
  console.log(`✅ Subscription created for user ${userId}: ${tier}`);
  
  // TODO: Send welcome email
  
  return { received: true, userId, tier };
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription, env) {
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return { received: true, error: 'Missing user_id' };
  }
  
  const tier = getTierFromPriceId(subscription.items.data[0].price.id);
  
  const subscriptionData = {
    tier,
    status: subscription.status,
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date().toISOString()
  };
  
  await updateUserSubscription(userId, subscriptionData, env);
  
  console.log(`✅ Subscription updated for user ${userId}: ${tier} (${subscription.status})`);
  
  // Handle status changes
  if (subscription.status === 'canceled') {
    // TODO: Send cancellation email
  } else if (subscription.status === 'past_due') {
    // TODO: Send payment reminder email
  }
  
  return { received: true, userId, tier, status: subscription.status };
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(subscription, env) {
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return { received: true, error: 'Missing user_id' };
  }
  
  // Downgrade to free tier
  const subscriptionData = {
    tier: 'free',
    status: 'canceled',
    customerId: subscription.customer,
    subscriptionId: null,
    currentPeriodEnd: null,
    canceledAt: new Date().toISOString()
  };
  
  await updateUserSubscription(userId, subscriptionData, env);
  
  console.log(`✅ Subscription canceled for user ${userId}, downgraded to free`);
  
  // TODO: Send cancellation confirmation email
  
  return { received: true, userId, tier: 'free' };
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice, env) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  console.log(`✅ Payment succeeded for customer ${customerId}`);
  
  // Log payment for analytics
  const paymentKey = `payment:${customerId}:${Date.now()}`;
  await env.RISK_LENS_KV.put(paymentKey, JSON.stringify({
    amount: invoice.amount_paid,
    currency: invoice.currency,
    invoiceId: invoice.id,
    subscriptionId,
    paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
  }), { expirationTtl: 7776000 }); // 90 days
  
  // TODO: Send payment receipt email
  
  return { received: true, customerId, amount: invoice.amount_paid };
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice, env) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  console.error(`❌ Payment failed for customer ${customerId}`);
  
  // Log failed payment
  const failureKey = `payment_failure:${customerId}:${Date.now()}`;
  await env.RISK_LENS_KV.put(failureKey, JSON.stringify({
    amount: invoice.amount_due,
    currency: invoice.currency,
    invoiceId: invoice.id,
    subscriptionId,
    attemptCount: invoice.attempt_count,
    failedAt: new Date().toISOString()
  }), { expirationTtl: 7776000 }); // 90 days
  
  // TODO: Send payment failure notification email
  
  return { received: true, customerId, amount: invoice.amount_due };
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session, env) {
  const userId = session.metadata?.user_id;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  
  console.log(`✅ Checkout completed for user ${userId}`);
  
  // Link customer ID to user if not already linked
  if (userId && customerId) {
    const customerKey = `customer:${userId}`;
    await env.RISK_LENS_KV.put(customerKey, customerId);
  }
  
  // TODO: Send welcome email with getting started guide
  
  return { received: true, userId, customerId, subscriptionId };
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription, env) {
  const userId = subscription.metadata?.user_id;
  const trialEnd = new Date(subscription.trial_end * 1000);
  
  console.log(`⏰ Trial ending soon for user ${userId}: ${trialEnd.toISOString()}`);
  
  // TODO: Send trial ending reminder email
  
  return { received: true, userId, trialEnd: trialEnd.toISOString() };
}

/**
 * Map Stripe Price ID to pricing tier
 */
function getTierFromPriceId(priceId) {
  // This mapping should match your actual Stripe Price IDs
  const priceMap = {
    'price_starter_monthly': 'starter',
    'price_professional_monthly': 'professional',
    'price_business_monthly': 'business',
    // Add your actual Stripe Price IDs here
  };
  
  return priceMap[priceId] || 'free';
}

/**
 * Get usage statistics for analytics
 */
export async function getUsageStats(env, startDate, endDate) {
  // This would require more sophisticated KV querying or using Durable Objects
  // For now, return placeholder
  return {
    totalAnalyses: 0,
    byTier: {
      free: 0,
      starter: 0,
      professional: 0,
      business: 0
    },
    revenue: 0
  };
}

import Stripe from 'stripe';

// Use a dummy key for development if not provided
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-02-24.acacia', // Latest API version for stripe@17.3.0
  typescript: true,
});

export const STRIPE_CONFIG = {
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05'), // 5% default
  CURRENCY: process.env.DEFAULT_CURRENCY || 'USD',
  ESCROW_HOLD_DAYS: parseInt(process.env.ESCROW_HOLD_DAYS || '7'), // 7 days default
};
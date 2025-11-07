import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_CONFIG = {
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05'), // 5% default
  CURRENCY: process.env.DEFAULT_CURRENCY || 'USD',
  ESCROW_HOLD_DAYS: parseInt(process.env.ESCROW_HOLD_DAYS || '7'), // 7 days default
};
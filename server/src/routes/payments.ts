import express from 'express';
import {
  createCheckoutSession,
  createPaymentIntent,
  confirmPayment,
  releasePayment,
  getTransactions,
  getBalance,
  refundPayment,
} from '@/controllers/paymentController';
import {
  createConnectAccount,
  getConnectStatus,
  getEarnings,
  requestPayout,
} from '@/controllers/stripeConnectController';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Stripe Connect (Freelancer onboarding)
router.post('/stripe-connect/onboard', createConnectAccount);
router.get('/stripe-connect/status', getConnectStatus);

// Freelancer earnings
router.get('/earnings', getEarnings);
router.post('/payout/request', requestPayout);

// Payment operations (NEW: Checkout Sessions - RECOMMENDED)
router.post('/checkout-session', createCheckoutSession);

// Payment operations (LEGACY: Payment Intents - still supported)
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);

// Admin operations
router.post('/:transactionId/release', authorize('admin'), releasePayment);
router.post('/:transactionId/refund', authorize('admin'), refundPayment);

// Transaction queries
router.get('/transactions', getTransactions);
router.get('/balance', getBalance);

export default router;

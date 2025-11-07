import { Router } from 'express';
import {
  createPaymentIntent,
  createPaymentIntentValidation,
  confirmPayment,
  getPaymentHistory,
  createEscrowAccount,
  getEscrowAccount,
  addPayoutMethod,
  requestPayout,
  releaseEscrowPayment,
  refundPayment,
} from '@/controllers/paymentController';
import { handleStripeWebhook } from '@/controllers/webhookController';
import { authenticate, authorize } from '@/middleware/auth';
import express from 'express';

const router = Router();

// Webhook endpoint (no authentication required, raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// All other routes require authentication
router.use(authenticate);

// Payment processing
router.post('/intent', createPaymentIntentValidation, createPaymentIntent);
router.post('/confirm/:paymentIntentId', confirmPayment);

// Payment history
router.get('/history', getPaymentHistory);

// Escrow account management
router.post('/escrow/account', createEscrowAccount);
router.get('/escrow/account', getEscrowAccount);
router.post('/escrow/payout-method', addPayoutMethod);

// Payouts (freelancers only)
router.post('/payout', authorize('freelancer'), requestPayout);

// Payment management (admin and clients)
router.post('/:paymentId/release', releaseEscrowPayment);
router.post('/:paymentId/refund', refundPayment);

export default router;
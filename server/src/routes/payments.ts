import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  releasePayment,
  getTransactions,
  getBalance,
  refundPayment,
} from '@/controllers/paymentController';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Payment operations
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/:transactionId/release', authorize('admin'), releasePayment);
router.post('/:transactionId/refund', authorize('admin'), refundPayment);

// Transaction queries
router.get('/transactions', getTransactions);
router.get('/balance', getBalance);

export default router;

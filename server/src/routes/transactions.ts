import express from 'express';
import { transactionController } from '../controllers/transactionController';
import { auth } from '../middleware/auth';
import { roleAuth } from '../middleware/roleAuth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create payment intent (client only)
router.post('/payment-intent', roleAuth(['client']), transactionController.createPaymentIntent);

// Confirm payment
router.post('/confirm', transactionController.confirmPayment);

// Release escrow (client or admin)
router.post('/:transactionId/release', transactionController.releaseEscrow);

// Refund payment (client or admin)
router.post('/:transactionId/refund', transactionController.refundPayment);

// Get transaction history
router.get('/history', transactionController.getTransactionHistory);

// Get transaction by ID
router.get('/:transactionId', transactionController.getTransactionById);

// Calculate fees
router.post('/calculate-fees', transactionController.calculateFees);

export default router;

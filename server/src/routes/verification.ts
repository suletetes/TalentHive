import express from 'express';
import { verificationController } from '../controllers/verificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public route - verify email with token
router.post('/verify-email', verificationController.verifyEmail);

// Protected routes - require authentication
router.post('/send-verification', authenticate, verificationController.sendVerificationEmail);
router.post('/resend-verification', authenticate, verificationController.resendVerificationEmail);
router.get('/status', authenticate, verificationController.checkVerificationStatus);

export default router;

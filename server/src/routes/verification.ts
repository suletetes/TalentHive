import express from 'express';
import { verificationController } from '../controllers/verificationController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public route - verify email with token
router.post('/verify-email', verificationController.verifyEmail);

// Protected routes - require authentication
router.post('/send-verification', auth, verificationController.sendVerificationEmail);
router.post('/resend-verification', auth, verificationController.resendVerificationEmail);
router.get('/status', auth, verificationController.checkVerificationStatus);

export default router;

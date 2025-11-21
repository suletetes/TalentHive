import { Router } from 'express';
import {
  register,
  registerValidation,
  login,
  loginValidation,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  forgotPasswordValidation,
  resetPassword,
  resetPasswordValidation,
  verifyResetToken,
} from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { authRateLimiter, passwordResetRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Registration
router.post('/register', authRateLimiter, registerValidation, register);

// Login
router.post('/login', authRateLimiter, loginValidation, login);

// Logout (requires authentication)
router.post('/logout', authenticate, logout);

// Refresh token
router.post('/refresh-token', refreshToken);

// Email verification
router.get('/verify-email/:token', verifyEmail);

// Forgot password
router.post('/forgot-password', passwordResetRateLimiter, forgotPasswordValidation, forgotPassword);

// Verify reset token
router.get('/verify-reset-token/:token', verifyResetToken);

// Reset password
router.post('/reset-password/:token', passwordResetRateLimiter, resetPasswordValidation, resetPassword);

export default router;
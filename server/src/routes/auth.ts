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
  changePassword,
  changePasswordValidation,
} from '@/controllers/authController';
import { authenticate, authenticateForLogout } from '@/middleware/auth';
import { authRateLimiter, passwordResetRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Registration
router.post('/register', authRateLimiter, (req, res, next) => {
  console.log(' Register endpoint hit');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  next();
}, registerValidation, register);

// Login
router.post('/login', authRateLimiter, loginValidation, login);

// Logout (requires authentication, but allows expired tokens)
router.post('/logout', authenticateForLogout, logout);

// Change password (requires authentication)
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

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
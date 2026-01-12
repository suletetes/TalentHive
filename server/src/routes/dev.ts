import { Router } from 'express';
import { resetRateLimits } from '@/utils/rateLimitReset';

const router = Router();

// Only enable these routes in development
if (process.env.NODE_ENV === 'development') {
  // Reset rate limits
  router.post('/reset-rate-limits', resetRateLimits);
  
  // Check rate limit status
  router.get('/rate-limit-status', (req, res) => {
    res.json({
      status: 'success',
      data: {
        environment: process.env.NODE_ENV,
        rateLimitingDisabled: process.env.DISABLE_RATE_LIMIT_FOR_TESTING === 'true',
        windowMs: process.env.RATE_LIMIT_WINDOW_MS,
        maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
        clientIP: req.ip
      }
    });
  });
}

export default router;
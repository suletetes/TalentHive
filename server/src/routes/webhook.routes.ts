import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '@/services/payment.service';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * Stripe webhook endpoint
 * Note: This endpoint needs raw body, so it should be registered before body parser middleware
 */
router.post(
  '/stripe',
  async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing stripe-signature header',
      });
    }

    try {
      // Verify webhook signature and construct event
      const event = paymentService.verifyWebhookSignature(
        req.body,
        signature
      );

      // Handle the event
      await paymentService.handleWebhook(event);

      // Return success response
      res.json({ received: true });
    } catch (error: any) {
      logger.error('Webhook error:', error);
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

export default router;

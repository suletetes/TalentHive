import { Request, Response } from 'express';
import Stripe from 'stripe';
import { paymentService } from '../services/payment.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Updated to latest API version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const webhookController = {
  // Handle Stripe webhooks
  handleStripeWebhook: async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Webhook handler failed',
        error: error.message,
      });
    }
  },
};

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  try {
    await paymentService.confirmPayment(paymentIntent.id);
    console.log('Payment confirmed and moved to escrow');
  } catch (error) {
    console.error('Error confirming payment:', error);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  try {
    const reason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await paymentService.handlePaymentFailure(paymentIntent.id, reason);
    console.log('Payment failure recorded');
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle refunded charge
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);
  // Additional refund handling if needed
}

// Handle canceled payment intent
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent canceled:', paymentIntent.id);
  
  try {
    await paymentService.handlePaymentFailure(paymentIntent.id, 'Payment canceled');
    console.log('Payment cancellation recorded');
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

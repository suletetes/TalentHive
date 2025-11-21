import Stripe from 'stripe';
import { logger } from '@/utils/logger';

// Initialize Stripe
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  logger.info('Stripe initialized successfully');
} else {
  logger.warn('Stripe secret key not configured. Payment functionality will be disabled.');
}

interface PaymentIntentData {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

interface TransferData {
  amount: number;
  currency?: string;
  destination: string;
  metadata?: Record<string, string>;
}

class PaymentService {
  private stripe: Stripe | null;

  constructor() {
    this.stripe = stripe;
  }

  /**
   * Check if Stripe is configured
   */
  private ensureConfigured(): void {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<string> {
    this.ensureConfigured();

    try {
      const customer = await this.stripe!.customers.create({
        email,
        name,
        metadata,
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer.id;
    } catch (error: any) {
      logger.error('Stripe create customer error:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    this.ensureConfigured();

    try {
      await this.stripe!.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe!.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info(`Payment method ${paymentMethodId} added to customer ${customerId}`);
    } catch (error: any) {
      logger.error('Stripe add payment method error:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    this.ensureConfigured();

    try {
      const paymentMethods = await this.stripe!.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error: any) {
      logger.error('Stripe get payment methods error:', error);
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    this.ensureConfigured();

    try {
      await this.stripe!.paymentMethods.detach(paymentMethodId);
      logger.info(`Payment method ${paymentMethodId} deleted`);
    } catch (error: any) {
      logger.error('Stripe delete payment method error:', error);
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  /**
   * Create payment intent for escrow
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<{ clientSecret: string; paymentIntentId: string }> {
    this.ensureConfigured();

    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency || 'usd',
        customer: data.customerId,
        metadata: data.metadata || {},
        capture_method: 'manual', // Hold funds in escrow
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      logger.error('Stripe create payment intent error:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Capture payment (release from escrow)
   */
  async capturePayment(paymentIntentId: string): Promise<void> {
    this.ensureConfigured();

    try {
      await this.stripe!.paymentIntents.capture(paymentIntentId);
      logger.info(`Payment captured: ${paymentIntentId}`);
    } catch (error: any) {
      logger.error('Stripe capture payment error:', error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPayment(paymentIntentId: string): Promise<void> {
    this.ensureConfigured();

    try {
      await this.stripe!.paymentIntents.cancel(paymentIntentId);
      logger.info(`Payment cancelled: ${paymentIntentId}`);
    } catch (error: any) {
      logger.error('Stripe cancel payment error:', error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  /**
   * Create connected account for freelancer
   */
  async createConnectedAccount(email: string, metadata?: Record<string, string>): Promise<string> {
    this.ensureConfigured();

    try {
      const account = await this.stripe!.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata,
      });

      logger.info(`Connected account created: ${account.id}`);
      return account.id;
    } catch (error: any) {
      logger.error('Stripe create connected account error:', error);
      throw new Error(`Failed to create connected account: ${error.message}`);
    }
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
    this.ensureConfigured();

    try {
      const accountLink = await this.stripe!.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error: any) {
      logger.error('Stripe create account link error:', error);
      throw new Error(`Failed to create account link: ${error.message}`);
    }
  }

  /**
   * Transfer funds to freelancer
   */
  async transferToFreelancer(data: TransferData): Promise<string> {
    this.ensureConfigured();

    try {
      const transfer = await this.stripe!.transfers.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency || 'usd',
        destination: data.destination,
        metadata: data.metadata || {},
      });

      logger.info(`Transfer created: ${transfer.id}`);
      return transfer.id;
    } catch (error: any) {
      logger.error('Stripe transfer error:', error);
      throw new Error(`Failed to transfer funds: ${error.message}`);
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<string> {
    this.ensureConfigured();

    try {
      const refund = await this.stripe!.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      logger.info(`Refund created: ${refund.id}`);
      return refund.id;
    } catch (error: any) {
      logger.error('Stripe refund error:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    this.ensureConfigured();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      return this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error: any) {
      logger.error('Stripe webhook verification error:', error);
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error: any) {
      logger.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info(`Payment intent succeeded: ${paymentIntent.id}`);
    // Additional logic will be added when integrating with contract/payment models
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.error(`Payment intent failed: ${paymentIntent.id}`);
    // Additional logic will be added when integrating with contract/payment models
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    logger.info(`Charge refunded: ${charge.id}`);
    // Additional logic will be added when integrating with payment models
  }

  /**
   * Handle account updated
   */
  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    logger.info(`Account updated: ${account.id}`);
    // Additional logic will be added when integrating with user models
  }

  /**
   * Create setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<string> {
    this.ensureConfigured();

    try {
      const setupIntent = await this.stripe!.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return setupIntent.client_secret!;
    } catch (error: any) {
      logger.error('Stripe create setup intent error:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }
}

export const paymentService = new PaymentService();

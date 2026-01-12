import Stripe from 'stripe';
import { Transaction } from '../models/Transaction';
import { PlatformSettings } from '../models/PlatformSettings';
import { Contract } from '../models/Contract';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Updated to latest API version
});

export class PaymentService {
  /**
   * Calculate commission and fees for a payment
   * @param amountInCents - Amount in cents (smallest currency unit)
   * @returns Fee breakdown in cents
   */
  async calculateFees(amountInCents: number) {
    const settings = await PlatformSettings.findOne({ isActive: true });
    
    if (!settings) {
      throw new Error('Platform settings not found');
    }

    // Get commission settings from Settings model
    const { Settings } = await import('../models/Settings');
    const commissionConfig = await Settings.findOne();
    
    // Convert amount from cents to dollars for commission tier matching
    const amountInDollars = amountInCents / 100;
    
    // Find applicable commission tier based on amount
    let commissionPercentage = settings.commissionRate || 10; // Default fallback
    
    if (commissionConfig && commissionConfig.commissionSettings && commissionConfig.commissionSettings.length > 0) {
      // Find the most specific tier that applies (with highest minAmount that's still below the transaction)
      const applicableTiers = commissionConfig.commissionSettings
        .filter((tier: any) => {
          if (!tier.isActive) return false;
          
          const meetsMin = !tier.minAmount || amountInDollars >= tier.minAmount;
          const meetsMax = !tier.maxAmount || amountInDollars <= tier.maxAmount;
          
          return meetsMin && meetsMax;
        })
        .sort((a: any, b: any) => {
          // Sort by minAmount descending (highest minAmount first)
          const aMin = a.minAmount || 0;
          const bMin = b.minAmount || 0;
          return bMin - aMin;
        });
      
      if (applicableTiers.length > 0) {
        commissionPercentage = applicableTiers[0].commissionPercentage;
      }
    }

    // Calculate commission as percentage (all in cents)
    let commission = Math.round((amountInCents * commissionPercentage) / 100);
    
    // Ensure commission doesn't exceed 50% of amount
    const maxAllowedCommission = Math.floor(amountInCents * 0.5);
    commission = Math.min(commission, maxAllowedCommission);

    // Calculate processing fee (cap at reasonable percentage)
    const processingFeeRate = settings.paymentProcessingFee || 2.9;
    let processingFee = Math.round((amountInCents * processingFeeRate) / 100);
    processingFee = Math.min(processingFee, Math.floor(amountInCents * 0.1)); // Cap at 10%

    // Calculate tax
    const taxRate = settings.taxRate || 0;
    let tax = Math.round((amountInCents * taxRate) / 100);
    tax = Math.min(tax, Math.floor(amountInCents * 0.2)); // Cap at 20%

    // Calculate freelancer amount - ensure it's at least 20% of original amount
    let freelancerAmount = amountInCents - commission - processingFee - tax;
    const minFreelancerAmount = Math.floor(amountInCents * 0.2);
    
    if (freelancerAmount < minFreelancerAmount) {
      // Reduce fees proportionally to ensure minimum freelancer amount
      const totalFees = commission + processingFee + tax;
      const maxFees = amountInCents - minFreelancerAmount;
      const ratio = maxFees / totalFees;
      commission = Math.floor(commission * ratio);
      processingFee = Math.floor(processingFee * ratio);
      tax = Math.floor(tax * ratio);
      freelancerAmount = amountInCents - commission - processingFee - tax;
    }

    return {
      amount: amountInCents,
      commission,
      processingFee,
      tax,
      freelancerAmount,
      currency: settings.currency || 'USD',
    };
  }

  /**
   * Create a Stripe Checkout Session (RECOMMENDED METHOD)
   * @param amountInCents - Amount in cents (smallest currency unit)
   */
  async createCheckoutSession(
    contractId: string,
    amountInCents: number,
    clientId: string,
    freelancerId: string,
    milestoneId?: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    try {
      // Validate minimum amount ($0.50 = 50 cents)
      if (amountInCents < 50) {
        throw new Error('Amount must be at least $0.50');
      }

      // Calculate fees (already in cents)
      const fees = await this.calculateFees(amountInCents);

      // Get contract details for description
      const contract = await Contract.findById(contractId);
      const milestoneName = milestoneId && contract 
        ? (contract.milestones as any).id(milestoneId)?.title 
        : 'Contract Payment';

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: fees.currency.toLowerCase(),
              product_data: {
                name: milestoneName || 'Milestone Payment',
                description: `Payment for contract ${contractId}`,
              },
              unit_amount: fees.amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          contractId,
          clientId,
          freelancerId,
          milestoneId: milestoneId || '',
          platformCommission: fees.commission.toString(),
          processingFee: fees.processingFee.toString(),
          tax: fees.tax.toString(),
          freelancerAmount: fees.freelancerAmount.toString(),
        },
        success_url: successUrl || `${process.env.CLIENT_URL}/dashboard/contracts/${contractId}?payment=success`,
        cancel_url: cancelUrl || `${process.env.CLIENT_URL}/dashboard/contracts/${contractId}?payment=cancelled`,
        client_reference_id: clientId,
      });

      // Create transaction record (all amounts in cents)
      const transaction = await Transaction.create({
        contract: contractId,
        milestone: milestoneId,
        client: clientId,
        freelancer: freelancerId,
        amount: fees.amount,
        platformCommission: fees.commission,
        processingFee: fees.processingFee,
        tax: fees.tax,
        freelancerAmount: fees.freelancerAmount,
        currency: fees.currency,
        status: 'pending',
        paymentMethod: 'stripe',
        stripePaymentIntentId: session.payment_intent as string,
        description: `Payment for contract ${contractId}`,
        metadata: {
          checkoutSessionId: session.id,
        },
      });

      return {
        transaction,
        session,
        checkoutUrl: session.url,
      };
    } catch (error: any) {
      console.error('Create checkout session error:', error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Create a Stripe payment intent (LEGACY - Use createCheckoutSession instead)
   * @param amountInCents - Amount in cents (smallest currency unit)
   */
  async createPaymentIntent(
    contractId: string,
    amountInCents: number,
    clientId: string,
    freelancerId: string,
    milestoneId?: string,
    idempotencyKey?: string
  ) {
    try {
      // Validate minimum amount ($0.50 = 50 cents)
      if (amountInCents < 50) {
        throw new Error('Amount must be at least $0.50');
      }

      // Calculate fees (already in cents)
      const fees = await this.calculateFees(amountInCents);

      // Create payment intent with idempotency key
      const paymentIntent = await stripe.paymentIntents.create({
        amount: fees.amount,
        currency: fees.currency.toLowerCase(),
        metadata: {
          contractId,
          clientId,
          freelancerId,
          milestoneId: milestoneId || '',
          platformCommission: fees.commission.toString(),
          processingFee: fees.processingFee.toString(),
          tax: fees.tax.toString(),
          freelancerAmount: fees.freelancerAmount.toString(),
        },
        description: `Payment for contract ${contractId}`,
        automatic_payment_methods: {
          enabled: true,
        },
      }, idempotencyKey ? { idempotencyKey } : undefined);

      // Create transaction record (all amounts in cents)
      const transaction = await Transaction.create({
        contract: contractId,
        milestone: milestoneId,
        client: clientId,
        freelancer: freelancerId,
        amount: fees.amount,
        platformCommission: fees.commission,
        processingFee: fees.processingFee,
        tax: fees.tax,
        freelancerAmount: fees.freelancerAmount,
        currency: fees.currency,
        status: 'pending',
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        description: `Payment for contract ${contractId}`,
      });

      return {
        transaction,
        paymentIntent,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm payment and move to escrow
   */
  async confirmPayment(paymentIntentId: string) {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment has not succeeded');
      }

      // Find transaction
      const transaction = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get platform settings for escrow hold days
      const settings = await PlatformSettings.findOne({ isActive: true });
      const escrowHoldDays = settings?.escrowHoldDays || 7;

      // Calculate escrow release date
      const escrowReleaseDate = new Date();
      escrowReleaseDate.setDate(escrowReleaseDate.getDate() + escrowHoldDays);

      // Update transaction
      transaction.status = 'held_in_escrow';
      transaction.stripeChargeId = paymentIntent.latest_charge as string;
      transaction.escrowReleaseDate = escrowReleaseDate;
      await transaction.save();

      // Update milestone status to 'paid'
      if (transaction.milestone) {
        const contract = await Contract.findById(transaction.contract);
        if (contract) {
          const milestone = (contract.milestones as any).id(transaction.milestone);
          if (milestone) {
            milestone.status = 'paid';
            milestone.paidAt = new Date();
            await contract.save();
            console.log('[PAYMENT] Milestone updated to paid:', milestone._id);
          }
        }
      }

      return transaction;
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Release payment from escrow to freelancer
   */
  async releaseEscrow(transactionId: string) {
    try {
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'held_in_escrow') {
        throw new Error('Transaction is not in escrow');
      }

      // In a real implementation, you would transfer funds to freelancer's Stripe Connect account
      // For now, we'll just update the status

      transaction.status = 'released';
      transaction.releasedAt = new Date();
      await transaction.save();

      // Update contract status if all milestones are paid
      await this.updateContractPaymentStatus(transaction.contract.toString());

      return transaction;
    } catch (error: any) {
      console.error('Release escrow error:', error);
      throw new Error(`Failed to release escrow: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, reason?: string) {
    try {
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (!transaction.stripeChargeId) {
        throw new Error('No charge ID found for refund');
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        charge: transaction.stripeChargeId,
        reason: 'requested_by_customer',
      });

      // Update transaction
      transaction.status = 'refunded';
      transaction.stripeRefundId = refund.id;
      transaction.refundedAt = new Date();
      transaction.failureReason = reason;
      await transaction.save();

      return transaction;
    } catch (error: any) {
      console.error('Refund payment error:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(paymentIntentId: string, reason: string) {
    try {
      const transaction = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.status = 'failed';
      transaction.failureReason = reason;
      await transaction.save();

      return transaction;
    } catch (error: any) {
      console.error('Handle payment failure error:', error);
      throw new Error(`Failed to handle payment failure: ${error.message}`);
    }
  }

  /**
   * Update contract payment status based on transactions
   */
  private async updateContractPaymentStatus(contractId: string) {
    try {
      const contract = await Contract.findById(contractId);
      
      if (!contract) {
        return;
      }

      // Check if all milestones are paid
      const transactions = await Transaction.find({
        contract: contractId,
        status: 'released',
      });

      // This is a simplified check - in reality, you'd compare with actual milestones
      if (transactions.length > 0) {
        // Update contract status if all milestones are paid
        contract.status = 'completed';
        await contract.save();
      }
    } catch (error) {
      console.error('Update contract payment status error:', error);
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    role: 'client' | 'freelancer',
    page = 1,
    limit = 20
  ) {
    try {
      console.log(`[TRANSACTION HISTORY] Fetching for user: ${userId}, role: ${role}, page: ${page}, limit: ${limit}`);
      
      const skip = (page - 1) * limit;
      const query = role === 'client' ? { client: userId } : { freelancer: userId };

      console.log(`[TRANSACTION HISTORY] Query:`, query);

      const transactions = await Transaction.find(query)
        .populate('contract', 'title')
        .populate('client', 'profile.firstName profile.lastName email')
        .populate('freelancer', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      console.log(`[TRANSACTION HISTORY] Found ${transactions.length} transactions`);

      const total = await Transaction.countDocuments(query);

      console.log(`[TRANSACTION HISTORY] Total count: ${total}`);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('[TRANSACTION HISTORY ERROR]', {
        userId,
        role,
        page,
        limit,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: any) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          // Handle successful checkout session
          const session = event.data.object;
          if (session.payment_intent) {
            await this.confirmPayment(session.payment_intent);
          }
          break;

        case 'payment_intent.succeeded':
          await this.confirmPayment(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(
            event.data.object.id,
            event.data.object.last_payment_error?.message || 'Payment failed'
          );
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentFailure(event.data.object.id, 'Payment canceled');
          break;

        case 'checkout.session.expired':
          // Handle expired checkout session
          const expiredSession = event.data.object;
          if (expiredSession.payment_intent) {
            await this.handlePaymentFailure(expiredSession.payment_intent, 'Checkout session expired');
          }
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();

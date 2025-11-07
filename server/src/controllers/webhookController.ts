import { Request, Response, NextFunction } from 'express';
import { stripe, STRIPE_CONFIG } from '@/config/stripe';
import { Payment, EscrowAccount, Transaction, PaymentWebhook } from '@/models/Payment';
import { Contract } from '@/models/Contract';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export const handleStripeWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return next(new AppError('Missing Stripe signature', 400));
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_CONFIG.WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return next(new AppError('Webhook signature verification failed', 400));
  }

  // Check if we've already processed this event
  const existingWebhook = await PaymentWebhook.findOne({ stripeEventId: event.id });
  if (existingWebhook && existingWebhook.processed) {
    return res.status(200).json({ received: true, message: 'Event already processed' });
  }

  // Create webhook record
  const webhookRecord = new PaymentWebhook({
    stripeEventId: event.id,
    eventType: event.type,
    data: event.data,
    processed: false,
  });

  try {
    await webhookRecord.save();

    // Process the event
    await processWebhookEvent(event);

    // Mark as processed
    webhookRecord.processed = true;
    await webhookRecord.save();

    logger.info(`Successfully processed webhook event: ${event.type}`);
  } catch (error: any) {
    logger.error(`Error processing webhook event ${event.type}:`, error);
    
    // Save error for debugging
    webhookRecord.processingError = error.message;
    await webhookRecord.save();

    // Don't throw error to avoid webhook retries for application errors
    return res.status(200).json({ 
      received: true, 
      error: 'Processing error logged',
      eventId: event.id 
    });
  }

  res.status(200).json({ received: true });
});

async function processWebhookEvent(event: any) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;

    case 'transfer.created':
      await handleTransferCreated(event.data.object);
      break;

    case 'transfer.paid':
      await handleTransferPaid(event.data.object);
      break;

    case 'transfer.failed':
      await handleTransferFailed(event.data.object);
      break;

    case 'account.updated':
      await handleAccountUpdated(event.data.object);
      break;

    case 'payout.paid':
      await handlePayoutPaid(event.data.object);
      break;

    case 'payout.failed':
      await handlePayoutFailed(event.data.object);
      break;

    default:
      logger.info(`Unhandled webhook event type: ${event.type}`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  }).populate('contract');

  if (!payment) {
    logger.warn(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  payment.status = 'completed';
  await payment.save();

  // Create transaction record
  await Transaction.create({
    payment: payment._id,
    type: 'charge',
    amount: payment.amount,
    currency: payment.currency,
    status: 'succeeded',
    stripeTransactionId: paymentIntent.id,
    description: `Milestone payment completed`,
    metadata: {
      paymentIntentId: paymentIntent.id,
      chargeId: paymentIntent.latest_charge,
    },
  });

  // Update contract milestone status
  const contract = payment.contract as any;
  if (contract) {
    const milestone = contract.milestones.id(payment.milestone);
    if (milestone) {
      milestone.status = 'paid';
      milestone.paidAt = new Date();
      await contract.save();
    }
  }

  logger.info(`Payment completed: ${payment._id}`);
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });

  if (!payment) {
    logger.warn(`Payment not found for failed PaymentIntent: ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  payment.status = 'failed';
  await payment.save();

  // Create transaction record
  await Transaction.create({
    payment: payment._id,
    type: 'charge',
    amount: payment.amount,
    currency: payment.currency,
    status: 'failed',
    stripeTransactionId: paymentIntent.id,
    description: `Milestone payment failed`,
    metadata: {
      paymentIntentId: paymentIntent.id,
      failureCode: paymentIntent.last_payment_error?.code,
      failureMessage: paymentIntent.last_payment_error?.message,
    },
  });

  logger.info(`Payment failed: ${payment._id}`);
}

async function handleTransferCreated(transfer: any) {
  const payment = await Payment.findOne({ 
    stripeTransferId: transfer.id 
  });

  if (!payment) {
    logger.warn(`Payment not found for Transfer: ${transfer.id}`);
    return;
  }

  // Create transaction record
  await Transaction.create({
    payment: payment._id,
    type: 'transfer',
    amount: transfer.amount / 100, // Convert from cents
    currency: transfer.currency.toUpperCase(),
    status: 'pending',
    stripeTransactionId: transfer.id,
    description: `Transfer created for payout`,
    metadata: {
      transferId: transfer.id,
      destination: transfer.destination,
    },
  });

  logger.info(`Transfer created: ${transfer.id}`);
}

async function handleTransferPaid(transfer: any) {
  const payment = await Payment.findOne({ 
    stripeTransferId: transfer.id 
  });

  if (!payment) {
    logger.warn(`Payment not found for paid Transfer: ${transfer.id}`);
    return;
  }

  // Update payment status
  payment.status = 'completed';
  await payment.save();

  // Update transaction status
  await Transaction.updateOne(
    { stripeTransactionId: transfer.id },
    { status: 'succeeded' }
  );

  logger.info(`Transfer completed: ${transfer.id}`);
}

async function handleTransferFailed(transfer: any) {
  const payment = await Payment.findOne({ 
    stripeTransferId: transfer.id 
  });

  if (!payment) {
    logger.warn(`Payment not found for failed Transfer: ${transfer.id}`);
    return;
  }

  // Update payment status
  payment.status = 'failed';
  await payment.save();

  // Update transaction status
  await Transaction.updateOne(
    { stripeTransactionId: transfer.id },
    { 
      status: 'failed',
      metadata: {
        failureCode: transfer.failure_code,
        failureMessage: transfer.failure_message,
      }
    }
  );

  // Refund the escrow balance if this was a withdrawal
  if (payment.type === 'withdrawal') {
    const escrowAccount = await EscrowAccount.findOne({ user: payment.freelancer });
    if (escrowAccount) {
      escrowAccount.balance += payment.amount;
      await escrowAccount.save();
    }
  }

  logger.info(`Transfer failed: ${transfer.id}`);
}

async function handleAccountUpdated(account: any) {
  const escrowAccount = await EscrowAccount.findOne({ 
    stripeAccountId: account.id 
  });

  if (!escrowAccount) {
    logger.warn(`Escrow account not found for Stripe account: ${account.id}`);
    return;
  }

  // Update account status based on Stripe account capabilities
  if (account.charges_enabled && account.payouts_enabled) {
    escrowAccount.status = 'active';
    escrowAccount.verificationStatus = 'verified';
  } else if (account.details_submitted) {
    escrowAccount.status = 'pending';
    escrowAccount.verificationStatus = 'pending';
  } else {
    escrowAccount.verificationStatus = 'unverified';
  }

  await escrowAccount.save();

  logger.info(`Account updated: ${account.id}, status: ${escrowAccount.status}`);
}

async function handlePayoutPaid(payout: any) {
  // Find payments related to this payout
  const transactions = await Transaction.find({
    stripeTransactionId: { $regex: payout.id },
    type: 'payout',
  }).populate('payment');

  for (const transaction of transactions) {
    transaction.status = 'succeeded';
    await transaction.save();
  }

  logger.info(`Payout completed: ${payout.id}`);
}

async function handlePayoutFailed(payout: any) {
  // Find payments related to this payout
  const transactions = await Transaction.find({
    stripeTransactionId: { $regex: payout.id },
    type: 'payout',
  }).populate('payment');

  for (const transaction of transactions) {
    transaction.status = 'failed';
    transaction.metadata = {
      ...transaction.metadata,
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
    };
    await transaction.save();

    // Refund escrow balance for failed payouts
    const payment = transaction.payment as any;
    if (payment && payment.type === 'withdrawal') {
      const escrowAccount = await EscrowAccount.findOne({ user: payment.freelancer });
      if (escrowAccount) {
        escrowAccount.balance += payment.amount;
        await escrowAccount.save();
      }
    }
  }

  logger.info(`Payout failed: ${payout.id}`);
}
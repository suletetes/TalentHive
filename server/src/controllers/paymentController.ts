import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Transaction } from '@/models/Transaction';
import { Contract } from '@/models/Contract';
import { PlatformSettings } from '@/models/PlatformSettings';
import { notificationService } from '@/services/notification.service';
import { sendEmail } from '@/utils/email.resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Updated to latest API version
});

// Create checkout session (RECOMMENDED)
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { contractId, milestoneId } = req.body;
    const userId = req.user?._id;

    // Find contract and validate
    const contract = await Contract.findById(contractId)
      .populate('client', 'email profile stripeCustomerId')
      .populate('freelancer', 'email profile stripeConnectedAccountId');

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found',
      });
    }

    // Verify user is the client
    const clientId = typeof contract.client === 'object' 
      ? ((contract.client as any)._id?.toString() || (contract.client as any).toString())
      : (contract.client as any).toString();
    if (clientId !== userId?.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the client can make payments',
      });
    }

    // Find milestone
    const milestone = (contract.milestones as any).id(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        status: 'error',
        message: 'Milestone not found',
      });
    }

    // Check milestone status
    if (milestone.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Milestone must be approved before payment',
      });
    }

    // Check if already paid
    const existingTransaction = await Transaction.findOne({
      contract: contractId,
      milestone: milestoneId,
      status: { $in: ['held_in_escrow', 'released', 'paid_out', 'processing'] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment already processed for this milestone',
      });
    }

    const freelancerId = typeof contract.freelancer === 'object'
      ? ((contract.freelancer as any)._id?.toString() || (contract.freelancer as any).toString())
      : (contract.freelancer as any).toString();

    // Convert milestone amount (dollars) to cents
    const amountInCents = Math.round(milestone.amount * 100);

    // Generate idempotency key
    const idempotencyKey = `checkout_${contractId}_${milestoneId}_${Date.now()}`;

    // Use payment service to create checkout session
    const { paymentService } = await import('@/services/payment.service');
    const result = await paymentService.createCheckoutSession(
      contractId.toString(),
      amountInCents,
      clientId.toString(),
      freelancerId,
      milestoneId.toString()
    );

    res.status(200).json({
      status: 'success',
      data: {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.session.id,
        transaction: result.transaction,
        breakdown: {
          amount: result.transaction.amount / 100, // Convert back to dollars for display
          commission: result.transaction.platformCommission / 100,
          freelancerAmount: result.transaction.freelancerAmount / 100,
        },
      },
    });
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
};

// Create payment intent (LEGACY - kept for backward compatibility)
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { contractId, milestoneId } = req.body;
    const userId = req.user?._id;

    // Find contract and validate
    const contract = await Contract.findById(contractId)
      .populate('client', 'email profile stripeCustomerId')
      .populate('freelancer', 'email profile stripeConnectedAccountId');

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found',
      });
    }

    // Verify user is the client
    const clientId = typeof contract.client === 'object' 
      ? ((contract.client as any)._id?.toString() || (contract.client as any).toString())
      : (contract.client as any).toString();
    if (clientId !== userId?.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the client can make payments',
      });
    }

    // Find milestone
    const milestone = (contract.milestones as any).id(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        status: 'error',
        message: 'Milestone not found',
      });
    }

    // Check milestone status
    if (milestone.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Milestone must be approved before payment',
      });
    }

    // Check if already paid
    const existingTransaction = await Transaction.findOne({
      contract: contractId,
      milestone: milestoneId,
      status: { $in: ['held_in_escrow', 'released', 'paid_out', 'processing'] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment already processed for this milestone',
      });
    }

    const freelancerId = typeof contract.freelancer === 'object'
      ? ((contract.freelancer as any)._id?.toString() || (contract.freelancer as any).toString())
      : (contract.freelancer as any).toString();

    // Convert milestone amount (dollars) to cents
    const amountInCents = Math.round(milestone.amount * 100);

    // Generate idempotency key
    const idempotencyKey = `payment_${contractId}_${milestoneId}_${Date.now()}`;

    // Use payment service
    const { paymentService } = await import('@/services/payment.service');
    const result = await paymentService.createPaymentIntent(
      contractId.toString(),
      amountInCents,
      clientId.toString(),
      freelancerId,
      milestoneId.toString(),
      idempotencyKey
    );

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntent.id,
        transaction: result.transaction,
        breakdown: {
          amount: result.transaction.amount / 100, // Convert back to dollars for display
          commission: result.transaction.platformCommission / 100,
          freelancerAmount: result.transaction.freelancerAmount / 100,
        },
      },
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent',
      error: error.message,
    });
  }
};

// Confirm payment
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not successful',
      });
    }

    // Update transaction
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    transaction.status = 'held_in_escrow';
    await transaction.save();

    // Update milestone status
    const contract = await Contract.findById(transaction.contract)
      .populate('client', 'email profile')
      .populate('freelancer', 'email profile');

    if (contract) {
      const milestone = (contract.milestones as any).id(transaction.milestone);
      if (milestone) {
        milestone.status = 'paid';
        milestone.paidAt = new Date();
        await contract.save();
      }

      // Create notifications
      try {
        const freelancerObj = contract.freelancer as any;
        const freelancerId = typeof freelancerObj === 'object' && freelancerObj._id
          ? freelancerObj._id.toString()
          : freelancerObj.toString();
        await notificationService.notifyPaymentReceived(
          freelancerId,
          transaction.amount,
          contract._id.toString()
        );
      } catch (error) {
        console.error('Failed to send payment notification:', error);
      }
      
      // Old code - commented out
      /*
      await createNotification({
        user: contract.freelancer._id.toString(),
        type: 'payment',
        title: 'Payment Received',
        message: `Payment of $${transaction.amount} has been received for milestone: ${milestone?.title}`,
        link: `/dashboard/contracts/${contract._id}`,
        priority: 'high',
        metadata: {
          contractId: contract._id,
          amount: transaction.amount,
        },
      });
      */

      // Send emails
      await sendEmail({
        to: (contract.freelancer as any).email,
        subject: 'Payment Received',
        html: `
          <h2>Payment Received</h2>
          <p>Hi ${(contract.freelancer as any).profile.firstName},</p>
          <p>Great news! Payment of $${transaction.amount} has been received for the milestone "${milestone?.title}".</p>
          <p>The funds will be released to your account after the escrow period.</p>
          <p>View contract: <a href="${process.env.CLIENT_URL}/dashboard/contracts/${contract._id}">Click here</a></p>
        `,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment confirmed successfully',
      data: transaction,
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm payment',
      error: error.message,
    });
  }
};

// Release payment to freelancer
export const releasePayment = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    console.log('  [RELEASE_PAYMENT] Starting payment release for transaction:', transactionId);
    console.log('  [RELEASE_PAYMENT] Request user:', req.user?.email, 'Role:', req.user?.role);
    console.log('  [RELEASE_PAYMENT] Request body:', req.body);

    const transaction = await Transaction.findById(transactionId)
      .populate('contract')
      .populate('freelancer', 'email profile stripeConnectedAccountId');

    if (!transaction) {
      console.log('  [RELEASE_PAYMENT] Transaction not found:', transactionId);
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    console.log('  [RELEASE_PAYMENT] Transaction found:', {
      id: transaction._id,
      status: transaction.status,
      amount: transaction.amount,
      freelancerAmount: transaction.freelancerAmount,
      currency: transaction.currency,
    });

    if (transaction.status !== 'held_in_escrow') {
      console.log('  [RELEASE_PAYMENT] Invalid status:', transaction.status, '(expected: held_in_escrow)');
      return res.status(400).json({
        status: 'error',
        message: 'Transaction is not in escrow status',
      });
    }

    console.log('  [RELEASE_PAYMENT] Transaction status valid, proceeding with release');

    // Transfer to freelancer's Stripe account
    const freelancerObj = transaction.freelancer as any;
    console.log(' [RELEASE_PAYMENT] Freelancer info:', {
      id: freelancerObj._id,
      email: freelancerObj.email,
      hasStripeAccount: !!freelancerObj.stripeConnectedAccountId,
      stripeAccountId: freelancerObj.stripeConnectedAccountId,
    });

    if (freelancerObj.stripeConnectedAccountId) {
      console.log(' [RELEASE_PAYMENT] Creating Stripe transfer:', {
        amount: transaction.freelancerAmount, // Already in cents
        amountDollars: transaction.freelancerAmount / 100,
        currency: (transaction.currency || 'USD').toLowerCase(),
        destination: freelancerObj.stripeConnectedAccountId,
      });

      try {
        const transfer = await stripe.transfers.create({
          amount: transaction.freelancerAmount, // Already in cents
          currency: (transaction.currency || 'USD').toLowerCase(),
          destination: freelancerObj.stripeConnectedAccountId,
          metadata: {
            transactionId: transaction._id.toString(),
            contractId: transaction.contract.toString(),
          },
        });
        console.log('  [RELEASE_PAYMENT] Stripe transfer successful:', transfer.id);
      } catch (stripeError: any) {
        console.error('  [RELEASE_PAYMENT] Stripe transfer failed:', stripeError.message);
        throw stripeError;
      }
    } else {
      console.log('  [RELEASE_PAYMENT] No Stripe account connected, skipping transfer');
    }

    console.log(' [RELEASE_PAYMENT] Updating transaction status to released');
    transaction.status = 'released';
    transaction.releasedAt = new Date();
    await transaction.save();
    console.log('  [RELEASE_PAYMENT] Transaction updated successfully');

    // Create notification
    try {
      const freelancerObj = transaction.freelancer as any;
      const freelancerId = typeof freelancerObj._id === 'object' ? freelancerObj._id.toString() : freelancerObj._id;
      await notificationService.notifyEscrowReleased(
        freelancerId,
        transaction.freelancerAmount,
        transaction.contract.toString()
      );
    } catch (error) {
      console.error('Failed to send escrow release notification:', error);
    }
    
    // Old code - commented out
    /*
    await createNotification({
      user: transaction.freelancer._id.toString(),
      type: 'payment',
      title: 'Payment Released',
      message: `Payment of $${transaction.freelancerAmount} has been released to your account`,
      link: `/dashboard/transactions`,
      priority: 'high',
      metadata: {
        amount: transaction.freelancerAmount,
      },
    });
    */

    // Send email
    await sendEmail({
      to: (transaction.freelancer as any).email,
      subject: 'Payment Released',
      html: `
        <h2>Payment Released</h2>
        <p>Hi ${(transaction.freelancer as any).profile.firstName},</p>
        <p>Your payment of $${transaction.freelancerAmount} has been released and transferred to your account.</p>
        <p>View transactions: <a href="${process.env.CLIENT_URL}/dashboard/transactions">Click here</a></p>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment released successfully',
      data: transaction,
    });
  } catch (error: any) {
    console.error('Payment release error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to release payment',
      error: error.message,
    });
  }
};

// Get transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {
      $or: [{ client: userId }, { freelancer: userId }],
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contract', 'title')
      .populate('client', 'profile.firstName profile.lastName')
      .populate('freelancer', 'profile.firstName profile.lastName');

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
};

// Get user balance
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const completed = await Transaction.aggregate([
      {
        $match: {
          freelancer: userId,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$freelancerAmount' },
        },
      },
    ]);

    const pending = await Transaction.aggregate([
      {
        $match: {
          freelancer: userId,
          status: 'processing',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$freelancerAmount' },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        available: completed[0]?.total || 0,
        pending: pending[0]?.total || 0,
        total: (completed[0]?.total || 0) + (pending[0]?.total || 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch balance',
      error: error.message,
    });
  }
};

// Refund payment
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(transactionId)
      .populate('client', 'email profile')
      .populate('freelancer', 'email profile');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    if (transaction.status === 'refunded') {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction already refunded',
      });
    }

    // Create refund in Stripe
    await stripe.refunds.create({
      payment_intent: transaction.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.failureReason = reason || 'Refund requested';
    await transaction.save();

    // Create notifications
    try {
      const clientObj = transaction.client as any;
      const clientId = typeof clientObj._id === 'object' ? clientObj._id.toString() : clientObj._id;
      await notificationService.notifySystem(
        clientId,
        'Payment Refunded',
        `Payment of ${transaction.amount} has been refunded`,
        '/dashboard/transactions',
        'normal'
      );
    } catch (error) {
      console.error('Failed to send refund notification:', error);
    }
    
    // Old code - commented out
    /*
    await createNotification({
      user: transaction.client.toString(),
      type: 'payment',
      title: 'Payment Refunded',
      message: `Payment of $${transaction.amount} has been refunded`,
      link: `/dashboard/transactions`,
      priority: 'normal',
    });
    */

    res.status(200).json({
      status: 'success',
      message: 'Payment refunded successfully',
      data: transaction,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process refund',
      error: error.message,
    });
  }
};

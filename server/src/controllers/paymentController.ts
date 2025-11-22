import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Transaction } from '@/models/Transaction';
import { Contract } from '@/models/Contract';
import { PlatformSettings } from '@/models/PlatformSettings';
import { AuthRequest } from '@/types/auth';
import { createNotification } from './notificationController';
import { sendEmail } from '@/utils/email.resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Create payment intent
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { contractId, milestoneId } = req.body;
    const userId = (req as AuthRequest).user._id;

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
    if (contract.client._id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the client can make payments',
      });
    }

    // Find milestone
    const milestone = contract.milestones.id(milestoneId);
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
      status: { $in: ['completed', 'processing'] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment already processed for this milestone',
      });
    }

    // Get platform settings for commission
    const settings = await PlatformSettings.findOne().sort({ createdAt: -1 });
    if (!settings) {
      return res.status(500).json({
        status: 'error',
        message: 'Platform settings not configured',
      });
    }

    // Calculate commission
    let commission = 0;
    if (settings.commission.type === 'percentage') {
      commission = (milestone.amount * settings.commission.percentage) / 100;
    } else {
      commission = settings.commission.percentage;
    }

    // Apply min/max limits
    if (settings.commission.minimumAmount > 0 && commission < settings.commission.minimumAmount) {
      commission = settings.commission.minimumAmount;
    }
    if (settings.commission.maximumAmount > 0 && commission > settings.commission.maximumAmount) {
      commission = settings.commission.maximumAmount;
    }

    const freelancerAmount = milestone.amount - commission;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(milestone.amount * 100), // Convert to cents
      currency: settings.payment.currency.toLowerCase(),
      customer: (contract.client as any).stripeCustomerId,
      metadata: {
        contractId: contractId.toString(),
        milestoneId: milestoneId.toString(),
        clientId: contract.client._id.toString(),
        freelancerId: contract.freelancer._id.toString(),
        commission: commission.toString(),
        freelancerAmount: freelancerAmount.toString(),
      },
      description: `Payment for milestone: ${milestone.title}`,
    });

    // Create transaction record
    const transaction = await Transaction.create({
      contract: contractId,
      milestone: milestoneId,
      amount: milestone.amount,
      platformCommission: commission,
      freelancerAmount,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      client: contract.client._id,
      freelancer: contract.freelancer._id,
    });

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        transaction,
        breakdown: {
          amount: milestone.amount,
          commission,
          freelancerAmount,
          commissionPercentage: settings.commission.percentage,
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

    transaction.status = 'processing';
    transaction.paidAt = new Date();
    await transaction.save();

    // Update milestone status
    const contract = await Contract.findById(transaction.contract)
      .populate('client', 'email profile')
      .populate('freelancer', 'email profile');

    if (contract) {
      const milestone = contract.milestones.id(transaction.milestone);
      if (milestone) {
        milestone.status = 'paid';
        milestone.paidAt = new Date();
        await contract.save();
      }

      // Create notifications
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

    const transaction = await Transaction.findById(transactionId)
      .populate('contract')
      .populate('freelancer', 'email profile stripeConnectedAccountId');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'processing') {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction is not in processing status',
      });
    }

    // Transfer to freelancer's Stripe account
    if ((transaction.freelancer as any).stripeConnectedAccountId) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(transaction.freelancerAmount * 100),
        currency: 'usd',
        destination: (transaction.freelancer as any).stripeConnectedAccountId,
        metadata: {
          transactionId: transaction._id.toString(),
          contractId: transaction.contract.toString(),
        },
      });

      transaction.stripeTransferId = transfer.id;
    }

    transaction.status = 'completed';
    transaction.releasedAt = new Date();
    await transaction.save();

    // Create notification
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
    const userId = (req as AuthRequest).user._id;
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
    const userId = (req as AuthRequest).user._id;

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
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    transaction.status = 'refunded';
    transaction.failureReason = reason || 'Refund requested';
    await transaction.save();

    // Create notifications
    await createNotification({
      user: transaction.client.toString(),
      type: 'payment',
      title: 'Payment Refunded',
      message: `Payment of $${transaction.amount} has been refunded`,
      link: `/dashboard/transactions`,
      priority: 'normal',
    });

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

import { Request, Response } from 'express';
import { Transaction } from '@/models/Transaction';
import { Contract } from '@/models/Contract';
import { User } from '@/models/User';

// Get all transactions (admin)
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('contract', 'title')
        .populate('client', 'profile.firstName profile.lastName email')
        .populate('freelancer', 'profile.firstName profile.lastName email'),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
};

// Get transaction stats (admin)
export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const [volumeResult, commissionResult, statusCounts] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: { $nin: ['failed', 'cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: { $nin: ['failed', 'cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } },
      ]),
      Transaction.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = statusCounts.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      status: 'success',
      data: {
        totalVolume: volumeResult[0]?.total || 0,
        totalCommission: commissionResult[0]?.total || 0,
        pendingCount: (statusMap.pending || 0) + (statusMap.processing || 0),
        escrowCount: statusMap.held_in_escrow || 0,
        releasedCount: statusMap.released || 0,
        refundedCount: statusMap.refunded || 0,
        failedCount: statusMap.failed || 0,
      },
    });
  } catch (error: any) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transaction stats',
      error: error.message,
    });
  }
};

// Auto-release escrow payments (cron job function)
export const autoReleaseEscrowPayments = async () => {
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16', // Latest supported by stripe@14.25.0 - upgrade to stripe@17+ for newer versions
    });

    // Find transactions that are past their escrow release date
    const transactionsToRelease = await Transaction.find({
      status: 'held_in_escrow',
      escrowReleaseDate: { $lte: new Date() },
    }).populate('freelancer', 'stripeConnectedAccountId');

    console.log(`[AUTO-RELEASE] Found ${transactionsToRelease.length} transactions to release`);

    for (const transaction of transactionsToRelease) {
      try {
        const freelancer = transaction.freelancer as any;
        
        if (freelancer?.stripeConnectedAccountId) {
          // Transfer to freelancer's Stripe account
          await stripe.transfers.create({
            amount: Math.round(transaction.freelancerAmount * 100),
            currency: (transaction.currency || 'USD').toLowerCase(),
            destination: freelancer.stripeConnectedAccountId,
            metadata: {
              transactionId: transaction._id.toString(),
              autoRelease: 'true',
            },
          });
        }

        transaction.status = 'released';
        transaction.releasedAt = new Date();
        await transaction.save();

        console.log(`[AUTO-RELEASE] Released transaction ${transaction._id}`);
      } catch (err: any) {
        console.error(`[AUTO-RELEASE] Failed to release transaction ${transaction._id}:`, err.message);
      }
    }

    return { released: transactionsToRelease.length };
  } catch (error: any) {
    console.error('[AUTO-RELEASE] Error:', error);
    throw error;
  }
};

// Manual trigger for auto-release (admin endpoint)
export const triggerAutoRelease = async (req: Request, res: Response) => {
  try {
    const result = await autoReleaseEscrowPayments();
    res.status(200).json({
      status: 'success',
      message: `Auto-released ${result.released} transactions`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to trigger auto-release',
      error: error.message,
    });
  }
};

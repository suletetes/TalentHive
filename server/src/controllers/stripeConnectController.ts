import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create Stripe Connect account and return onboarding URL
export const createConnectAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.role !== 'freelancer') {
      return res.status(403).json({ status: 'error', message: 'Only freelancers can set up payment accounts' });
    }

    let accountId = user.stripeConnectedAccountId;

    // Create new account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: userId.toString(),
        },
      });
      accountId = account.id;
      user.stripeConnectedAccountId = accountId;
      await user.save();
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/dashboard/earnings?refresh=true`,
      return_url: `${process.env.CLIENT_URL}/dashboard/earnings?success=true`,
      type: 'account_onboarding',
    });

    res.status(200).json({
      status: 'success',
      data: { url: accountLink.url },
    });
  } catch (error: any) {
    console.error('Stripe Connect onboarding error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment account',
      error: error.message,
    });
  }
};

// Get Stripe Connect account status
export const getConnectStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (!user.stripeConnectedAccountId) {
      return res.status(200).json({
        status: 'success',
        data: { isConnected: false, accountStatus: null },
      });
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);

    res.status(200).json({
      status: 'success',
      data: {
        isConnected: true,
        accountStatus: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements,
        },
      },
    });
  } catch (error: any) {
    console.error('Get Stripe Connect status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get account status',
      error: error.message,
    });
  }
};

// Get freelancer earnings
export const getEarnings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Calculate earnings from transactions
    const [inEscrow, pending, released] = await Promise.all([
      Transaction.aggregate([
        { $match: { freelancer: userId, status: 'held_in_escrow' } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { freelancer: userId, status: { $in: ['pending', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { freelancer: userId, status: 'released' } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
    ]);

    const totalEarned = (inEscrow[0]?.total || 0) + (released[0]?.total || 0);

    res.status(200).json({
      status: 'success',
      data: {
        inEscrow: inEscrow[0]?.total || 0,
        pending: pending[0]?.total || 0,
        available: released[0]?.total || 0,
        totalEarned,
      },
    });
  } catch (error: any) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get earnings',
      error: error.message,
    });
  }
};

// Request payout
export const requestPayout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user || !user.stripeConnectedAccountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment account not set up',
      });
    }

    // Get available balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripeConnectedAccountId,
    });

    const availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);

    if (availableAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No available balance to withdraw',
      });
    }

    // Create payout
    const payout = await stripe.payouts.create(
      {
        amount: availableAmount,
        currency: 'usd',
      },
      { stripeAccount: user.stripeConnectedAccountId }
    );

    res.status(200).json({
      status: 'success',
      message: 'Payout requested successfully',
      data: { payout },
    });
  } catch (error: any) {
    console.error('Request payout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to request payout',
      error: error.message,
    });
  }
};

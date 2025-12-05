import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Latest supported by stripe@14.25.0 - upgrade to stripe@17+ for newer versions
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
    console.log('💰 [EARNINGS] Getting earnings for user:', userId);
    console.log('💰 [EARNINGS] User email:', req.user?.email);
    console.log('💰 [EARNINGS] User role:', req.user?.role);

    // First, check all transactions for this user
    const allTransactions = await Transaction.find({ freelancer: userId });
    console.log('📊 [EARNINGS] Total transactions for user:', allTransactions.length);
    
    if (allTransactions.length > 0) {
      console.log('📊 [EARNINGS] Transaction breakdown:');
      allTransactions.forEach((t, i) => {
        console.log(`  ${i + 1}. Status: ${t.status}, Amount: ${t.freelancerAmount}, ID: ${t._id}`);
      });
    } else {
      console.log('⚠️ [EARNINGS] No transactions found for this user');
      
      // Check if there are ANY transactions in the system
      const anyTransactions = await Transaction.countDocuments();
      console.log('📊 [EARNINGS] Total transactions in system:', anyTransactions);
      
      if (anyTransactions > 0) {
        // Show a sample transaction to compare
        const sampleTransaction = await Transaction.findOne();
        console.log('📊 [EARNINGS] Sample transaction freelancer ID:', sampleTransaction?.freelancer);
        console.log('📊 [EARNINGS] Current user ID:', userId);
        console.log('📊 [EARNINGS] IDs match:', sampleTransaction?.freelancer?.toString() === userId?.toString());
      }
    }

    // Calculate earnings from transactions
    console.log('🔍 [EARNINGS] Running aggregation queries...');
    
    // Import mongoose to convert userId to ObjectId
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('🔍 [EARNINGS] Converted userId to ObjectId:', userObjectId);
    
    const [inEscrow, pending, released, paidOut] = await Promise.all([
      Transaction.aggregate([
        { $match: { freelancer: userObjectId, status: 'held_in_escrow' } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { freelancer: userObjectId, status: { $in: ['pending', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { freelancer: userObjectId, status: 'released' } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { freelancer: userObjectId, status: 'paid_out' } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
    ]);

    // Amounts are stored in cents, convert to dollars for display
    const inEscrowCents = inEscrow[0]?.total || 0;
    const pendingCents = pending[0]?.total || 0;
    const releasedCents = released[0]?.total || 0;
    const paidOutCents = paidOut[0]?.total || 0;

    console.log('💵 [EARNINGS] In Escrow (cents):', inEscrowCents);
    console.log('💵 [EARNINGS] Pending (cents):', pendingCents);
    console.log('💵 [EARNINGS] Released (cents):', releasedCents);
    console.log('💵 [EARNINGS] Paid Out (cents):', paidOutCents);

    const totalEarnedCents = inEscrowCents + releasedCents + paidOutCents;
    console.log('💵 [EARNINGS] Total Earned (cents):', totalEarnedCents);

    // Convert to dollars for response
    const responseData = {
      inEscrow: inEscrowCents / 100,
      pending: pendingCents / 100,
      available: releasedCents / 100,
      totalEarned: totalEarnedCents / 100,
    };

    console.log('✅ [EARNINGS] Sending response (dollars):', responseData);

    res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error: any) {
    console.error('❌ [EARNINGS] Get earnings error:', error);
    console.error('❌ [EARNINGS] Error stack:', error.stack);
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
    console.log('💰 [PAYOUT] Payout request from user:', userId);

    const user = await User.findById(userId);

    if (!user || !user.stripeConnectedAccountId) {
      console.log('❌ [PAYOUT] User has no Stripe account connected');
      return res.status(400).json({
        status: 'error',
        message: 'Payment account not set up',
      });
    }

    console.log('✅ [PAYOUT] User Stripe account:', user.stripeConnectedAccountId);

    // Check if using mock mode for development
    const useMockPayout = process.env.MOCK_STRIPE_CONNECT === 'true' || process.env.NODE_ENV === 'development';

    let availableAmount = 0;
    let payout: any;

    if (useMockPayout) {
      console.log('⚠️ [PAYOUT] Using mock payout (development mode)');
      console.log('🔍 [PAYOUT] MOCK_STRIPE_CONNECT:', process.env.MOCK_STRIPE_CONNECT);
      console.log('🔍 [PAYOUT] NODE_ENV:', process.env.NODE_ENV);
      
      // Calculate available balance from released transactions
      const mongoose = require('mongoose');
      const userObjectId = new mongoose.Types.ObjectId(userId);
      console.log('🔍 [PAYOUT] User ObjectId for query:', userObjectId);
      
      // First check how many released transactions exist
      const allReleased = await Transaction.find({ status: 'released' });
      console.log('📊 [PAYOUT] Total released transactions in system:', allReleased.length);
      if (allReleased.length > 0) {
        console.log('📊 [PAYOUT] First released transaction freelancer:', allReleased[0].freelancer);
        console.log('📊 [PAYOUT] Current user ObjectId:', userObjectId);
        console.log('📊 [PAYOUT] Match:', allReleased[0].freelancer.toString() === userObjectId.toString());
      }
      
      const releasedTransactions = await Transaction.aggregate([
        { $match: { freelancer: userObjectId, status: 'released' } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]);

      console.log('📊 [PAYOUT] Aggregation result:', JSON.stringify(releasedTransactions, null, 2));
      
      // Amounts are already in cents in the database
      availableAmount = releasedTransactions[0]?.total || 0;
      console.log('💵 [PAYOUT] Available from transactions (cents):', availableAmount);
      console.log('💵 [PAYOUT] Available from transactions (dollars):', availableAmount / 100);

      if (availableAmount <= 0) {
        console.log('⚠️ [PAYOUT] No released transactions to withdraw');
        console.log('⚠️ [PAYOUT] availableAmount value:', availableAmount);
        console.log('⚠️ [PAYOUT] Check failed: availableAmount <= 0 is', availableAmount <= 0);
        return res.status(400).json({
          status: 'error',
          message: 'No available balance to withdraw',
        });
      }
      
      console.log('✅ [PAYOUT] Proceeding with payout, amount:', availableAmount);

      // Mock payout
      payout = {
        id: `po_mock_${Date.now()}`,
        amount: availableAmount,
        currency: 'usd',
        status: 'paid',
        arrival_date: Math.floor(Date.now() / 1000),
      };

      console.log('✅ [PAYOUT] Mock payout created:', payout.id);
      
      // Update transaction statuses to 'paid_out' so they don't show as available anymore
      const updateResult = await Transaction.updateMany(
        { freelancer: userObjectId, status: 'released' },
        { $set: { status: 'paid_out', paidOutAt: new Date() } }
      );
      
      console.log('✅ [PAYOUT] Updated transactions to paid_out:', updateResult.modifiedCount);
    } else {
      // Real Stripe payout
      console.log('🔍 [PAYOUT] Checking Stripe balance...');
      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeConnectedAccountId,
      });

      console.log('💵 [PAYOUT] Stripe balance:', JSON.stringify(balance, null, 2));

      availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);
      console.log('💵 [PAYOUT] Available amount (cents):', availableAmount);
      console.log('💵 [PAYOUT] Available amount (dollars):', availableAmount / 100);

      if (availableAmount <= 0) {
        console.log('⚠️ [PAYOUT] No available balance');
        
        // Check if there are released transactions
        const releasedTransactions = await Transaction.find({
          freelancer: userId,
          status: 'released',
        });
        
        console.log('📊 [PAYOUT] Released transactions count:', releasedTransactions.length);
        if (releasedTransactions.length > 0) {
          console.log('⚠️ [PAYOUT] Transactions are released but not yet in Stripe balance');
          console.log('⚠️ [PAYOUT] This may take a few minutes to reflect in Stripe');
        }

        return res.status(400).json({
          status: 'error',
          message: 'No available balance to withdraw',
        });
      }

      // Create real payout
      console.log('💸 [PAYOUT] Creating Stripe payout for amount:', availableAmount);
      payout = await stripe.payouts.create(
        {
          amount: availableAmount,
          currency: 'usd',
        },
        { stripeAccount: user.stripeConnectedAccountId }
      );

      console.log('✅ [PAYOUT] Payout created successfully:', payout.id);
    }

    res.status(200).json({
      status: 'success',
      message: 'Payout requested successfully',
      data: { payout },
    });
  } catch (error: any) {
    console.error('❌ [PAYOUT] Request payout error:', error);
    console.error('❌ [PAYOUT] Error details:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to request payout',
      error: error.message,
    });
  }
};

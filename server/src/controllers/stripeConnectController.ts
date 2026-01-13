import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { getTestIndividualData, getTestBankAccount, isStripeTestMode, logTestModeInfo, getValidBusinessUrl } from '@/utils/stripeTestData';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Updated to latest API version
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

    // Check if using test mode for development
    const useTestMode = isStripeTestMode();
    
    if (useTestMode) {
      logTestModeInfo();
      console.log('[CONNECT] Using Stripe test mode with auto-approved test data');
      
      // Create real Stripe Express account but with test data that auto-approves
      let accountId = user.stripeConnectedAccountId;

      if (!accountId) {
        const testIndividualData = getTestIndividualData(user.profile, user.email);
        
        // Ensure we have a valid URL for business profile
        const businessUrl = getValidBusinessUrl();
        console.log('[CONNECT] Business URL being used:', businessUrl);
        console.log('[CONNECT] CLIENT_URL env var:', process.env.CLIENT_URL);

        // Create business profile - URL is optional and localhost is not allowed by Stripe
        const businessProfile: any = {
          mcc: '5734', // Computer software stores
          product_description: 'Freelance services',
        };

        // Only add URL if it's not localhost (Stripe doesn't accept localhost URLs)
        const testBusinessUrl = getValidBusinessUrl();
        if (!testBusinessUrl.includes('localhost')) {
          businessProfile.url = testBusinessUrl;
          console.log('[CONNECT] Added business URL to profile:', testBusinessUrl);
        } else {
          console.log('[CONNECT] Skipping localhost URL - not allowed by Stripe API');
        }

        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          individual: testIndividualData,
          business_profile: businessProfile,
          metadata: {
            userId: userId.toString(),
            testMode: 'true',
            autoApproved: 'true',
          },
        });
        
        accountId = account.id;
        user.stripeConnectedAccountId = accountId;
        await user.save();
        console.log('[CONNECT] Created Stripe Express account with test data:', accountId);

        // In test mode, add external account with test bank details
        try {
          const testBankAccount = getTestBankAccount();
          await stripe.accounts.createExternalAccount(accountId, {
            external_account: testBankAccount,
          });
          console.log('[CONNECT] Added test bank account to Express account');
        } catch (bankError: any) {
          console.log('[CONNECT] Bank account will be added during onboarding flow:', bankError.message);
        }
      }

      // Create account link for onboarding (completes any remaining setup)
      const clientUrl = getValidBusinessUrl();
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${clientUrl}/dashboard/earnings?refresh=true`,
        return_url: `${clientUrl}/dashboard/earnings?success=true&test=true`,
        type: 'account_onboarding',
      });

      return res.status(200).json({
        status: 'success',
        data: { 
          url: accountLink.url,
          message: 'Stripe Express account created with test data (auto-approved)',
          testMode: true,
        },
      });
    }

    // Production mode - regular flow
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
    const clientUrl = getValidBusinessUrl();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${clientUrl}/dashboard/earnings?refresh=true`,
      return_url: `${clientUrl}/dashboard/earnings?success=true`,
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

    // Check if using test mode
    const useTestMode = isStripeTestMode();
    
    try {
      const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);

      // Check if account needs transfers capability
      if (!account.capabilities?.transfers || account.capabilities.transfers !== 'active') {
        console.log('[CONNECT] Account missing transfers capability, attempting to enable...');
        
        try {
          await stripe.accounts.update(user.stripeConnectedAccountId, {
            capabilities: {
              transfers: { requested: true },
            },
          });
          console.log('[CONNECT] Transfers capability requested for existing account');
        } catch (updateError: any) {
          console.log('[CONNECT] Could not update account capabilities:', updateError.message);
        }
      }

      const response = {
        status: 'success',
        data: {
          isConnected: true,
          accountStatus: {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            requirements: account.requirements,
            transfersEnabled: account.capabilities?.transfers === 'active',
          },
          testMode: useTestMode,
        },
      };

      if (useTestMode) {
        console.log('[CONNECT] Stripe Connect status (test mode):', {
          accountId: user.stripeConnectedAccountId,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          transfersEnabled: account.capabilities?.transfers === 'active',
        });
      }

      res.status(200).json(response);
    } catch (stripeError: any) {
      // If account doesn't exist in Stripe, reset the user's account ID
      if (stripeError.code === 'resource_missing') {
        user.stripeConnectedAccountId = undefined;
        await user.save();
        
        return res.status(200).json({
          status: 'success',
          data: { isConnected: false, accountStatus: null },
        });
      }
      
      throw stripeError;
    }
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
    console.log(' [EARNINGS] Getting earnings for user:', userId);
    console.log(' [EARNINGS] User email:', req.user?.email);
    console.log(' [EARNINGS] User role:', req.user?.role);

    // First, check all transactions for this user
    const allTransactions = await Transaction.find({ freelancer: userId });
    console.log('  [EARNINGS] Total transactions for user:', allTransactions.length);
    
    if (allTransactions.length > 0) {
      console.log('  [EARNINGS] Transaction breakdown:');
      allTransactions.forEach((t, i) => {
        console.log(`  ${i + 1}. Status: ${t.status}, Amount: ${t.freelancerAmount}, ID: ${t._id}`);
      });
    } else {
      console.log('  [EARNINGS] No transactions found for this user');
      
      // Check if there are ANY transactions in the system
      const anyTransactions = await Transaction.countDocuments();
      console.log('  [EARNINGS] Total transactions in system:', anyTransactions);
      
      if (anyTransactions > 0) {
        // Show a sample transaction to compare
        const sampleTransaction = await Transaction.findOne();
        console.log('  [EARNINGS] Sample transaction freelancer ID:', sampleTransaction?.freelancer);
        console.log('  [EARNINGS] Current user ID:', userId);
        console.log('  [EARNINGS] IDs match:', sampleTransaction?.freelancer?.toString() === userId?.toString());
      }
    }

    // Calculate earnings from transactions
    console.log('  [EARNINGS] Running aggregation queries...');
    
    // Import mongoose to convert userId to ObjectId
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('  [EARNINGS] Converted userId to ObjectId:', userObjectId);
    
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

    console.log('  [EARNINGS] In Escrow (cents):', inEscrowCents);
    console.log('  [EARNINGS] Pending (cents):', pendingCents);
    console.log('  [EARNINGS] Released (cents):', releasedCents);
    console.log('  [EARNINGS] Paid Out (cents):', paidOutCents);

    const totalEarnedCents = inEscrowCents + releasedCents + paidOutCents;
    console.log('  [EARNINGS] Total Earned (cents):', totalEarnedCents);

    // Convert to dollars for response
    const responseData = {
      inEscrow: inEscrowCents / 100,
      pending: pendingCents / 100,
      available: releasedCents / 100,
      totalEarned: totalEarnedCents / 100,
    };

    console.log('  [EARNINGS] Sending response (dollars):', responseData);

    res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error: any) {
    console.error('  [EARNINGS] Get earnings error:', error);
    console.error('  [EARNINGS] Error stack:', error.stack);
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
    console.log(' [PAYOUT] Payout request from user:', userId);

    const user = await User.findById(userId);

    if (!user) {
      console.log('  [PAYOUT] User not found');
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    if (!user.stripeConnectedAccountId) {
      console.log('  [PAYOUT] User has no Stripe account connected');
      return res.status(400).json({
        status: 'error',
        message: 'Payment account not set up',
      });
    }

    console.log('  [PAYOUT] User Stripe account:', user.stripeConnectedAccountId);

    // Check if using test mode
    const useTestMode = isStripeTestMode();
    
    console.log('  [PAYOUT] Test mode settings:');
    console.log('  [PAYOUT] NODE_ENV:', process.env.NODE_ENV);
    console.log('  [PAYOUT] Using test mode:', useTestMode);

    let availableAmount = 0;
    let payout: any;

    if (useTestMode) {
      console.log('  [PAYOUT] Using test mode - checking both Stripe balance and released transactions');
      
      // In test mode, we'll try to get the actual Stripe balance first
      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: user.stripeConnectedAccountId,
        });
        
        availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);
        console.log('  [PAYOUT] Stripe balance available (cents):', availableAmount);
        
        if (availableAmount > 0) {
          // Create real test payout
          payout = await stripe.payouts.create(
            {
              amount: availableAmount,
              currency: 'usd',
            },
            { stripeAccount: user.stripeConnectedAccountId }
          );
          
          console.log('  [PAYOUT] Real test payout created:', payout.id);
        } else {
          // Fallback to mock payout for released transactions
          console.log('  [PAYOUT] No Stripe balance, checking released transactions for mock payout');
          
          const mongoose = require('mongoose');
          const userObjectId = new mongoose.Types.ObjectId(userId);
          
          const releasedTransactions = await Transaction.aggregate([
            { $match: { freelancer: userObjectId, status: 'released' } },
            { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
          ]);

          availableAmount = releasedTransactions[0]?.total || 0;
          console.log('  [PAYOUT] Available from released transactions (cents):', availableAmount);

          if (availableAmount <= 0) {
            return res.status(400).json({
              status: 'error',
              message: 'No available balance to withdraw',
            });
          }

          // Create mock payout for test mode
          payout = {
            id: `po_test_${Date.now()}`,
            amount: availableAmount,
            currency: 'usd',
            status: 'paid',
            arrival_date: Math.floor(Date.now() / 1000),
            method: 'instant',
          };

          // Update transaction statuses to 'paid_out'
          const updateResult = await Transaction.updateMany(
            { freelancer: userObjectId, status: 'released' },
            { $set: { status: 'paid_out', paidOutAt: new Date() } }
          );
          
          console.log('  [PAYOUT] Updated transactions to paid_out:', updateResult.modifiedCount);
        }
      } catch (stripeError: any) {
        console.log('  [PAYOUT] Stripe balance check failed, using mock payout:', stripeError.message);
        
        // Fallback to mock payout
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        const releasedTransactions = await Transaction.aggregate([
          { $match: { freelancer: userObjectId, status: 'released' } },
          { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
        ]);

        availableAmount = releasedTransactions[0]?.total || 0;

        if (availableAmount <= 0) {
          return res.status(400).json({
            status: 'error',
            message: 'No available balance to withdraw',
          });
        }

        payout = {
          id: `po_test_mock_${Date.now()}`,
          amount: availableAmount,
          currency: 'usd',
          status: 'paid',
          arrival_date: Math.floor(Date.now() / 1000),
          method: 'standard',
        };

        await Transaction.updateMany(
          { freelancer: userObjectId, status: 'released' },
          { $set: { status: 'paid_out', paidOutAt: new Date() } }
        );
      }
    } else {
      // Production mode - real Stripe payout
      console.log('  [PAYOUT] Production mode - checking Stripe balance...');
      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeConnectedAccountId,
      });

      availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);
      console.log('  [PAYOUT] Available amount (cents):', availableAmount);

      if (availableAmount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No available balance to withdraw',
        });
      }

      // Create real payout
      payout = await stripe.payouts.create(
        {
          amount: availableAmount,
          currency: 'usd',
        },
        { stripeAccount: user.stripeConnectedAccountId }
      );

      console.log('  [PAYOUT] Production payout created:', payout.id);
    }

    res.status(200).json({
      status: 'success',
      message: 'Payout requested successfully',
      data: { 
        payout,
        testMode: useTestMode,
      },
    });
  } catch (error: any) {
    console.error('  [PAYOUT] Request payout error:', error);
    console.error('  [PAYOUT] Error details:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to request payout',
      error: error.message,
    });
  }
};

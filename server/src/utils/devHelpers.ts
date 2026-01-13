import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import mongoose from 'mongoose';

/**
 * Development helper functions for testing Stripe functionality
 * These should only be used in development/testing environments
 */

/**
 * Create mock transactions for testing withdrawals
 * @param freelancerId - The freelancer's user ID
 * @param amount - Amount in dollars (will be converted to cents)
 * @param status - Transaction status (default: 'released')
 */
export const createMockTransaction = async (
  freelancerId: string,
  amount: number,
  status: 'pending' | 'processing' | 'held_in_escrow' | 'released' | 'paid_out' = 'released'
) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock transactions can only be created in development mode');
  }

  const amountInCents = Math.round(amount * 100);
  const platformCommission = Math.round(amountInCents * 0.1); // 10% commission
  const processingFee = Math.round(amountInCents * 0.029) + 30; // 2.9% + $0.30
  const freelancerAmount = amountInCents - platformCommission - processingFee;

  // Try to find an existing contract, or create a mock one
  const { Contract } = await import('../models/Contract');
  let contractId;
  
  try {
    // Try to find any existing contract
    const existingContract = await Contract.findOne();
    if (existingContract) {
      contractId = existingContract._id;
      console.log(`[DEV] Using existing contract: ${contractId}`);
    } else {
      // Create a minimal mock contract
      const mockContract = new Contract({
        title: `Mock Contract for Testing - ${Date.now()}`,
        description: 'Mock contract created for transaction testing',
        client: new mongoose.Types.ObjectId(),
        freelancer: new mongoose.Types.ObjectId(freelancerId),
        budget: amountInCents,
        status: 'active',
        paymentType: 'milestone',
        milestones: [{
          title: 'Mock Milestone',
          description: 'Mock milestone for testing',
          amount: amountInCents,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'in_progress',
        }],
        metadata: {
          mockContract: true,
          createdForTesting: true,
        },
      });
      
      await mockContract.save();
      contractId = mockContract._id;
      console.log(`[DEV] Created mock contract: ${contractId}`);
    }
  } catch (error) {
    console.warn('[DEV] Could not create/find contract, using random ObjectId');
    contractId = new mongoose.Types.ObjectId();
  }

  const mockTransaction = new Transaction({
    contract: contractId,
    client: new mongoose.Types.ObjectId(), // Mock client ID
    freelancer: new mongoose.Types.ObjectId(freelancerId),
    amount: amountInCents,
    platformCommission,
    processingFee,
    tax: 0,
    freelancerAmount,
    currency: 'USD',
    status,
    paymentMethod: 'stripe',
    stripePaymentIntentId: `pi_mock_${Date.now()}`,
    description: `Mock transaction for development testing - $${amount}`,
    metadata: {
      mockTransaction: true,
      createdForTesting: true,
    },
  });

  await mockTransaction.save();
  console.log(`[DEV] Created mock transaction: $${amount} (${status}) for freelancer ${freelancerId}`);
  
  return mockTransaction;
};

/**
 * Create multiple mock transactions for a freelancer
 */
export const createMockTransactionsForFreelancer = async (
  freelancerId: string,
  transactions: Array<{ amount: number; status?: 'pending' | 'processing' | 'held_in_escrow' | 'released' | 'paid_out' }>
) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock transactions can only be created in development mode');
  }

  const createdTransactions = [];
  
  for (const tx of transactions) {
    const mockTx = await createMockTransaction(freelancerId, tx.amount, tx.status);
    createdTransactions.push(mockTx);
  }

  console.log(`[DEV] Created ${createdTransactions.length} mock transactions for freelancer ${freelancerId}`);
  return createdTransactions;
};

/**
 * Clean up all mock transactions (for testing cleanup)
 */
export const cleanupMockTransactions = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock transaction cleanup can only be done in development mode');
  }

  const result = await Transaction.deleteMany({
    'metadata.mockTransaction': true,
  });

  console.log(`[DEV] Cleaned up ${result.deletedCount} mock transactions`);
  return result.deletedCount;
};

/**
 * Get development status for a user
 */
export const getDevStatus = async (userId: string) => {
  const user = await User.findById(userId);
  const transactions = await Transaction.find({ freelancer: userId });
  
  const mockTransactions = transactions.filter(t => t.metadata?.mockTransaction);
  const realTransactions = transactions.filter(t => !t.metadata?.mockTransaction);
  
  return {
    user: {
      id: user?._id,
      email: user?.email,
      role: user?.role,
      stripeConnectedAccountId: user?.stripeConnectedAccountId,
      hasMockStripeAccount: user?.stripeConnectedAccountId?.startsWith('acct_mock_'),
    },
    transactions: {
      total: transactions.length,
      mock: mockTransactions.length,
      real: realTransactions.length,
      byStatus: transactions.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MOCK_STRIPE_CONNECT: process.env.MOCK_STRIPE_CONNECT,
    },
  };
};
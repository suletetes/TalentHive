// Mock Stripe - must be before imports due to hoisting
jest.mock('../config/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    paymentMethods: {
      retrieve: jest.fn(),
    },
    transfers: {
      create: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
  },
  STRIPE_CONFIG: {
    PLATFORM_FEE_PERCENTAGE: 0.05,
    CURRENCY: 'USD',
    ESCROW_HOLD_DAYS: 7,
  },
}));

import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Contract } from '../models/Contract';
import { Payment, EscrowAccount } from '../models/Payment';
import { connectDB, disconnectDB } from '../config/database';
import { generateToken } from '../utils/jwt';
import { stripe } from '../config/stripe';

describe('Payment System', () => {
  let clientUser: any;
  let freelancerUser: any;
  let project: any;
  let proposal: any;
  let contract: any;
  let clientToken: string;
  let freelancerToken: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Project.deleteMany({});
    await Proposal.deleteMany({});
    await Contract.deleteMany({});
    await Payment.deleteMany({});
    await EscrowAccount.deleteMany({});

    // Reset mocks
    jest.clearAllMocks();

    // Create test users
    clientUser = await User.create({
      email: 'client@test.com',
      password: 'password123',
      role: 'client',
      profile: {
        firstName: 'John',
        lastName: 'Client',
      },
      isEmailVerified: true,
      isActive: true,
    });

    freelancerUser = await User.create({
      email: 'freelancer@test.com',
      password: 'password123',
      role: 'freelancer',
      profile: {
        firstName: 'Jane',
        lastName: 'Freelancer',
      },
      freelancerProfile: {
        title: 'Full Stack Developer',
        hourlyRate: 50,
        skills: ['JavaScript', 'React', 'Node.js'],
        completedProjects: 5,
      },
      rating: 4.5,
      isEmailVerified: true,
      isActive: true,
    });

    // Create test project and contract
    project = await Project.create({
      title: 'Test Project',
      description: 'A test project for payment testing',
      client: clientUser._id,
      budget: { type: 'fixed', min: 1000, max: 2000 },
      timeline: { duration: 2, unit: 'weeks' },
      skills: ['JavaScript', 'React'],
      category: 'Web Development',
      status: 'in_progress',
      selectedFreelancer: freelancerUser._id,
    });

    proposal = await Proposal.create({
      project: project._id,
      freelancer: freelancerUser._id,
      coverLetter: 'This is a test proposal with sufficient length to meet the minimum requirement of 50 characters for the cover letter field.',
      bidAmount: 1500,
      timeline: { duration: 10, unit: 'days' },
      status: 'accepted',
    });

    contract = await Contract.create({
      project: project._id,
      client: clientUser._id,
      freelancer: freelancerUser._id,
      proposal: proposal._id,
      title: 'Test Contract',
      description: 'A test contract',
      totalAmount: 1500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      milestones: [
        {
          title: 'Milestone 1',
          description: 'First milestone',
          amount: 1500,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'approved',
        },
      ],
      terms: {
        paymentTerms: 'Payment upon completion',
        cancellationPolicy: '7 days notice',
        intellectualProperty: 'Client owns work',
        confidentiality: 'Maintain confidentiality',
        disputeResolution: 'Platform resolution',
      },
      status: 'active',
    });

    // Generate tokens
    clientToken = generateToken(clientUser._id);
    freelancerToken = generateToken(freelancerUser._id);
  });

  describe('POST /api/payments/intent', () => {
    it('should create payment intent successfully', async () => {
      const milestoneId = contract.milestones[0]._id;

      (stripe.paymentIntents.create as jest.Mock).mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'requires_confirmation',
        client_secret: 'pi_test_123_secret',
      } as any);

      const paymentData = {
        contractId: contract._id,
        milestoneId: milestoneId,
        amount: 1500,
        paymentMethodId: 'pm_test_123',
      };

      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.paymentIntent).toBeDefined();
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150000, // 1500 * 100 cents
          currency: 'usd',
          payment_method: 'pm_test_123',
        })
      );
    });

    it('should fail for non-client users', async () => {
      const milestoneId = contract.milestones[0]._id;

      const paymentData = {
        contractId: contract._id,
        milestoneId: milestoneId,
        amount: 1500,
        paymentMethodId: 'pm_test_123',
      };

      await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(paymentData)
        .expect(403);
    });

    it('should fail for non-approved milestone', async () => {
      // Update milestone status
      contract.milestones[0].status = 'pending';
      await contract.save();

      const milestoneId = contract.milestones[0]._id;

      const paymentData = {
        contractId: contract._id,
        milestoneId: milestoneId,
        amount: 1500,
        paymentMethodId: 'pm_test_123',
      };

      await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(paymentData)
        .expect(400);
    });
  });

  describe('POST /api/payments/confirm/:paymentIntentId', () => {
    let payment: any;

    beforeEach(async () => {
      payment = await Payment.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1500,
        type: 'milestone_payment',
        status: 'processing',
        stripePaymentIntentId: 'pi_test_123',
        metadata: { description: 'Test payment' },
      });
    });

    it('should confirm successful payment', async () => {
      (stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'succeeded',
      } as any);

      const response = await request(app)
        .post('/api/payments/confirm/pi_test_123')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payment.status).toBe('completed');
    });

    it('should handle failed payment', async () => {
      (stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'payment_failed',
      } as any);

      const response = await request(app)
        .post('/api/payments/confirm/pi_test_123')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.payment.status).toBe('failed');
    });
  });

  describe('GET /api/payments/history', () => {
    beforeEach(async () => {
      await Payment.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1500,
        type: 'milestone_payment',
        status: 'completed',
        metadata: { description: 'Test payment' },
      });
    });

    it('should get payment history for client', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].client).toBeDefined();
    });

    it('should get payment history for freelancer', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].freelancer).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/payments/history?status=completed')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].status).toBe('completed');
    });
  });

  describe('POST /api/payments/escrow/account', () => {
    it('should create escrow account for freelancer', async () => {
      (stripe.accounts.create as jest.Mock).mockResolvedValueOnce({
        id: 'acct_test_123',
      } as any);

      (stripe.accountLinks.create as jest.Mock).mockResolvedValueOnce({
        url: 'https://connect.stripe.com/setup/test',
      } as any);

      const response = await request(app)
        .post('/api/payments/escrow/account')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({ accountType: 'freelancer' })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.escrowAccount).toBeDefined();
      expect(response.body.data.onboardingUrl).toBeDefined();
      expect(stripe.accounts.create).toHaveBeenCalled();
    });

    it('should fail if account already exists', async () => {
      // Create existing account
      await EscrowAccount.create({
        user: freelancerUser._id,
        stripeAccountId: 'acct_existing',
        accountType: 'freelancer',
      });

      await request(app)
        .post('/api/payments/escrow/account')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({ accountType: 'freelancer' })
        .expect(400);
    });
  });

  describe('GET /api/payments/escrow/account', () => {
    beforeEach(async () => {
      await EscrowAccount.create({
        user: freelancerUser._id,
        stripeAccountId: 'acct_test_123',
        accountType: 'freelancer',
        balance: 500,
        status: 'active',
      });
    });

    it('should get escrow account details', async () => {
      (stripe.accounts.retrieve as jest.Mock).mockResolvedValueOnce({
        id: 'acct_test_123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      } as any);

      const response = await request(app)
        .get('/api/payments/escrow/account')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.escrowAccount).toBeDefined();
      expect(response.body.data.stripeAccount).toBeDefined();
    });

    it('should fail if no account exists', async () => {
      await request(app)
        .get('/api/payments/escrow/account')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });

  describe('POST /api/payments/payout', () => {
    let escrowAccount: any;

    beforeEach(async () => {
      escrowAccount = await EscrowAccount.create({
        user: freelancerUser._id,
        stripeAccountId: 'acct_test_123',
        accountType: 'freelancer',
        balance: 1000,
        status: 'active',
        payoutMethods: [
          {
            type: 'bank_account',
            stripePaymentMethodId: 'pm_test_bank',
            isDefault: true,
            details: { last4: '1234', bankName: 'Test Bank' },
            status: 'active',
          },
        ],
      });
    });

    it('should request payout successfully', async () => {
      (stripe.transfers.create as jest.Mock).mockResolvedValueOnce({
        id: 'tr_test_123',
        amount: 50000, // $500 in cents
        status: 'pending',
      } as any);

      const payoutData = {
        amount: 500,
        payoutMethodId: escrowAccount.payoutMethods[0]._id,
      };

      const response = await request(app)
        .post('/api/payments/payout')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(payoutData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.transfer).toBeDefined();
      expect(stripe.transfers.create).toHaveBeenCalled();

      // Check balance was updated
      const updatedAccount = await EscrowAccount.findById(escrowAccount._id);
      expect(updatedAccount?.balance).toBe(500); // 1000 - 500
    });

    it('should fail for insufficient balance', async () => {
      const payoutData = {
        amount: 1500, // More than available balance
        payoutMethodId: escrowAccount.payoutMethods[0]._id,
      };

      await request(app)
        .post('/api/payments/payout')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(payoutData)
        .expect(400);
    });

    it('should fail for non-freelancer', async () => {
      const payoutData = {
        amount: 500,
        payoutMethodId: escrowAccount.payoutMethods[0]._id,
      };

      await request(app)
        .post('/api/payments/payout')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(payoutData)
        .expect(403);
    });
  });

  describe('POST /api/payments/:paymentId/refund', () => {
    let payment: any;

    beforeEach(async () => {
      payment = await Payment.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1500,
        type: 'milestone_payment',
        status: 'completed',
        stripePaymentIntentId: 'pi_test_123',
        metadata: { description: 'Test payment' },
      });
    });

    it('should refund payment successfully', async () => {
      (stripe.refunds.create as jest.Mock).mockResolvedValueOnce({
        id: 'rf_test_123',
        amount: 150000,
        status: 'succeeded',
      } as any);

      const refundData = {
        reason: 'Client requested refund',
        amount: 1500,
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payment.status).toBe('refunded');
      expect(stripe.refunds.create).toHaveBeenCalled();
    });

    it('should fail for non-authorized user', async () => {
      const refundData = {
        reason: 'Unauthorized refund attempt',
      };

      await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(refundData)
        .expect(403);
    });
  });

  describe('Payment Model', () => {
    it('should calculate platform fee correctly', () => {
      const payment = new Payment({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1000,
        type: 'milestone_payment',
      });

      expect(payment.platformFee).toBe(50); // 5% of 1000
      expect(payment.freelancerAmount).toBe(950); // 1000 - 50
    });

    it('should set escrow release date for milestone payments', () => {
      const payment = new Payment({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1000,
        type: 'milestone_payment',
      });

      expect(payment.escrowReleaseDate).toBeDefined();
      expect(payment.escrowReleaseDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should check if payment can be processed', () => {
      const payment = new Payment({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1000,
        type: 'milestone_payment',
        status: 'pending',
        stripePaymentIntentId: 'pi_test_123',
      });

      expect(payment.canBeProcessed()).toBe(true);

      payment.status = 'completed';
      expect(payment.canBeProcessed()).toBe(false);
    });

    it('should check if payment can be refunded', () => {
      const payment = new Payment({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1000,
        type: 'milestone_payment',
        status: 'completed',
        createdAt: new Date(), // Recent payment
      });

      expect(payment.canBeRefunded()).toBe(true);

      // Old payment (over 30 days)
      payment.createdAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      expect(payment.canBeRefunded()).toBe(false);
    });
  });

  describe('EscrowAccount Model', () => {
    it('should create escrow account with default values', async () => {
      const account = new EscrowAccount({
        user: freelancerUser._id,
        stripeAccountId: 'acct_test_123',
        accountType: 'freelancer',
      });

      expect(account.balance).toBe(0);
      expect(account.currency).toBe('USD');
      expect(account.status).toBe('pending');
      expect(account.verificationStatus).toBe('unverified');
    });

    it('should enforce unique user constraint', async () => {
      await EscrowAccount.create({
        user: freelancerUser._id,
        stripeAccountId: 'acct_test_123',
        accountType: 'freelancer',
      });

      try {
        await EscrowAccount.create({
          user: freelancerUser._id,
          stripeAccountId: 'acct_test_456',
          accountType: 'freelancer',
        });
        fail('Should have thrown duplicate key error');
      } catch (error: any) {
        expect(error.code).toBe(11000);
      }
    });
  });
});
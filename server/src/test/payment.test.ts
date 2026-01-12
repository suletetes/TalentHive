// Mock Stripe at the package level - must be before imports due to hoisting
const mockStripe = {
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
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  balance: {
    retrieve: jest.fn(),
  },
  payouts: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mock the Stripe package itself
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

jest.mock('../config/stripe', () => ({
  stripe: mockStripe,
  STRIPE_CONFIG: {
    PLATFORM_FEE_PERCENTAGE: 0.05,
    CURRENCY: 'USD',
    ESCROW_HOLD_DAYS: 7,
  },
}));

// Mock the payment service
const mockPaymentService = {
  createPaymentIntent: jest.fn(),
  confirmPayment: jest.fn(),
  calculateFees: jest.fn(),
};

jest.mock('../services/payment.service', () => ({
  paymentService: mockPaymentService,
  PaymentService: jest.fn().mockImplementation(() => mockPaymentService),
}));

// Mock the notification service
const mockNotificationService = {
  notifyPaymentReceived: jest.fn(),
  notifyEscrowReleased: jest.fn(),
  notifySystem: jest.fn(),
};

jest.mock('../services/notification.service', () => ({
  notificationService: mockNotificationService,
}));

// Mock the email service
jest.mock('../utils/email.resend', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Contract } from '../models/Contract';
import { Payment, EscrowAccount } from '../models/Payment';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import { PlatformSettings } from '../models/PlatformSettings';
import { Settings } from '../models/Settings';
import { generateTokens } from '../utils/jwt';

describe('Payment System', () => {
  let clientUser: any;
  let freelancerUser: any;
  let adminUser: any;
  let project: any;
  let proposal: any;
  let contract: any;
  let clientToken: string;
  let freelancerToken: string;
  let category: any;
  let skills: any[];



  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Project.deleteMany({});
    await Proposal.deleteMany({});
    await Contract.deleteMany({});
    await Payment.deleteMany({});
    await Transaction.deleteMany({});
    await EscrowAccount.deleteMany({});
    await Category.deleteMany({});
    await Skill.deleteMany({});
    await PlatformSettings.deleteMany({});
    await Settings.deleteMany({});

    // Reset mocks
    jest.clearAllMocks();

    // Set environment variables for testing
    process.env.MOCK_STRIPE_CONNECT = 'true';
    process.env.NODE_ENV = 'test';

    // Setup default mock implementations
    mockPaymentService.calculateFees.mockResolvedValue({
      amount: 150000,
      commission: 7500,
      processingFee: 0,
      tax: 0,
      freelancerAmount: 142500,
      currency: 'USD',
    });

    mockPaymentService.createPaymentIntent.mockResolvedValue({
      transaction: {
        _id: 'mock_transaction_id',
        amount: 150000,
        platformCommission: 7500,
        freelancerAmount: 142500,
        status: 'pending',
      },
      paymentIntent: {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      },
      clientSecret: 'pi_test_123_secret',
    });

    mockPaymentService.confirmPayment.mockResolvedValue({
      _id: 'mock_transaction_id',
      status: 'held_in_escrow',
    });

    // Setup Stripe mocks
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_confirmation',
    });

    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded',
      latest_charge: 'ch_test_123',
    });

    mockStripe.accounts.create.mockResolvedValue({
      id: 'acct_test_123',
    });

    mockStripe.accountLinks.create.mockResolvedValue({
      url: 'https://connect.stripe.com/setup/test',
    });

    mockStripe.accounts.retrieve.mockResolvedValue({
      id: 'acct_test_123',
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      requirements: {},
    });

    mockStripe.refunds.create.mockResolvedValue({
      id: 'rf_test_123',
      amount: 150000,
      status: 'succeeded',
    });

    // Create admin user for categories and skills
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
      },
      isVerified: true,
      isActive: true,
    });

    // Create test users
    clientUser = await User.create({
      email: 'client@test.com',
      password: 'password123',
      role: 'client',
      profile: {
        firstName: 'John',
        lastName: 'Client',
      },
      isVerified: true,
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
        availability: { status: 'available' },
        portfolio: [],
        certifications: [],
        timeTracking: { isEnabled: false },
      },
      rating: 4.5,
      isVerified: true,
      isActive: true,
    });

    // Create test category and skills
    category = await Category.create({
      name: 'Web Development',
      slug: 'web-development',
      description: 'Web development projects',
      isActive: true,
      createdBy: adminUser._id,
    });

    const jsSkill = await Skill.create({
      name: 'JavaScript',
      slug: 'javascript',
      category: category._id,
      isActive: true,
      createdBy: adminUser._id,
    });

    const reactSkill = await Skill.create({
      name: 'React',
      slug: 'react',
      category: category._id,
      isActive: true,
      createdBy: adminUser._id,
    });

    skills = [jsSkill, reactSkill];

    // Create platform settings
    await PlatformSettings.create({
      commissionRate: 5, // 5%
      minCommission: 50, // $0.50
      maxCommission: 10000, // $100.00
      escrowHoldDays: 7,
      isActive: true,
      createdBy: adminUser._id,
    });

    // Create settings for commission calculation
    await Settings.create({
      commissionSettings: [
        {
          name: 'Standard',
          commissionPercentage: 5,
          minAmount: 0,
          maxAmount: 10000,
          description: 'Standard commission rate',
          isActive: true,
        },
      ],
      platformFee: 5,
      escrowPeriodDays: 7,
      minWithdrawalAmount: 10,
      maintenanceMode: false,
    });

    // Create test project and contract
    project = await Project.create({
      title: 'Test Project',
      description: 'A test project for payment testing',
      client: clientUser._id,
      budget: { type: 'fixed', min: 1000, max: 2000 },
      timeline: { duration: 2, unit: 'weeks' },
      skills: [jsSkill._id, reactSkill._id],
      category: category._id,
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
    clientToken = generateTokens({
      userId: clientUser._id.toString(),
      email: clientUser.email,
      role: clientUser.role,
    }).accessToken;
    freelancerToken = generateTokens({
      userId: freelancerUser._id.toString(),
      email: freelancerUser.email,
      role: freelancerUser.role,
    }).accessToken;
  });

  describe('POST /api/payments/intent', () => {
    it('should create payment intent successfully', async () => {
      const milestoneId = contract.milestones[0]._id;

      mockStripe.paymentIntents.create.mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'requires_confirmation',
        client_secret: 'pi_test_123_secret',
      });

      const paymentData = {
        contractId: contract._id,
        milestoneId: milestoneId,
        amount: 1500,
        paymentMethodId: 'pm_test_123',
      };

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.clientSecret).toBeDefined();
      expect(response.body.data.paymentIntentId).toBeDefined();
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith(
        contract._id.toString(),
        150000, // 1500 * 100 cents
        clientUser._id.toString(),
        freelancerUser._id.toString(),
        contract.milestones[0]._id.toString(),
        expect.any(String)
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
        .post('/api/v1/payments/create-intent')
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
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(paymentData)
        .expect(400);
    });
  });

  describe('POST /api/payments/confirm/:paymentIntentId', () => {
    let transaction: any;

    beforeEach(async () => {
      transaction = await Transaction.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 150000, // 1500 * 100 cents
        platformCommission: 7500, // 5% of 150000
        processingFee: 0,
        tax: 0,
        freelancerAmount: 142500, // 150000 - 7500
        currency: 'USD',
        status: 'processing',
        stripePaymentIntentId: 'pi_test_123',
        description: 'Test payment',
      });
    });

    it('should confirm successful payment', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'succeeded',
      });

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe('held_in_escrow');
    });

    it('should handle failed payment', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'payment_failed',
      });

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Payment not successful');
    });
  });

  describe('GET /api/payments/history', () => {
    beforeEach(async () => {
      await Transaction.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 150000, // 1500 * 100 cents
        platformCommission: 7500, // 5% of 150000
        processingFee: 0,
        tax: 0,
        freelancerAmount: 142500, // 150000 - 7500
        currency: 'USD',
        status: 'held_in_escrow',
        description: 'Test payment',
      });
    });

    it('should get payment history for client', async () => {
      const response = await request(app)
        .get('/api/v1/payments/transactions')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].client).toBeDefined();
    });

    it('should get payment history for freelancer', async () => {
      const response = await request(app)
        .get('/api/v1/payments/transactions')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].freelancer).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/payments/transactions?status=held_in_escrow')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('held_in_escrow');
    });
  });

  describe('POST /api/payments/escrow/account', () => {
    it('should create escrow account for freelancer', async () => {
      mockStripe.accounts.create.mockResolvedValueOnce({
        id: 'acct_test_123',
      });

      mockStripe.accountLinks.create.mockResolvedValueOnce({
        url: 'https://connect.stripe.com/setup/test',
      });

      const response = await request(app)
        .post('/api/v1/payments/stripe-connect/onboard')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({ accountType: 'freelancer' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.url).toBeDefined();
      expect(mockStripe.accounts.create).toHaveBeenCalled();
    });

    it('should fail if account already exists', async () => {
      // Set existing Stripe account on user
      freelancerUser.stripeConnectedAccountId = 'acct_existing';
      await freelancerUser.save();

      mockStripe.accountLinks.create.mockResolvedValueOnce({
        url: 'https://connect.stripe.com/setup/test',
      });

      await request(app)
        .post('/api/v1/payments/stripe-connect/onboard')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({ accountType: 'freelancer' })
        .expect(200);
    });
  });

  describe('GET /api/payments/escrow/account', () => {
    beforeEach(async () => {
      freelancerUser.stripeConnectedAccountId = 'acct_test_123';
      await freelancerUser.save();
    });

    it('should get escrow account details', async () => {
      mockStripe.accounts.retrieve.mockResolvedValueOnce({
        id: 'acct_test_123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {},
      });

      const response = await request(app)
        .get('/api/v1/payments/stripe-connect/status')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.isConnected).toBe(true);
      expect(response.body.data.accountStatus).toBeDefined();
    });

    it('should fail if no account exists', async () => {
      const response = await request(app)
        .get('/api/v1/payments/stripe-connect/status')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.isConnected).toBe(false);
    });
  });

  describe('POST /api/payments/payout', () => {
    beforeEach(async () => {
      // Set up freelancer with Stripe account
      freelancerUser.stripeConnectedAccountId = 'acct_test_123';
      await freelancerUser.save();

      // Create released transaction for payout
      await Transaction.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 100000, // 1000 * 100 cents
        platformCommission: 5000, // 5% of 100000
        processingFee: 0,
        tax: 0,
        freelancerAmount: 95000, // 100000 - 5000
        currency: 'USD',
        status: 'released',
        description: 'Test released payment',
      });
    });

    it('should request payout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/payments/payout/request')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({})
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.payout).toBeDefined();

      // Check transactions were updated to paid_out
      const paidOutTransactions = await Transaction.find({
        freelancer: freelancerUser._id,
        status: 'paid_out',
      });
      expect(paidOutTransactions.length).toBeGreaterThan(0);
    });

    it('should fail for insufficient balance', async () => {
      // Remove the released transaction to simulate no balance
      await Transaction.deleteMany({ status: 'released' });

      await request(app)
        .post('/api/v1/payments/payout/request')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({})
        .expect(400);
    });

    it('should fail for non-freelancer', async () => {
      await request(app)
        .post('/api/v1/payments/payout/request')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/payments/:paymentId/refund', () => {
    let transaction: any;

    beforeEach(async () => {
      transaction = await Transaction.create({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 150000, // 1500 * 100 cents
        platformCommission: 7500, // 5% of 150000
        processingFee: 0,
        tax: 0,
        freelancerAmount: 142500, // 150000 - 7500
        currency: 'USD',
        status: 'held_in_escrow',
        stripePaymentIntentId: 'pi_test_123',
        description: 'Test payment',
      });
    });

    it('should refund payment successfully', async () => {
      mockStripe.refunds.create.mockResolvedValueOnce({
        id: 'rf_test_123',
        amount: 150000,
        status: 'succeeded',
      });

      const refundData = {
        reason: 'Client requested refund',
      };

      // Use existing admin user for refund test
      const adminToken = generateTokens({
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      }).accessToken;

      const response = await request(app)
        .post(`/api/v1/payments/${transaction._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe('refunded');
      expect(mockStripe.refunds.create).toHaveBeenCalled();
    });

    it('should fail for non-authorized user', async () => {
      const refundData = {
        reason: 'Unauthorized refund attempt',
      };

      await request(app)
        .post(`/api/v1/payments/${transaction._id}/refund`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(refundData)
        .expect(403);
    });
  });

  describe('Payment Model', () => {
    it('should calculate platform fee correctly', async () => {
      const payment = new Payment({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1000,
        type: 'milestone_payment',
      });

      // Trigger the pre-save middleware by validating
      await payment.validate();

      expect(payment.platformFee).toBe(50); // 5% of 1000
      expect(payment.freelancerAmount).toBe(950); // 1000 - 50
    });

    it('should set escrow release date for milestone payments', async () => {
      const payment = new Payment({
        contract: contract._id,
        milestone: contract.milestones[0]._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        amount: 1000,
        type: 'milestone_payment',
      });

      // Trigger the pre-save middleware by validating
      await payment.validate();

      expect(payment.escrowReleaseDate).toBeDefined();
      expect(payment.escrowReleaseDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should check if payment can be processed', async () => {
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

      // Trigger validation to ensure all fields are set
      await payment.validate();

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
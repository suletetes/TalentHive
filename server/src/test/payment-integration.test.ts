/**
 * Payment System Integration Tests
 * Tests the complete payment flow from intent creation to escrow release
 */

import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Contract } from '../models/Contract';
import { Transaction } from '../models/Transaction';
import { PlatformSettings } from '../models/PlatformSettings';
import { connectDB, disconnectDB } from '../config/database';
import { generateToken } from '../utils/jwt';

describe('Payment System Integration', () => {
  let clientUser: any;
  let freelancerUser: any;
  let project: any;
  let proposal: any;
  let contract: any;
  let clientToken: string;
  let freelancerToken: string;
  let platformSettings: any;

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
    await Transaction.deleteMany({});
    await PlatformSettings.deleteMany({});

    // Create platform settings
    platformSettings = await PlatformSettings.create({
      commissionRate: 10,
      minCommission: 0,
      maxCommission: 100000,
      paymentProcessingFee: 2.9,
      currency: 'USD',
      taxRate: 0,
      withdrawalMinAmount: 1000,
      withdrawalFee: 0,
      escrowHoldDays: 7,
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

    // Create test project
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

    // Create test proposal
    proposal = await Proposal.create({
      project: project._id,
      freelancer: freelancerUser._id,
      coverLetter: 'This is a test proposal with sufficient length to meet the minimum requirement of 50 characters for the cover letter field.',
      bidAmount: 1500,
      timeline: { duration: 10, unit: 'days' },
      status: 'accepted',
    });

    // Create test contract with milestones
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

  describe('Payment Intent Creation', () => {
    it('should create payment intent successfully', async () => {
      const milestoneId = contract.milestones[0]._id;

      const response = await request(app)
        .post('/api/transactions/payment-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: contract._id.toString(),
          milestoneId: milestoneId.toString(),
          amount: 1500,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.transaction).toBeDefined();
      expect(response.body.data.clientSecret).toBeDefined();
      expect(response.body.data.transaction.status).toBe('pending');
      expect(response.body.data.transaction.amount).toBe(1500);
    });

    it('should fail for non-client users', async () => {
      const milestoneId = contract.milestones[0]._id;

      await request(app)
        .post('/api/transactions/payment-intent')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          contractId: contract._id.toString(),
          milestoneId: milestoneId.toString(),
          amount: 1500,
        })
        .expect(403);
    });

    it('should fail for non-approved milestone', async () => {
      // Update milestone status
      contract.milestones[0].status = 'pending';
      await contract.save();

      const milestoneId = contract.milestones[0]._id;

      await request(app)
        .post('/api/transactions/payment-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: contract._id.toString(),
          milestoneId: milestoneId.toString(),
          amount: 1500,
        })
        .expect(400);
    });
  });

  describe('Payment Confirmation', () => {
    let transaction: any;

    beforeEach(async () => {
      // Create a transaction first
      const response = await request(app)
        .post('/api/transactions/payment-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: contract._id.toString(),
          milestoneId: contract.milestones[0]._id.toString(),
          amount: 1500,
        });

      transaction = response.body.data.transaction;
    });

    it('should confirm payment successfully', async () => {
      const response = await request(app)
        .post('/api/transactions/confirm')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          paymentIntentId: transaction.stripePaymentIntentId,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe('held_in_escrow');
    });
  });

  describe('Transaction History', () => {
    beforeEach(async () => {
      // Create a transaction
      await request(app)
        .post('/api/transactions/payment-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: contract._id.toString(),
          milestoneId: contract.milestones[0]._id.toString(),
          amount: 1500,
        });
    });

    it('should get transaction history for client', async () => {
      const response = await request(app)
        .get('/api/transactions/history')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get transaction history for freelancer', async () => {
      const response = await request(app)
        .get('/api/transactions/history')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Fee Calculation', () => {
    it('should calculate fees correctly', async () => {
      const response = await request(app)
        .post('/api/transactions/calculate-fees')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          amount: 1000,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.amount).toBe(1000);
      expect(response.body.data.commission).toBe(100); // 10% of 1000
      expect(response.body.data.freelancerAmount).toBeLessThan(1000);
    });

    it('should apply minimum commission if needed', async () => {
      // Update settings to have a high minimum commission
      await PlatformSettings.updateOne(
        { _id: platformSettings._id },
        { minCommission: 500 }
      );

      const response = await request(app)
        .post('/api/transactions/calculate-fees')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          amount: 1000,
        })
        .expect(200);

      expect(response.body.data.commission).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Payment Flow End-to-End', () => {
    it('should complete full payment flow', async () => {
      // Step 1: Create payment intent
      const intentResponse = await request(app)
        .post('/api/transactions/payment-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: contract._id.toString(),
          milestoneId: contract.milestones[0]._id.toString(),
          amount: 1500,
        })
        .expect(200);

      const transaction = intentResponse.body.data.transaction;
      expect(transaction.status).toBe('pending');

      // Step 2: Confirm payment
      const confirmResponse = await request(app)
        .post('/api/transactions/confirm')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          paymentIntentId: transaction.stripePaymentIntentId,
        })
        .expect(200);

      expect(confirmResponse.body.data.status).toBe('held_in_escrow');

      // Step 3: Get transaction history
      const historyResponse = await request(app)
        .get('/api/transactions/history')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(historyResponse.body.data.length).toBeGreaterThan(0);
      const savedTransaction = historyResponse.body.data[0];
      expect(savedTransaction.status).toBe('held_in_escrow');
    });
  });
});

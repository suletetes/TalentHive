import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Contract } from '../models/Contract';
import { connectDB, disconnectDB } from '../config/database';
import { generateToken } from '../utils/jwt';

describe('Contract System', () => {
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
    });

    // Create test project
    project = await Project.create({
      title: 'Test Project',
      description: 'A test project for contract testing',
      client: clientUser._id,
      budget: {
        type: 'fixed',
        min: 1000,
        max: 2000,
      },
      timeline: {
        duration: 2,
        unit: 'weeks',
      },
      skills: ['JavaScript', 'React'],
      category: 'Web Development',
      status: 'open',
    });

    // Create accepted proposal
    proposal = await Proposal.create({
      project: project._id,
      freelancer: freelancerUser._id,
      coverLetter: 'I am very interested in this project and have the required skills.',
      bidAmount: 1500,
      timeline: {
        duration: 10,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Initial Setup',
          description: 'Set up project structure',
          amount: 500,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Feature Development',
          description: 'Implement main features',
          amount: 1000,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      ],
      status: 'accepted',
      submittedAt: new Date(),
    });

    // Generate tokens
    clientToken = generateToken(clientUser._id);
    freelancerToken = generateToken(freelancerUser._id);
  });

  describe('POST /api/contracts/proposal/:proposalId', () => {
    it('should create a contract from accepted proposal', async () => {
      const contractData = {
        title: 'Contract for Test Project',
        description: 'This contract outlines the terms for the test project.',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        terms: {
          paymentTerms: 'Payment upon milestone completion',
          cancellationPolicy: '7 days notice required',
          intellectualProperty: 'Client owns all work product',
          confidentiality: 'Both parties maintain confidentiality',
          disputeResolution: 'Platform dispute resolution process',
        },
      };

      const response = await request(app)
        .post(`/api/contracts/proposal/${proposal._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(contractData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contract).toBeDefined();
      expect(response.body.data.contract.title).toBe(contractData.title);
      expect(response.body.data.contract.totalAmount).toBe(proposal.bidAmount);
      expect(response.body.data.contract.status).toBe('draft');
      expect(response.body.data.contract.milestones).toHaveLength(2);
    });

    it('should fail for non-accepted proposal', async () => {
      proposal.status = 'submitted';
      await proposal.save();

      const contractData = {
        title: 'Contract for Test Project',
        description: 'This contract outlines the terms for the test project.',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app)
        .post(`/api/contracts/proposal/${proposal._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(contractData)
        .expect(400);
    });

    it('should fail for non-project owner', async () => {
      const contractData = {
        title: 'Contract for Test Project',
        description: 'This contract outlines the terms for the test project.',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app)
        .post(`/api/contracts/proposal/${proposal._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(contractData)
        .expect(403);
    });
  });

  describe('GET /api/contracts/my', () => {
    beforeEach(async () => {
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
            amount: 750,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
          },
          {
            title: 'Milestone 2',
            description: 'Second milestone',
            amount: 750,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending',
          },
        ],
        terms: {
          paymentTerms: 'Payment upon completion',
          cancellationPolicy: '7 days notice',
          intellectualProperty: 'Client owns work',
          confidentiality: 'Maintain confidentiality',
          disputeResolution: 'Platform resolution',
        },
        status: 'draft',
      });
    });

    it('should get contracts for client', async () => {
      const response = await request(app)
        .get('/api/contracts/my?role=client')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contracts).toHaveLength(1);
      expect(response.body.data.contracts[0].client).toBeDefined();
    });

    it('should get contracts for freelancer', async () => {
      const response = await request(app)
        .get('/api/contracts/my?role=freelancer')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contracts).toHaveLength(1);
      expect(response.body.data.contracts[0].freelancer).toBeDefined();
    });

    it('should filter contracts by status', async () => {
      const response = await request(app)
        .get('/api/contracts/my?status=draft')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.contracts).toHaveLength(1);
      expect(response.body.data.contracts[0].status).toBe('draft');
    });
  });

  describe('POST /api/contracts/:id/sign', () => {
    beforeEach(async () => {
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
            status: 'pending',
          },
        ],
        terms: {
          paymentTerms: 'Payment upon completion',
          cancellationPolicy: '7 days notice',
          intellectualProperty: 'Client owns work',
          confidentiality: 'Maintain confidentiality',
          disputeResolution: 'Platform resolution',
        },
        status: 'draft',
      });
    });

    it('should allow client to sign contract', async () => {
      const response = await request(app)
        .post(`/api/contracts/${contract._id}/sign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contract.signatures).toHaveLength(1);
      expect(response.body.data.isFullySigned).toBe(false);
    });

    it('should activate contract when both parties sign', async () => {
      // Client signs first
      await request(app)
        .post(`/api/contracts/${contract._id}/sign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      // Freelancer signs second
      const response = await request(app)
        .post(`/api/contracts/${contract._id}/sign`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.data.contract.signatures).toHaveLength(2);
      expect(response.body.data.isFullySigned).toBe(true);
      expect(response.body.data.contract.status).toBe('active');
    });

    it('should prevent duplicate signatures', async () => {
      // Sign once
      await request(app)
        .post(`/api/contracts/${contract._id}/sign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      // Try to sign again
      await request(app)
        .post(`/api/contracts/${contract._id}/sign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);
    });
  });

  describe('Milestone Management', () => {
    beforeEach(async () => {
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
            status: 'pending',
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
        signatures: [
          {
            signedBy: clientUser._id,
            signedAt: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            signatureHash: 'test-hash-1',
          },
          {
            signedBy: freelancerUser._id,
            signedAt: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            signatureHash: 'test-hash-2',
          },
        ],
      });
    });

    describe('POST /api/contracts/:id/milestones/:milestoneId/submit', () => {
      it('should allow freelancer to submit milestone', async () => {
        const milestoneId = contract.milestones[0]._id;
        const submissionData = {
          deliverables: [
            {
              title: 'Project Files',
              description: 'Completed project files',
              type: 'file',
              content: 'https://example.com/files.zip',
            },
          ],
          freelancerNotes: 'Milestone completed as requested',
        };

        const response = await request(app)
          .post(`/api/contracts/${contract._id}/milestones/${milestoneId}/submit`)
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send(submissionData)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.milestone.status).toBe('submitted');
        expect(response.body.data.milestone.deliverables).toHaveLength(1);
      });

      it('should fail for non-freelancer', async () => {
        const milestoneId = contract.milestones[0]._id;
        const submissionData = {
          deliverables: [],
          freelancerNotes: 'Test submission',
        };

        await request(app)
          .post(`/api/contracts/${contract._id}/milestones/${milestoneId}/submit`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send(submissionData)
          .expect(403);
      });
    });

    describe('POST /api/contracts/:id/milestones/:milestoneId/approve', () => {
      beforeEach(async () => {
        // Submit milestone first
        const milestone = contract.milestones[0];
        milestone.status = 'submitted';
        milestone.submittedAt = new Date();
        await contract.save();
      });

      it('should allow client to approve milestone', async () => {
        const milestoneId = contract.milestones[0]._id;
        const approvalData = {
          clientFeedback: 'Great work! Milestone approved.',
        };

        const response = await request(app)
          .post(`/api/contracts/${contract._id}/milestones/${milestoneId}/approve`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send(approvalData)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.milestone.status).toBe('approved');
        expect(response.body.data.milestone.clientFeedback).toBe(approvalData.clientFeedback);
      });

      it('should fail for non-client', async () => {
        const milestoneId = contract.milestones[0]._id;
        const approvalData = {
          clientFeedback: 'Test approval',
        };

        await request(app)
          .post(`/api/contracts/${contract._id}/milestones/${milestoneId}/approve`)
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send(approvalData)
          .expect(403);
      });
    });

    describe('POST /api/contracts/:id/milestones/:milestoneId/reject', () => {
      beforeEach(async () => {
        // Submit milestone first
        const milestone = contract.milestones[0];
        milestone.status = 'submitted';
        milestone.submittedAt = new Date();
        await contract.save();
      });

      it('should allow client to reject milestone', async () => {
        const milestoneId = contract.milestones[0]._id;
        const rejectionData = {
          clientFeedback: 'Please revise according to requirements.',
        };

        const response = await request(app)
          .post(`/api/contracts/${contract._id}/milestones/${milestoneId}/reject`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send(rejectionData)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.milestone.status).toBe('rejected');
        expect(response.body.data.milestone.clientFeedback).toBe(rejectionData.clientFeedback);
      });
    });
  });

  describe('Contract Amendments', () => {
    beforeEach(async () => {
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
            status: 'pending',
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
    });

    describe('POST /api/contracts/:id/amendments', () => {
      it('should allow proposing timeline amendment', async () => {
        const amendmentData = {
          type: 'timeline_change',
          description: 'Request to extend deadline by one week',
          changes: {
            endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          reason: 'Additional requirements discovered during development',
        };

        const response = await request(app)
          .post(`/api/contracts/${contract._id}/amendments`)
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send(amendmentData)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.amendment.type).toBe('timeline_change');
        expect(response.body.data.amendment.status).toBe('pending');
      });

      it('should fail for non-participants', async () => {
        const otherUser = await User.create({
          email: 'other@test.com',
          password: 'password123',
          role: 'client',
          profile: { firstName: 'Other', lastName: 'User' },
          isEmailVerified: true,
        });

        const otherToken = generateToken(otherUser._id);

        const amendmentData = {
          type: 'timeline_change',
          description: 'Test amendment',
          changes: { endDate: new Date().toISOString() },
          reason: 'Test reason',
        };

        await request(app)
          .post(`/api/contracts/${contract._id}/amendments`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send(amendmentData)
          .expect(403);
      });
    });

    describe('POST /api/contracts/:id/amendments/:amendmentId/respond', () => {
      let amendmentId: string;

      beforeEach(async () => {
        // Add an amendment
        contract.amendments.push({
          type: 'timeline_change',
          description: 'Request to extend deadline',
          proposedBy: freelancerUser._id,
          changes: { endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
          reason: 'Additional requirements',
          status: 'pending',
        } as any);
        await contract.save();
        amendmentId = contract.amendments[0]._id.toString();
      });

      it('should allow accepting amendment', async () => {
        const responseData = {
          status: 'accepted',
          responseNotes: 'Extension approved due to scope changes',
        };

        const response = await request(app)
          .post(`/api/contracts/${contract._id}/amendments/${amendmentId}/respond`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send(responseData)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.amendment.status).toBe('accepted');
      });

      it('should allow rejecting amendment', async () => {
        const responseData = {
          status: 'rejected',
          responseNotes: 'Timeline must be maintained as agreed',
        };

        const response = await request(app)
          .post(`/api/contracts/${contract._id}/amendments/${amendmentId}/respond`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send(responseData)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.amendment.status).toBe('rejected');
      });
    });
  });

  describe('Contract Model Validation', () => {
    it('should validate milestone amounts equal total amount', async () => {
      const contractData = {
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
            amount: 1000, // Total: 1000, but contract total is 1500
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending',
          },
        ],
        terms: {
          paymentTerms: 'Payment upon completion',
          cancellationPolicy: '7 days notice',
          intellectualProperty: 'Client owns work',
          confidentiality: 'Maintain confidentiality',
          disputeResolution: 'Platform resolution',
        },
      };

      try {
        await Contract.create(contractData);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Total milestone amount must equal contract total amount');
      }
    });

    it('should validate end date after start date', async () => {
      const contractData = {
        project: project._id,
        client: clientUser._id,
        freelancer: freelancerUser._id,
        proposal: proposal._id,
        title: 'Test Contract',
        description: 'A test contract',
        totalAmount: 1500,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(), // End date before start date
        milestones: [
          {
            title: 'Milestone 1',
            description: 'First milestone',
            amount: 1500,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending',
          },
        ],
        terms: {
          paymentTerms: 'Payment upon completion',
          cancellationPolicy: '7 days notice',
          intellectualProperty: 'Client owns work',
          confidentiality: 'Maintain confidentiality',
          disputeResolution: 'Platform resolution',
        },
      };

      try {
        await Contract.create(contractData);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('End date must be after start date');
      }
    });
  });

  describe('Contract Virtual Properties', () => {
    beforeEach(async () => {
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
            amount: 750,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'paid',
          },
          {
            title: 'Milestone 2',
            description: 'Second milestone',
            amount: 750,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending',
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
    });

    it('should calculate progress correctly', () => {
      expect(contract.progress).toBe(50); // 1 of 2 milestones completed
    });

    it('should calculate total paid amount', () => {
      expect(contract.totalPaid).toBe(750); // Only paid milestone
    });

    it('should calculate remaining amount', () => {
      expect(contract.remainingAmount).toBe(750); // 1500 - 750
    });

    it('should identify overdue milestones', () => {
      // Set milestone 2 to be overdue
      contract.milestones[1].dueDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(contract.overdueMilestones).toHaveLength(1);
    });

    it('should identify next milestone', () => {
      expect(contract.nextMilestone).toBeDefined();
      expect(contract.nextMilestone.title).toBe('Milestone 2');
    });
  });
});
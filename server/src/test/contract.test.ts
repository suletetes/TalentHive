import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Contract } from '../models/Contract';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
// Database connection managed by global test setup
import { generateTokens } from '../utils/jwt';

describe('Contract New Features', () => {
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

  // Database connection managed by global test setup

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Project.deleteMany({});
    await Proposal.deleteMany({});
    await Contract.deleteMany({});
    await Category.deleteMany({});
    await Skill.deleteMany({});

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
      skills: [jsSkill._id, reactSkill._id],
      category: category._id,
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

    // Create active contract
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

  describe('POST /api/v1/contracts/:id/pause', () => {
    it('should allow client to pause contract', async () => {
      const response = await request(app)
        .post(`/api/v1/contracts/${contract._id}/pause`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reason: 'Temporary pause for review' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contract.status).toBe('paused');
    });

    it('should fail for non-participants', async () => {
      const otherUser = await User.create({
        email: 'other@test.com',
        password: 'password123',
        role: 'client',
        profile: { firstName: 'Other', lastName: 'User' },
        isVerified: true,
      });

      const otherToken = generateTokens({
        userId: otherUser._id.toString(),
        email: otherUser.email,
        role: otherUser.role,
      }).accessToken;

      await request(app)
        .post(`/api/v1/contracts/${contract._id}/pause`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ reason: 'Test' })
        .expect(403);
    });
  });

  describe('POST /api/v1/contracts/:id/resume', () => {
    beforeEach(async () => {
      contract.status = 'paused';
      await contract.save();
    });

    it('should allow client to resume paused contract', async () => {
      const response = await request(app)
        .post(`/api/v1/contracts/${contract._id}/resume`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contract.status).toBe('active');
    });

    it('should fail if contract is not paused', async () => {
      contract.status = 'active';
      await contract.save();

      await request(app)
        .post(`/api/v1/contracts/${contract._id}/resume`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);
    });
  });

  describe('POST /api/v1/contracts/:id/dispute', () => {
    it('should allow client to create dispute', async () => {
      const response = await request(app)
        .post(`/api/v1/contracts/${contract._id}/dispute`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'Work quality issues',
          description: 'The delivered work does not meet the agreed specifications',
          evidence: 'Screenshots and documentation provided',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contract.status).toBe('disputed');
    });

    it('should allow freelancer to create dispute', async () => {
      const response = await request(app)
        .post(`/api/v1/contracts/${contract._id}/dispute`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          reason: 'Payment not received',
          description: 'Client has not released payment after milestone approval',
          evidence: 'Milestone approval timestamp',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.contract.status).toBe('disputed');
    });

    it('should fail for non-participants', async () => {
      const otherUser = await User.create({
        email: 'other@test.com',
        password: 'password123',
        role: 'client',
        profile: { firstName: 'Other', lastName: 'User' },
        isVerified: true,
      });

      const otherToken = generateTokens({
        userId: otherUser._id.toString(),
        email: otherUser.email,
        role: otherUser.role,
      }).accessToken;

      await request(app)
        .post(`/api/v1/contracts/${contract._id}/dispute`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          reason: 'Test',
          description: 'Test dispute',
        })
        .expect(403);
    });

    it('should fail if contract is already disputed', async () => {
      contract.status = 'disputed';
      await contract.save();

      await request(app)
        .post(`/api/v1/contracts/${contract._id}/dispute`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'Another issue',
          description: 'Another dispute attempt',
        })
        .expect(400);
    });
  });

  describe('Contract Status Transitions', () => {
    it('should track all status changes in amendments', async () => {
      // Pause contract
      await request(app)
        .post(`/api/v1/contracts/${contract._id}/pause`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reason: 'Temporary pause' })
        .expect(200);

      // Resume contract
      await request(app)
        .post(`/api/v1/contracts/${contract._id}/resume`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      // Get contract to verify amendments
      const response = await request(app)
        .get(`/api/v1/contracts/${contract._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      const updatedContract = response.body.data.contract;
      expect(updatedContract.amendments.length).toBeGreaterThanOrEqual(2);
      
      // Check that amendments record the status changes
      const pauseAmendment = updatedContract.amendments.find((a: any) => a.changes.status === 'paused');
      const resumeAmendment = updatedContract.amendments.find((a: any) => a.changes.status === 'active');
      
      expect(pauseAmendment).toBeDefined();
      expect(resumeAmendment).toBeDefined();
    });
  });
});

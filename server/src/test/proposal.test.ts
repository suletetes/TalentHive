import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
// Database connection managed by global test setup
import { generateTokens } from '../utils/jwt';

describe('Proposal System', () => {
  let clientUser: any;
  let freelancerUser: any;
  let adminUser: any;
  let project: any;
  let clientToken: string;
  let freelancerToken: string;
  let adminToken: string;
  let category: any;
  let skills: any[];

  // Database connection managed by global test setup

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Project.deleteMany({});
    await Proposal.deleteMany({});
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
        experience: 'intermediate',
        availability: {
          status: 'available',
        },
        portfolio: [],
        certifications: [],
      },
      rating: 4.5,
      isVerified: true,
      isActive: true,
    });

    // Create category and skills
    category = await Category.create({
      name: 'Web Development',
      slug: 'web-development',
      description: 'Web development projects',
      createdBy: adminUser._id,
    });

    const skillsData = [
      { name: 'JavaScript', slug: 'javascript' },
      { name: 'React', slug: 'react' }
    ];
    skills = await Promise.all(
      skillsData.map(skillData =>
        Skill.create({
          name: skillData.name,
          slug: skillData.slug,
          category: category._id,
          createdBy: adminUser._id,
        })
      )
    );

    // Create test project
    project = await Project.create({
      title: 'Test Project',
      description: 'A test project for proposal testing',
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
      skills: skills.map(skill => skill._id),
      category: category._id,
      status: 'open',
    });

    // Generate tokens
    const clientTokens = generateTokens({ 
      userId: clientUser._id.toString(), 
      email: clientUser.email, 
      role: clientUser.role 
    });
    const freelancerTokens = generateTokens({ 
      userId: freelancerUser._id.toString(), 
      email: freelancerUser.email, 
      role: freelancerUser.role 
    });
    const adminTokens = generateTokens({ 
      userId: adminUser._id.toString(), 
      email: adminUser.email, 
      role: adminUser.role 
    });
    
    clientToken = clientTokens.accessToken;
    freelancerToken = freelancerTokens.accessToken;
    adminToken = adminTokens.accessToken;
  });

  describe('POST /api/proposals/project/:projectId', () => {
    it('should create a proposal successfully', async () => {
      const proposalData = {
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully. I have 5 years of experience in web development.',
        bidAmount: 1500,
        timeline: {
          duration: 10,
          unit: 'days',
        },
        milestones: [
          {
            title: 'Initial Setup',
            description: 'Set up project structure and basic components',
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
      };

      const response = await request(app)
        .post(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.proposal).toBeDefined();
      expect(response.body.data.proposal.coverLetter).toBe(proposalData.coverLetter);
      expect(response.body.data.proposal.bidAmount).toBe(proposalData.bidAmount);
      expect(response.body.data.proposal.status).toBe('submitted');
      expect(response.body.data.proposal.milestones).toHaveLength(2);
    });

    it('should fail with invalid cover letter', async () => {
      const proposalData = {
        coverLetter: 'Too short',
        bidAmount: 1500,
        timeline: {
          duration: 10,
          unit: 'days',
        },
      };

      await request(app)
        .post(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(400);
    });

    it('should fail when client tries to submit proposal', async () => {
      const proposalData = {
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: {
          duration: 10,
          unit: 'days',
        },
      };

      await request(app)
        .post(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(proposalData)
        .expect(403);
    });

    it('should fail when submitting duplicate proposal', async () => {
      const proposalData = {
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: {
          duration: 10,
          unit: 'days',
        },
      };

      // First submission
      await request(app)
        .post(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(201);

      // Second submission should fail
      await request(app)
        .post(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(400);
    });
  });

  describe('GET /api/proposals/project/:projectId', () => {
    beforeEach(async () => {
      // Create test proposals
      await Proposal.create({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'submitted',
        submittedAt: new Date(),
      });
    });

    it('should get proposals for project owner', async () => {
      const response = await request(app)
        .get(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.proposals).toHaveLength(1);
      expect(response.body.data.proposals[0].freelancer).toBeDefined();
    });

    it('should fail for non-project owner', async () => {
      const otherUser = await User.create({
        email: 'other@test.com',
        password: 'password123',
        role: 'client',
        profile: { firstName: 'Other', lastName: 'User' },
        isVerified: true,
      });

      const otherTokens = generateTokens({ 
        userId: otherUser._id.toString(), 
        email: otherUser.email, 
        role: otherUser.role 
      });
      const otherToken = otherTokens.accessToken;

      await request(app)
        .get(`/api/v1/proposals/project/${project._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('GET /api/proposals/my', () => {
    beforeEach(async () => {
      await Proposal.create({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'submitted',
        submittedAt: new Date(),
      });
    });

    it('should get freelancer proposals', async () => {
      const response = await request(app)
        .get('/api/v1/proposals/my')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.proposals).toHaveLength(1);
      expect(response.body.data.proposals[0].project).toBeDefined();
    });

    it('should fail for client role', async () => {
      await request(app)
        .get('/api/v1/proposals/my')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('POST /api/proposals/:id/accept', () => {
    let proposal: any;

    beforeEach(async () => {
      proposal = await Proposal.create({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'submitted',
        submittedAt: new Date(),
      });
    });

    it('should accept proposal successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/proposals/${proposal._id}/accept`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ feedback: 'Great proposal! Looking forward to working with you.' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.proposal.status).toBe('accepted');
      expect(response.body.data.proposal.clientFeedback).toBe('Great proposal! Looking forward to working with you.');

      // Check project status updated
      const updatedProject = await Project.findById(project._id);
      expect(updatedProject?.status).toBe('in_progress');
      expect(updatedProject?.selectedFreelancer?.toString()).toBe(freelancerUser._id.toString());
    });

    it('should fail for non-project owner', async () => {
      await request(app)
        .post(`/api/v1/proposals/${proposal._id}/accept`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(403);
    });

    it('should fail for non-submitted proposal', async () => {
      proposal.status = 'rejected';
      await proposal.save();

      await request(app)
        .post(`/api/v1/proposals/${proposal._id}/accept`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);
    });
  });

  describe('POST /api/proposals/:id/reject', () => {
    let proposal: any;

    beforeEach(async () => {
      proposal = await Proposal.create({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'submitted',
        submittedAt: new Date(),
      });
    });

    it('should reject proposal successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/proposals/${proposal._id}/reject`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ feedback: 'Thank you for your proposal, but we decided to go with another freelancer.' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.proposal.status).toBe('rejected');
      expect(response.body.data.proposal.clientFeedback).toBe('Thank you for your proposal, but we decided to go with another freelancer.');
    });
  });

  describe('DELETE /api/proposals/:id', () => {
    let proposal: any;

    beforeEach(async () => {
      proposal = await Proposal.create({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'submitted',
        submittedAt: new Date(),
      });
    });

    it('should withdraw proposal successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/proposals/${proposal._id}/withdraw`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');

      const updatedProposal = await Proposal.findById(proposal._id);
      expect(updatedProposal?.status).toBe('withdrawn');
    });

    it('should fail for non-proposal owner', async () => {
      await request(app)
        .patch(`/api/v1/proposals/${proposal._id}/withdraw`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should fail for accepted proposal', async () => {
      proposal.status = 'accepted';
      await proposal.save();

      await request(app)
        .patch(`/api/v1/proposals/${proposal._id}/withdraw`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(400);
    });
  });

  describe('Proposal Model Validation', () => {
    it('should validate milestone amounts equal bid amount', async () => {
      const proposalData = {
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        milestones: [
          {
            title: 'Milestone 1',
            description: 'First milestone',
            amount: 500,
            dueDate: new Date(),
          },
          {
            title: 'Milestone 2',
            description: 'Second milestone',
            amount: 500, // Total: 1000, but bid is 1500
            dueDate: new Date(),
          },
        ],
      };

      try {
        await Proposal.create(proposalData);
        throw new Error('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Total milestone amount must equal bid amount');
      }
    });

    it('should prevent duplicate proposals for same project', async () => {
      const proposalData = {
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
      };

      // Create first proposal
      await Proposal.create(proposalData);

      // Try to create duplicate
      try {
        await Proposal.create({ ...proposalData, coverLetter: 'I am very interested in this project and have the required skills to complete it successfully. This is my second attempt.' });
        throw new Error('Should have thrown duplicate key error');
      } catch (error: any) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error
      }
    });
  });

  describe('Proposal Status Workflow', () => {
    let proposal: any;

    beforeEach(async () => {
      proposal = new Proposal({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'submitted',
      });
    });

    it('should set submittedAt when status changes to submitted', async () => {
      // Create a new proposal with draft status
      const draftProposal = new Proposal({
        project: project._id,
        freelancer: freelancerUser._id,
        coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
        bidAmount: 1500,
        timeline: { duration: 10, unit: 'days' },
        status: 'draft',
      });
      
      expect(draftProposal.submittedAt).toBeUndefined();
      
      draftProposal.status = 'submitted';
      await draftProposal.save();
      
      expect(draftProposal.submittedAt).toBeDefined();
    });

    it('should set respondedAt when status changes to accepted', async () => {
      proposal.status = 'submitted';
      await proposal.save();
      
      expect(proposal.respondedAt).toBeUndefined();
      
      proposal.status = 'accepted';
      await proposal.save();
      
      expect(proposal.respondedAt).toBeDefined();
    });

    it('should check if proposal can be modified', async () => {
      proposal.status = 'draft';
      expect(proposal.canBeModified()).toBe(true);
      
      proposal.status = 'submitted';
      expect(proposal.canBeModified()).toBe(true);
      
      proposal.status = 'accepted';
      expect(proposal.canBeModified()).toBe(false);
      
      proposal.status = 'rejected';
      expect(proposal.canBeModified()).toBe(false);
    });

    it('should check if proposal can be withdrawn', async () => {
      proposal.status = 'draft';
      expect(proposal.canBeWithdrawn()).toBe(false);
      
      proposal.status = 'submitted';
      expect(proposal.canBeWithdrawn()).toBe(true);
      
      proposal.status = 'accepted';
      expect(proposal.canBeWithdrawn()).toBe(false);
    });
  });
});
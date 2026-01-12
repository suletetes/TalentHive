import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Contract } from '../models/Contract';
import { Proposal } from '../models/Proposal';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import TimeEntry from '../models/TimeEntry';
import WorkSession from '../models/WorkSession';
// Database connection managed by global test setup
import { generateTokens } from '../utils/jwt';

describe('Time Tracking System', () => {
  let clientUser: any;
  let freelancerUser: any;
  let adminUser: any;
  let project: any;
  let contract: any;
  let proposal: any;
  let category: any;
  let skills: any[];
  let clientToken: string;
  let freelancerToken: string;
  let adminToken: string;

  // Database connection managed by global test setup

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Project.deleteMany({});
    await Contract.deleteMany({});
    await Proposal.deleteMany({});
    await TimeEntry.deleteMany({});
    await WorkSession.deleteMany({});
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
        timeTracking: {
          isEnabled: true,
          screenshotFrequency: 10,
          activityMonitoring: true,
        },
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
      description: 'A test project for time tracking',
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
      status: 'in_progress',
      selectedFreelancer: freelancerUser._id,
    });

    // Create proposal
    proposal = await Proposal.create({
      project: project._id,
      freelancer: freelancerUser._id,
      coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
      bidAmount: 1500,
      timeline: { duration: 10, unit: 'days' },
      status: 'accepted',
    });

    // Create test contract
    contract = await Contract.create({
      project: project._id,
      client: clientUser._id,
      freelancer: freelancerUser._id,
      proposal: proposal._id,
      title: 'Test Contract',
      description: 'Test contract description',
      totalAmount: 1500,
      budget: {
        amount: 1500,
        type: 'fixed',
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      milestones: [
        {
          title: 'Complete Project',
          description: 'Complete all project deliverables',
          amount: 1500,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  describe('GET /api/v1/time-tracking/sessions/active', () => {
    it('should return 404 when no active session exists', async () => {
      const response = await request(app)
        .get('/api/v1/time-tracking/sessions/active')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No active session found');
    });

    it('should return active session when it exists', async () => {
      // Create an active session first
      const session = await WorkSession.create({
        freelancer: freelancerUser._id,
        project: project._id,
        contract: contract._id,
        startTime: new Date(),
        status: 'active',
      });

      const response = await request(app)
        .get('/api/v1/time-tracking/sessions/active')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session._id).toBe(session._id.toString());
    });

    it('should fail for non-freelancer users', async () => {
      await request(app)
        .get('/api/v1/time-tracking/sessions/active')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/time-tracking/sessions/start', () => {
    it('should start a new work session successfully', async () => {
      const response = await request(app)
        .post('/api/v1/time-tracking/sessions/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          contractId: contract._id,
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.status).toBe('active');
      expect(response.body.data.session.freelancer).toBe(freelancerUser._id.toString());
    });

    it('should fail when contract ID is missing', async () => {
      const response = await request(app)
        .post('/api/v1/time-tracking/sessions/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Contract ID is required');
    });

    it('should fail when freelancer already has active session', async () => {
      // Create an active session first
      await WorkSession.create({
        freelancer: freelancerUser._id,
        project: project._id,
        contract: contract._id,
        startTime: new Date(),
        status: 'active',
      });

      const response = await request(app)
        .post('/api/v1/time-tracking/sessions/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          contractId: contract._id,
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You already have an active work session');
    });

    it('should fail for non-freelancer users', async () => {
      await request(app)
        .post('/api/v1/time-tracking/sessions/start')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: contract._id,
        })
        .expect(403);
    });
  });

  describe('POST /api/v1/time-tracking/entries', () => {
    it('should create a time entry successfully', async () => {
      const response = await request(app)
        .post('/api/v1/time-tracking/entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId: project._id,
          contractId: contract._id,
          description: 'Working on feature implementation',
          duration: 3600, // 1 hour
          hourlyRate: 50,
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntry).toBeDefined();
      expect(response.body.data.timeEntry.description).toBe('Working on feature implementation');
      expect(response.body.data.timeEntry.duration).toBe(3600);
      expect(response.body.data.timeEntry.billableAmount).toBe(50); // 1 hour * $50
    });

    it('should calculate billable amount correctly', async () => {
      const response = await request(app)
        .post('/api/v1/time-tracking/entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId: project._id,
          contractId: contract._id,
          description: 'Working on bug fixes',
          duration: 7200, // 2 hours
          hourlyRate: 75,
        })
        .expect(201);

      expect(response.body.data.timeEntry.billableAmount).toBe(150); // 2 hours * $75
    });

    it('should fail for non-freelancer users', async () => {
      await request(app)
        .post('/api/v1/time-tracking/entries')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          projectId: project._id,
          contractId: contract._id,
          description: 'Working on feature',
          duration: 3600,
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/time-tracking/entries', () => {
    beforeEach(async () => {
      await TimeEntry.create([
        {
          freelancer: freelancerUser._id,
          project: project._id,
          contract: contract._id,
          startTime: new Date(),
          duration: 3600,
          description: 'Entry 1',
          status: 'approved',
          hourlyRate: 50,
          billableAmount: 50,
        },
        {
          freelancer: freelancerUser._id,
          project: project._id,
          contract: contract._id,
          startTime: new Date(),
          duration: 7200,
          description: 'Entry 2',
          status: 'submitted',
          hourlyRate: 50,
          billableAmount: 100,
        },
      ]);
    });

    it('should get time entries for freelancer', async () => {
      const response = await request(app)
        .get('/api/v1/time-tracking/entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntries.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter entries by status', async () => {
      const response = await request(app)
        .get('/api/v1/time-tracking/entries?status=approved')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntries.every((entry: any) => entry.status === 'approved')).toBe(true);
    });

    it('should get time entries for client (project owner)', async () => {
      const response = await request(app)
        .get('/api/v1/time-tracking/entries')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/time-tracking/reports', () => {
    beforeEach(async () => {
      const now = new Date();
      await TimeEntry.create([
        {
          freelancer: freelancerUser._id,
          project: project._id,
          contract: contract._id,
          startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          duration: 3600,
          description: 'Report Entry 1',
          status: 'approved',
          hourlyRate: 50,
          billableAmount: 50,
        },
        {
          freelancer: freelancerUser._id,
          project: project._id,
          contract: contract._id,
          startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          duration: 7200,
          description: 'Report Entry 2',
          status: 'approved',
          hourlyRate: 50,
          billableAmount: 100,
        },
      ]);
    });

    it('should generate time report for freelancer', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/time-tracking/reports?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.report).toHaveProperty('totalHours');
      expect(response.body.data.report).toHaveProperty('totalAmount');
      expect(response.body.data.report.totalAmount).toBe(150); // $50 + $100
      expect(response.body.data.report.totalHours).toBe(3); // 1 + 2 hours
    });

    it('should generate time report for client', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/time-tracking/reports?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.report).toHaveProperty('totalHours');
      expect(response.body.data.report).toHaveProperty('totalAmount');
    });
  });
});
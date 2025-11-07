import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import User from '../models/User';
import Project from '../models/Project';
import Contract from '../models/Contract';
import TimeEntry from '../models/TimeEntry';
import WorkSession from '../models/WorkSession';
import { generateToken } from '../utils/jwt';

describe('Time Tracking API', () => {
  let freelancerToken: string;
  let clientToken: string;
  let freelancerId: string;
  let clientId: string;
  let projectId: string;
  let contractId: string;

  beforeAll(async () => {
    // Create test users
    const freelancer = await User.create({
      email: 'freelancer@test.com',
      password: 'Test123!',
      firstName: 'John',
      lastName: 'Freelancer',
      role: 'freelancer',
      isEmailVerified: true,
    });
    freelancerId = freelancer._id.toString();
    freelancerToken = generateToken(freelancerId);

    const client = await User.create({
      email: 'client@test.com',
      password: 'Test123!',
      firstName: 'Jane',
      lastName: 'Client',
      role: 'client',
      isEmailVerified: true,
    });
    clientId = client._id.toString();
    clientToken = generateToken(clientId);

    // Create test project
    const project = await Project.create({
      title: 'Test Project',
      description: 'Test project description',
      client: clientId,
      budget: { min: 1000, max: 5000 },
      duration: 30,
      skills: ['JavaScript', 'React'],
      status: 'active',
    });
    projectId = project._id.toString();

    // Create test contract
    const contract = await Contract.create({
      project: projectId,
      client: clientId,
      freelancer: freelancerId,
      title: 'Test Contract',
      description: 'Test contract description',
      amount: 2000,
      hourlyRate: 50,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    contractId = contract._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Contract.deleteMany({});
    await TimeEntry.deleteMany({});
    await WorkSession.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/time-tracking/sessions/start', () => {
    it('should start a new work session', async () => {
      const response = await request(app)
        .post('/api/time-tracking/sessions/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId,
          contractId,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session).toHaveProperty('_id');
      expect(response.body.data.session.status).toBe('active');
    });

    it('should not allow starting multiple sessions', async () => {
      const response = await request(app)
        .post('/api/time-tracking/sessions/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId,
          contractId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('active work session');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/time-tracking/sessions/start')
        .send({
          projectId,
          contractId,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/time-tracking/entries', () => {
    it('should create a time entry', async () => {
      const response = await request(app)
        .post('/api/time-tracking/entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId,
          contractId,
          description: 'Working on feature X',
          duration: 3600, // 1 hour
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntry).toHaveProperty('_id');
      expect(response.body.data.timeEntry.description).toBe('Working on feature X');
      expect(response.body.data.timeEntry.duration).toBe(3600);
    });

    it('should calculate billable amount', async () => {
      const response = await request(app)
        .post('/api/time-tracking/entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId,
          contractId,
          description: 'Working on feature Y',
          duration: 7200, // 2 hours
          hourlyRate: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.timeEntry.billableAmount).toBe(100); // 2 hours * $50
    });
  });

  describe('POST /api/time-tracking/entries/submit', () => {
    let entryId: string;

    beforeEach(async () => {
      const entry = await TimeEntry.create({
        freelancer: freelancerId,
        project: projectId,
        contract: contractId,
        startTime: new Date(),
        duration: 3600,
        description: 'Test entry',
        status: 'stopped',
        hourlyRate: 50,
      });
      entryId = entry._id.toString();
    });

    it('should submit time entries for approval', async () => {
      const response = await request(app)
        .post('/api/time-tracking/entries/submit')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          entryIds: [entryId],
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      const entry = await TimeEntry.findById(entryId);
      expect(entry?.status).toBe('submitted');
      expect(entry?.submittedAt).toBeDefined();
    });
  });

  describe('PATCH /api/time-tracking/entries/:entryId/review', () => {
    let entryId: string;

    beforeEach(async () => {
      const entry = await TimeEntry.create({
        freelancer: freelancerId,
        project: projectId,
        contract: contractId,
        startTime: new Date(),
        duration: 3600,
        description: 'Test entry',
        status: 'submitted',
        hourlyRate: 50,
      });
      entryId = entry._id.toString();
    });

    it('should approve time entry', async () => {
      const response = await request(app)
        .patch(`/api/time-tracking/entries/${entryId}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          status: 'approved',
          reviewNotes: 'Looks good',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntry.status).toBe('approved');
      expect(response.body.data.timeEntry.reviewNotes).toBe('Looks good');
    });

    it('should reject time entry', async () => {
      const response = await request(app)
        .patch(`/api/time-tracking/entries/${entryId}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          status: 'rejected',
          reviewNotes: 'Needs more details',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.timeEntry.status).toBe('rejected');
    });
  });

  describe('GET /api/time-tracking/entries', () => {
    beforeEach(async () => {
      await TimeEntry.create([
        {
          freelancer: freelancerId,
          project: projectId,
          contract: contractId,
          startTime: new Date(),
          duration: 3600,
          description: 'Entry 1',
          status: 'approved',
          hourlyRate: 50,
        },
        {
          freelancer: freelancerId,
          project: projectId,
          contract: contractId,
          startTime: new Date(),
          duration: 7200,
          description: 'Entry 2',
          status: 'submitted',
          hourlyRate: 50,
        },
      ]);
    });

    it('should get time entries for freelancer', async () => {
      const response = await request(app)
        .get('/api/time-tracking/entries')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.timeEntries.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/time-tracking/entries?status=approved')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.timeEntries.every((e: any) => e.status === 'approved')).toBe(true);
    });
  });

  describe('GET /api/time-tracking/reports', () => {
    beforeEach(async () => {
      await TimeEntry.create([
        {
          freelancer: freelancerId,
          project: projectId,
          contract: contractId,
          startTime: new Date(),
          duration: 3600,
          description: 'Entry 1',
          status: 'approved',
          hourlyRate: 50,
          billableAmount: 50,
        },
        {
          freelancer: freelancerId,
          project: projectId,
          contract: contractId,
          startTime: new Date(),
          duration: 7200,
          description: 'Entry 2',
          status: 'approved',
          hourlyRate: 50,
          billableAmount: 100,
        },
      ]);
    });

    it('should generate time report', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/time-tracking/reports?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.report).toHaveProperty('totalHours');
      expect(response.body.data.report).toHaveProperty('totalAmount');
      expect(response.body.data.report.totalAmount).toBe(150);
    });
  });
});

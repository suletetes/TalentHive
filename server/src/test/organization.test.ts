import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import User from '../models/User';
import { Organization } from '../models/Organization';
import BudgetApproval from '../models/BudgetApproval';
import { generateToken } from '../utils/jwt';

describe('Organization API', () => {
  let ownerToken: string;
  let memberToken: string;
  let ownerId: string;
  let memberId: string;
  let organizationId: string;

  beforeAll(async () => {
    // Create test users
    const owner = await User.create({
      email: 'owner@test.com',
      password: 'Test123!',
      firstName: 'John',
      lastName: 'Owner',
      role: 'client',
      isEmailVerified: true,
    });
    ownerId = owner._id.toString();
    ownerToken = generateToken(ownerId);

    const member = await User.create({
      email: 'member@test.com',
      password: 'Test123!',
      firstName: 'Jane',
      lastName: 'Member',
      role: 'client',
      isEmailVerified: true,
    });
    memberId = member._id.toString();
    memberToken = generateToken(memberId);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
    await BudgetApproval.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/organizations', () => {
    it('should create a new organization', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Organization',
          description: 'Test description',
          industry: 'Technology',
          size: '11-50',
          website: 'https://test.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.organization).toHaveProperty('_id');
      expect(response.body.data.organization.name).toBe('Test Organization');
      
      organizationId = response.body.data.organization._id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .send({
          name: 'Test Organization',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/organizations/:organizationId', () => {
    it('should get organization details', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.organization.name).toBe('Test Organization');
    });

    it('should not allow non-members to view organization', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/organizations/:organizationId/members/invite', () => {
    it('should invite a member to organization', async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/members/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'member@test.com',
          role: 'member',
          spendingLimit: 5000,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not allow duplicate members', async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/members/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'member@test.com',
          role: 'member',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/organizations/:organizationId/members/:memberId/role', () => {
    it('should update member role', async () => {
      const response = await request(app)
        .patch(`/api/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'admin',
          spendingLimit: 10000,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('Budget Approval Workflow', () => {
    let approvalId: string;

    it('should create budget approval request', async () => {
      const response = await request(app)
        .post('/api/organizations/budget-approvals')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          amount: 2000,
          description: 'New project budget',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.approval.status).toBe('pending');
      
      approvalId = response.body.data.approval._id;
    });

    it('should get budget approvals', async () => {
      const response = await request(app)
        .get('/api/organizations/budget-approvals')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.approvals.length).toBeGreaterThan(0);
    });

    it('should approve budget request', async () => {
      const response = await request(app)
        .patch(`/api/organizations/budget-approvals/${approvalId}/review`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'approved',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.approval.status).toBe('approved');
    });

    it('should reject budget request', async () => {
      // Create another request
      const createResponse = await request(app)
        .post('/api/organizations/budget-approvals')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          amount: 5000,
          description: 'Another project',
        });

      const newApprovalId = createResponse.body.data.approval._id;

      const response = await request(app)
        .patch(`/api/organizations/budget-approvals/${newApprovalId}/review`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'rejected',
          rejectionReason: 'Budget exceeded',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.approval.status).toBe('rejected');
      expect(response.body.data.approval.rejectionReason).toBe('Budget exceeded');
    });
  });

  describe('DELETE /api/organizations/:organizationId/members/:memberId', () => {
    it('should remove member from organization', async () => {
      const response = await request(app)
        .delete(`/api/organizations/${organizationId}/members/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not allow removing owner', async () => {
      const response = await request(app)
        .delete(`/api/organizations/${organizationId}/members/${ownerId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/organizations/my-organizations', () => {
    it('should get user organizations', async () => {
      const response = await request(app)
        .get('/api/organizations/my-organizations')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.organizations.length).toBeGreaterThan(0);
    });
  });
});

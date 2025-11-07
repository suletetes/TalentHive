import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import User from '../models/User';
import ServicePackage from '../models/ServicePackage';
import ProjectTemplate from '../models/ProjectTemplate';
import PreferredVendor from '../models/PreferredVendor';
import { generateToken } from '../utils/jwt';

describe('Service Package and Template API', () => {
  let freelancerToken: string;
  let clientToken: string;
  let freelancerId: string;
  let clientId: string;
  let packageId: string;
  let templateId: string;

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
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ServicePackage.deleteMany({});
    await ProjectTemplate.deleteMany({});
    await PreferredVendor.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Service Packages', () => {
    describe('POST /api/services/packages', () => {
      it('should create a service package', async () => {
        const response = await request(app)
          .post('/api/services/packages')
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Web Development Package',
            description: 'Full-stack web development services',
            category: 'Web Development',
            pricing: {
              type: 'fixed',
              amount: 1000,
            },
            deliveryTime: 14,
            revisions: 2,
            features: ['Responsive design', 'SEO optimization'],
            skills: ['React', 'Node.js'],
          });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data.servicePackage.title).toBe('Web Development Package');
        
        packageId = response.body.data.servicePackage._id;
      });

      it('should require freelancer role', async () => {
        const response = await request(app)
          .post('/api/services/packages')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            title: 'Test Package',
            description: 'Test',
            category: 'Test',
            pricing: { type: 'fixed', amount: 100 },
            deliveryTime: 7,
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/services/packages', () => {
      it('should get all service packages', async () => {
        const response = await request(app)
          .get('/api/services/packages')
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.packages.length).toBeGreaterThan(0);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get('/api/services/packages?category=Web Development')
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.packages.every((p: any) => p.category === 'Web Development')).toBe(true);
      });
    });

    describe('PATCH /api/services/packages/:packageId', () => {
      it('should update service package', async () => {
        const response = await request(app)
          .patch(`/api/services/packages/${packageId}`)
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Updated Web Development Package',
            deliveryTime: 21,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.servicePackage.title).toBe('Updated Web Development Package');
        expect(response.body.data.servicePackage.deliveryTime).toBe(21);
      });
    });
  });

  describe('Project Templates', () => {
    describe('POST /api/services/templates', () => {
      it('should create a project template', async () => {
        const response = await request(app)
          .post('/api/services/templates')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            title: 'Website Redesign Template',
            description: 'Template for website redesign projects',
            category: 'Web Design',
            budget: { min: 2000, max: 5000 },
            duration: 30,
            skills: ['UI/UX', 'Figma'],
            isRecurring: false,
          });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data.template.title).toBe('Website Redesign Template');
        
        templateId = response.body.data.template._id;
      });

      it('should require client role', async () => {
        const response = await request(app)
          .post('/api/services/templates')
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Test Template',
            description: 'Test',
            category: 'Test',
            budget: { min: 100, max: 200 },
            duration: 7,
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/services/templates', () => {
      it('should get user templates', async () => {
        const response = await request(app)
          .get('/api/services/templates')
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.templates.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/services/templates/:templateId/create-project', () => {
      it('should create project from template', async () => {
        const response = await request(app)
          .post(`/api/services/templates/${templateId}/create-project`)
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).toBe(201);
        expect(response.body.data.project.title).toBe('Website Redesign Template');
      });
    });
  });

  describe('Preferred Vendors', () => {
    let vendorId: string;

    describe('POST /api/services/preferred-vendors', () => {
      it('should add preferred vendor', async () => {
        const response = await request(app)
          .post('/api/services/preferred-vendors')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            freelancerId,
            category: 'Web Development',
            rating: 5,
            notes: 'Excellent work quality',
            isPriority: true,
          });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        
        vendorId = response.body.data.vendor._id;
      });

      it('should not allow duplicate vendors', async () => {
        const response = await request(app)
          .post('/api/services/preferred-vendors')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            freelancerId,
            category: 'Web Development',
            rating: 5,
          });

        expect(response.status).toBe(500);
      });
    });

    describe('GET /api/services/preferred-vendors', () => {
      it('should get preferred vendors', async () => {
        const response = await request(app)
          .get('/api/services/preferred-vendors')
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.vendors.length).toBeGreaterThan(0);
      });
    });

    describe('PATCH /api/services/preferred-vendors/:vendorId', () => {
      it('should update preferred vendor', async () => {
        const response = await request(app)
          .patch(`/api/services/preferred-vendors/${vendorId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            rating: 4,
            notes: 'Updated notes',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.vendor.rating).toBe(4);
      });
    });

    describe('DELETE /api/services/preferred-vendors/:vendorId', () => {
      it('should remove preferred vendor', async () => {
        const response = await request(app)
          .delete(`/api/services/preferred-vendors/${vendorId}`)
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
      });
    });
  });
});

import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Skill } from '../models/Skill';
import ServicePackage from '../models/ServicePackage';
import ProjectTemplate from '../models/ProjectTemplate';
import PreferredVendor from '../models/PreferredVendor';
// Database connection managed by global test setup
import { generateTokens } from '../utils/jwt';

describe('Service Package and Template System', () => {
  let clientUser: any;
  let freelancerUser: any;
  let adminUser: any;
  let category: any;
  let skills: any[];
  let clientToken: string;
  let freelancerToken: string;
  let adminToken: string;
  let packageId: string;
  let templateId: string;
  let vendorId: string;

  // Database connection managed by global test setup

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await ServicePackage.deleteMany({});
    await ProjectTemplate.deleteMany({});
    await PreferredVendor.deleteMany({});
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
      { name: 'React', slug: 'react' },
      { name: 'Node.js', slug: 'nodejs' }
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
  describe('Service Packages', () => {
    describe('POST /api/v1/services/packages', () => {
      it('should create a service package successfully', async () => {
        const response = await request(app)
          .post('/api/v1/services/packages')
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Web Development Package',
            description: 'Full-stack web development services including frontend and backend development',
            category: 'Web Development',
            pricing: {
              type: 'fixed',
              amount: 1000,
            },
            deliveryTime: 14,
            revisions: 2,
            features: ['Responsive design', 'SEO optimization', 'Database integration'],
            skills: ['React', 'Node.js', 'JavaScript'],
          })
          .expect(201);

        expect(response.body.status).toBe('success');
        expect(response.body.data.servicePackage).toBeDefined();
        expect(response.body.data.servicePackage.title).toBe('Web Development Package');
        expect(response.body.data.servicePackage.freelancer).toBe(freelancerUser._id.toString());
        
        packageId = response.body.data.servicePackage._id;
      });

      it('should fail for non-freelancer users', async () => {
        const response = await request(app)
          .post('/api/v1/services/packages')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            title: 'Test Package',
            description: 'Test description',
            category: 'Web Development',
            pricing: { type: 'fixed', amount: 100 },
            deliveryTime: 7,
          })
          .expect(403);

        expect(response.body.status).toBe('fail');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/v1/services/packages')
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Incomplete Package',
            // Missing required fields
          })
          .expect(500);

        expect(response.body.status).toBe('error');
      });
    });

    describe('GET /api/v1/services/packages', () => {
      beforeEach(async () => {
        // Create test service packages
        await ServicePackage.create([
          {
            freelancer: freelancerUser._id,
            title: 'Web Development Package',
            description: 'Full-stack web development',
            category: 'Web Development',
            pricing: { type: 'fixed', amount: 1000 },
            deliveryTime: 14,
            features: ['Responsive design'],
            skills: ['React', 'Node.js'],
            isActive: true,
          },
          {
            freelancer: freelancerUser._id,
            title: 'Mobile App Package',
            description: 'Mobile app development',
            category: 'Mobile Development',
            pricing: { type: 'fixed', amount: 1500 },
            deliveryTime: 21,
            features: ['Cross-platform'],
            skills: ['React Native'],
            isActive: true,
          },
        ]);
      });

      it('should get all service packages', async () => {
        const response = await request(app)
          .get('/api/v1/services/packages')
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.packages).toBeDefined();
        expect(response.body.data.packages.length).toBeGreaterThanOrEqual(2);
      });

      it('should filter packages by category', async () => {
        const response = await request(app)
          .get('/api/v1/services/packages?category=Web Development')
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.packages.every((p: any) => p.category === 'Web Development')).toBe(true);
      });
    });

    describe('PATCH /api/v1/services/packages/:packageId', () => {
      beforeEach(async () => {
        const servicePackage = await ServicePackage.create({
          freelancer: freelancerUser._id,
          title: 'Original Package',
          description: 'Original description',
          category: 'Web Development',
          pricing: { type: 'fixed', amount: 1000 },
          deliveryTime: 14,
          features: ['Feature 1'],
          skills: ['React'],
          isActive: true,
        });
        packageId = servicePackage._id.toString();
      });

      it('should update service package successfully', async () => {
        const response = await request(app)
          .patch(`/api/v1/services/packages/${packageId}`)
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Updated Web Development Package',
            deliveryTime: 21,
            features: ['Updated feature 1', 'New feature 2'],
          })
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.servicePackage.title).toBe('Updated Web Development Package');
        expect(response.body.data.servicePackage.deliveryTime).toBe(21);
        expect(response.body.data.servicePackage.features).toContain('New feature 2');
      });
    });
  });
  describe('Project Templates', () => {
    describe('POST /api/v1/services/templates', () => {
      it('should create a project template successfully', async () => {
        const response = await request(app)
          .post('/api/v1/services/templates')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            title: 'Website Redesign Template',
            description: 'Template for website redesign projects',
            category: 'Web Design',
            budget: { 
              min: 2000, 
              max: 5000 
            },
            duration: 30,
            skills: ['UI/UX', 'Figma', 'HTML', 'CSS'],
            requirements: ['Provide existing website URL', 'Brand guidelines'],
            isRecurring: false,
          })
          .expect(201);

        expect(response.body.status).toBe('success');
        expect(response.body.data.template).toBeDefined();
        expect(response.body.data.template.title).toBe('Website Redesign Template');
        expect(response.body.data.template.client).toBe(clientUser._id.toString());
        
        templateId = response.body.data.template._id;
      });

      it('should fail for non-client users', async () => {
        await request(app)
          .post('/api/v1/services/templates')
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            title: 'Test Template',
            description: 'Test description',
            category: 'Test',
            budget: { min: 100, max: 200 },
            duration: 7,
          })
          .expect(403);
      });
    });

    describe('GET /api/v1/services/templates', () => {
      beforeEach(async () => {
        await ProjectTemplate.create({
          client: clientUser._id,
          title: 'E-commerce Template',
          description: 'Template for e-commerce projects',
          category: 'Web Development',
          budget: { min: 3000, max: 8000 },
          duration: 45,
          skills: ['React', 'Node.js', 'MongoDB'],
          requirements: ['Product catalog', 'Payment integration'],
          isRecurring: false,
        });
      });

      it('should get user templates', async () => {
        const response = await request(app)
          .get('/api/v1/services/templates')
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.templates).toBeDefined();
        expect(response.body.data.templates.length).toBeGreaterThanOrEqual(1);
        expect(response.body.data.templates[0].client).toBe(clientUser._id.toString());
      });
    });

    describe('POST /api/v1/services/templates/:templateId/create-project', () => {
      beforeEach(async () => {
        const template = await ProjectTemplate.create({
          client: clientUser._id,
          title: 'Website Redesign Template',
          description: 'Template for website redesign projects',
          category: 'Web Design',
          budget: { min: 2000, max: 5000 },
          duration: 30,
          skills: ['UI/UX', 'Figma', 'HTML', 'CSS'],
          requirements: ['Provide existing website URL', 'Brand guidelines'],
          isRecurring: false,
        });
        templateId = template._id.toString();
      });

      it('should create project from template', async () => {
        const response = await request(app)
          .post(`/api/v1/services/templates/${templateId}/create-project`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(201);

        expect(response.body.status).toBe('success');
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.title).toBe('Website Redesign Template');
      });
    });
  });
  describe('Preferred Vendors', () => {
    describe('POST /api/v1/services/preferred-vendors', () => {
      it('should add preferred vendor successfully', async () => {
        const response = await request(app)
          .post('/api/v1/services/preferred-vendors')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            freelancerId: freelancerUser._id,
            category: 'Web Development',
            rating: 5,
            notes: 'Excellent work quality and communication',
            isPriority: true,
          })
          .expect(201);

        expect(response.body.status).toBe('success');
        expect(response.body.data.vendor).toBeDefined();
        expect(response.body.data.vendor.freelancer).toBe(freelancerUser._id.toString());
        expect(response.body.data.vendor.rating).toBe(5);
        
        vendorId = response.body.data.vendor._id;
      });

      it('should fail for non-client users', async () => {
        await request(app)
          .post('/api/v1/services/preferred-vendors')
          .set('Authorization', `Bearer ${freelancerToken}`)
          .send({
            freelancerId: freelancerUser._id,
            category: 'Web Development',
            rating: 5,
          })
          .expect(403);
      });
    });

    describe('GET /api/v1/services/preferred-vendors', () => {
      beforeEach(async () => {
        await PreferredVendor.create({
          client: clientUser._id,
          freelancer: freelancerUser._id,
          category: 'Web Development',
          rating: 4,
          notes: 'Good freelancer',
          isPriority: false,
        });
      });

      it('should get preferred vendors', async () => {
        const response = await request(app)
          .get('/api/v1/services/preferred-vendors')
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.vendors).toBeDefined();
        expect(response.body.data.vendors.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('PATCH /api/v1/services/preferred-vendors/:vendorId', () => {
      beforeEach(async () => {
        const vendor = await PreferredVendor.create({
          client: clientUser._id,
          freelancer: freelancerUser._id,
          category: 'Web Development',
          rating: 4,
          notes: 'Original notes',
          isPriority: false,
        });
        vendorId = vendor._id.toString();
      });

      it('should update preferred vendor successfully', async () => {
        const response = await request(app)
          .patch(`/api/v1/services/preferred-vendors/${vendorId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            rating: 5,
            notes: 'Updated notes - excellent work!',
            isPriority: true,
          })
          .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.data.vendor.rating).toBe(5);
        expect(response.body.data.vendor.notes).toBe('Updated notes - excellent work!');
        expect(response.body.data.vendor.isPriority).toBe(true);
      });
    });

    describe('DELETE /api/v1/services/preferred-vendors/:vendorId', () => {
      beforeEach(async () => {
        const vendor = await PreferredVendor.create({
          client: clientUser._id,
          freelancer: freelancerUser._id,
          category: 'Web Development',
          rating: 4,
          notes: 'To be removed',
          isPriority: false,
        });
        vendorId = vendor._id.toString();
      });

      it('should remove preferred vendor successfully', async () => {
        const response = await request(app)
          .delete(`/api/v1/services/preferred-vendors/${vendorId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.status).toBe('success');

        // Verify vendor is removed
        const deletedVendor = await PreferredVendor.findById(vendorId);
        expect(deletedVendor).toBeNull();
      });
    });
  });
});
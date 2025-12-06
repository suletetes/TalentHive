import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { generateTokens } from '../utils/jwt';

describe('Profile Management', () => {
  let freelancer: any;
  let client: any;
  let freelancerToken: string;
  let clientToken: string;

  beforeEach(async () => {
    await User.deleteMany({});

    // Create freelancer
    freelancer = new User({
      email: 'freelancer@test.com',
      password: 'password123',
      role: 'freelancer',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      freelancerProfile: {
        title: 'Full Stack Developer',
        hourlyRate: 50,
        skills: ['React', 'Node.js'],
        skillRates: [{ skill: 'React', rate: 60 }],
        availability: {
          status: 'available',
          schedule: {
            monday: [], tuesday: [], wednesday: [], thursday: [],
            friday: [], saturday: [], sunday: []
          },
          calendar: [],
        },
        portfolio: [],
        certifications: [],
        timeTracking: { isEnabled: false },
      },
      isVerified: true,
      isActive: true,
    });
    await freelancer.save();

    // Create client
    client = new User({
      email: 'client@test.com',
      password: 'password123',
      role: 'client',
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
      clientProfile: {
        companyName: 'Test Corp',
        industry: 'Technology',
        projectsPosted: 0,
        preferredVendors: [],
        projectTemplates: [],
      },
      isVerified: true,
      isActive: true,
    });
    await client.save();

    // Generate tokens
    freelancerToken = generateTokens({
      userId: freelancer._id,
      email: freelancer.email,
      role: freelancer.role,
    }).accessToken;

    clientToken = generateTokens({
      userId: client._id,
      email: client.email,
      role: client.role,
    }).accessToken;
  });

  describe('GET /api/v1/users/profile', () => {
    it('should get user profile with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(freelancer.email);
      expect(response.body.data.user.freelancerProfile).toBeTruthy();
    });

    it('should not get profile without authentication', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update basic profile information', async () => {
      const updateData = {
        profile: {
          firstName: 'Johnny',
          lastName: 'Doe',
          bio: 'Updated bio',
          location: 'New York, NY',
        },
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.profile.firstName).toBe('Johnny');
      expect(response.body.data.user.profile.bio).toBe('Updated bio');
    });

    it('should update freelancer profile', async () => {
      const updateData = {
        freelancerProfile: {
          title: 'Senior Full Stack Developer',
          hourlyRate: 75,
        },
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.user.freelancerProfile.title).toBe('Senior Full Stack Developer');
      expect(response.body.data.user.freelancerProfile.hourlyRate).toBe(75);
    });

    it('should update client profile', async () => {
      const updateData = {
        clientProfile: {
          companyName: 'Updated Corp',
          industry: 'Finance',
        },
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.user.clientProfile.companyName).toBe('Updated Corp');
      expect(response.body.data.user.clientProfile.industry).toBe('Finance');
    });

    it('should validate profile data', async () => {
      const updateData = {
        profile: {
          firstName: '', // Invalid: empty
          bio: 'a'.repeat(1001), // Invalid: too long
        },
      };

      await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('GET /api/v1/users/freelancers', () => {
    it('should get list of freelancers', async () => {
      const response = await request(app)
        .get('/api/v1/users/freelancers')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.freelancers).toHaveLength(1);
      expect(response.body.data.freelancers[0].role).toBe('freelancer');
    });

    it('should filter freelancers by skills', async () => {
      const response = await request(app)
        .get('/api/v1/users/freelancers?skills=React')
        .expect(200);

      expect(response.body.data.freelancers).toHaveLength(1);
      expect(response.body.data.freelancers[0].freelancerProfile.skills).toContain('React');
    });

    it('should filter freelancers by availability', async () => {
      const response = await request(app)
        .get('/api/v1/users/freelancers?availability=available')
        .expect(200);

      expect(response.body.data.freelancers).toHaveLength(1);
    });

    it('should search freelancers by name', async () => {
      const response = await request(app)
        .get('/api/v1/users/freelancers?search=John')
        .expect(200);

      expect(response.body.data.freelancers).toHaveLength(1);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/users/freelancers?page=1&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/v1/users/skills', () => {
    it('should add skill for freelancer', async () => {
      const skillData = {
        skill: 'TypeScript',
        rate: 65,
      };

      const response = await request(app)
        .post('/api/v1/users/skills')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(skillData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.skills).toContain('TypeScript');
      // Check that the skill rate exists with correct values (ignore _id fields)
      const typescriptRate = response.body.data.skillRates.find((sr: any) => sr.skill === 'TypeScript');
      expect(typescriptRate).toBeDefined();
      expect(typescriptRate.rate).toBe(65);
    });

    it('should not allow clients to add skills', async () => {
      const skillData = { skill: 'Management' };

      await request(app)
        .post('/api/v1/users/skills')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(skillData)
        .expect(403);
    });

    it('should not add duplicate skills', async () => {
      const skillData = { skill: 'React' }; // Already exists

      await request(app)
        .post('/api/v1/users/skills')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(skillData)
        .expect(400);
    });
  });

  describe('DELETE /api/v1/users/skills/:skill', () => {
    it('should remove skill for freelancer', async () => {
      const response = await request(app)
        .delete('/api/v1/users/skills/React')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.skills).not.toContain('React');
    });

    it('should not allow clients to remove skills', async () => {
      await request(app)
        .delete('/api/v1/users/skills/React')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/users/portfolio', () => {
    it('should add portfolio item for freelancer', async () => {
      const portfolioData = {
        title: 'E-commerce Website',
        description: 'Built a full-stack e-commerce platform',
        images: ['https://example.com/image1.jpg'],
        projectUrl: 'https://example.com',
        technologies: ['React', 'Node.js', 'MongoDB'],
        completedAt: new Date(),
      };

      const response = await request(app)
        .post('/api/v1/users/portfolio')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(portfolioData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.portfolio).toHaveLength(1);
      expect(response.body.data.portfolio[0].title).toBe('E-commerce Website');
    });

    it('should not allow clients to add portfolio items', async () => {
      const portfolioData = {
        title: 'Test Project',
        description: 'Test description',
      };

      await request(app)
        .post('/api/v1/users/portfolio')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(portfolioData)
        .expect(403);
    });
  });

  describe('PUT /api/v1/users/availability', () => {
    it('should update availability for freelancer', async () => {
      const availabilityData = {
        status: 'busy',
        schedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const response = await request(app)
        .put('/api/v1/users/availability')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(availabilityData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.availability.status).toBe('busy');
    });

    it('should not allow clients to update availability', async () => {
      const availabilityData = { status: 'available' };

      await request(app)
        .put('/api/v1/users/availability')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(availabilityData)
        .expect(403);
    });
  });
});
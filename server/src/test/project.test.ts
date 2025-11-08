import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { generateTokens } from '../utils/jwt';

describe('Project Management', () => {
  let client: any;
  let freelancer: any;
  let clientToken: string;
  let freelancerToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});

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
        availability: { status: 'available' },
        portfolio: [],
        certifications: [],
        timeTracking: { isEnabled: false },
      },
      isVerified: true,
      isActive: true,
    });
    await freelancer.save();

    // Generate tokens
    clientToken = generateTokens({
      userId: client._id,
      email: client.email,
      role: client.role,
    }).accessToken;

    freelancerToken = generateTokens({
      userId: freelancer._id,
      email: freelancer.email,
      role: freelancer.role,
    }).accessToken;
  });

  describe('POST /api/v1/projects', () => {
    const validProjectData = {
      title: 'Test Project',
      description: 'This is a test project description that is long enough to pass validation.',
      category: 'Web Development',
      skills: ['React', 'Node.js'],
      budget: {
        type: 'fixed',
        min: 1000,
        max: 2000,
      },
      timeline: {
        duration: 2,
        unit: 'weeks',
      },
    };

    it('should create project for client', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validProjectData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.project.title).toBe(validProjectData.title);
      expect(response.body.data.project.client).toBe(client._id.toString());
    });

    it('should not allow freelancers to create projects', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(validProjectData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const invalidData: any = { ...validProjectData };
      delete invalidData.title;

      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate budget range', async () => {
      const invalidData = {
        ...validProjectData,
        budget: {
          type: 'fixed',
          min: 2000,
          max: 1000, // max < min
        },
      };

      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/projects')
        .send(validProjectData)
        .expect(401);
    });
  });

  describe('GET /api/v1/projects', () => {
    beforeEach(async () => {
      // Create test projects
      await Project.create([
        {
          title: 'React Project',
          description: 'A React project description',
          client: client._id,
          category: 'Web Development',
          skills: ['React', 'JavaScript'],
          budget: { type: 'fixed', min: 1000, max: 2000 },
          timeline: { duration: 2, unit: 'weeks' },
          status: 'open',
          visibility: 'public',
        },
        {
          title: 'Node.js Project',
          description: 'A Node.js project description',
          client: client._id,
          category: 'Backend Development',
          skills: ['Node.js', 'MongoDB'],
          budget: { type: 'hourly', min: 50, max: 100 },
          timeline: { duration: 1, unit: 'months' },
          status: 'open',
          visibility: 'public',
        },
      ]);
    });

    it('should get list of projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.projects).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter projects by category', async () => {
      const response = await request(app)
        .get('/api/v1/projects?category=Web Development')
        .expect(200);

      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].category).toBe('Web Development');
    });

    it('should filter projects by skills', async () => {
      const response = await request(app)
        .get('/api/v1/projects?skills=React')
        .expect(200);

      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].skills).toContain('React');
    });

    it('should filter projects by budget range', async () => {
      const response = await request(app)
        .get('/api/v1/projects?budgetMin=1500&budgetMax=2500')
        .expect(200);

      expect(response.body.data.projects).toHaveLength(1);
    });

    it('should search projects by text', async () => {
      const response = await request(app)
        .get('/api/v1/projects?search=React')
        .expect(200);

      expect(response.body.data.projects).toHaveLength(1);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/projects?page=1&limit=1')
        .expect(200);

      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    let project: any;

    beforeEach(async () => {
      project = await Project.create({
        title: 'Test Project',
        description: 'Test project description',
        client: client._id,
        category: 'Web Development',
        skills: ['React'],
        budget: { type: 'fixed', min: 1000, max: 2000 },
        timeline: { duration: 2, unit: 'weeks' },
        status: 'open',
        visibility: 'public',
      });
    });

    it('should get project by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.project._id).toBe(project._id.toString());
    });

    it('should increment view count', async () => {
      const initialViewCount = project.viewCount;

      await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .expect(200);

      const updatedProject = await Project.findById(project._id);
      expect(updatedProject?.viewCount).toBe(initialViewCount + 1);
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/api/v1/projects/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    let project: any;

    beforeEach(async () => {
      project = await Project.create({
        title: 'Test Project',
        description: 'Test project description',
        client: client._id,
        category: 'Web Development',
        skills: ['React'],
        budget: { type: 'fixed', min: 1000, max: 2000 },
        timeline: { duration: 2, unit: 'weeks' },
        status: 'draft',
        visibility: 'public',
      });
    });

    it('should update project by owner', async () => {
      const updateData = {
        title: 'Updated Project Title',
        description: 'Updated project description',
      };

      const response = await request(app)
        .put(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.project.title).toBe(updateData.title);
    });

    it('should not allow non-owners to update project', async () => {
      const updateData = { title: 'Hacked Title' };

      await request(app)
        .put(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should not allow updates to in-progress projects', async () => {
      project.status = 'in_progress';
      await project.save();

      const updateData = { title: 'Updated Title' };

      await request(app)
        .put(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    let project: any;

    beforeEach(async () => {
      project = await Project.create({
        title: 'Test Project',
        description: 'Test project description',
        client: client._id,
        category: 'Web Development',
        skills: ['React'],
        budget: { type: 'fixed', min: 1000, max: 2000 },
        timeline: { duration: 2, unit: 'weeks' },
        status: 'draft',
        visibility: 'public',
        proposals: [],
      });
    });

    it('should delete project by owner', async () => {
      await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      const deletedProject = await Project.findById(project._id);
      expect(deletedProject).toBeNull();
    });

    it('should not allow non-owners to delete project', async () => {
      await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .expect(403);
    });

    it('should not allow deletion of projects with proposals', async () => {
      project.proposals = ['507f1f77bcf86cd799439011']; // Mock proposal ID
      await project.save();

      await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/projects/search', () => {
    beforeEach(async () => {
      await Project.create({
        title: 'React E-commerce Project',
        description: 'Build an e-commerce platform with React',
        client: client._id,
        category: 'Web Development',
        skills: ['React', 'Node.js'],
        budget: { type: 'fixed', min: 1000, max: 2000 },
        timeline: { duration: 2, unit: 'weeks' },
        status: 'open',
        visibility: 'public',
      });
    });

    it('should search projects by query', async () => {
      const response = await request(app)
        .get('/api/v1/projects/search?q=React')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.query).toBe('React');
    });

    it('should require search query', async () => {
      await request(app)
        .get('/api/v1/projects/search')
        .expect(400);
    });
  });

  describe('GET /api/v1/projects/categories', () => {
    beforeEach(async () => {
      await Project.create([
        {
          title: 'Project 1',
          description: 'Description 1',
          client: client._id,
          category: 'Web Development',
          skills: ['React'],
          budget: { type: 'fixed', min: 1000, max: 2000 },
          timeline: { duration: 2, unit: 'weeks' },
          status: 'open',
          visibility: 'public',
        },
        {
          title: 'Project 2',
          description: 'Description 2',
          client: client._id,
          category: 'Mobile Development',
          skills: ['React Native'],
          budget: { type: 'fixed', min: 1000, max: 2000 },
          timeline: { duration: 2, unit: 'weeks' },
          status: 'open',
          visibility: 'public',
        },
      ]);
    });

    it('should get project categories', async () => {
      const response = await request(app)
        .get('/api/v1/projects/categories')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.categories).toContain('Web Development');
      expect(response.body.data.categories).toContain('Mobile Development');
    });
  });
});
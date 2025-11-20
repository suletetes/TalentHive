import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';
import { User } from '@/models/User';
import { Organization } from '@/models/Organization';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Contract } from '@/models/Contract';
import ServicePackage from '@/models/ServicePackage';
import ProjectTemplate from '@/models/ProjectTemplate';
import PreferredVendor from '@/models/PreferredVendor';
import { Review } from '@/models/Review';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import TimeEntry from '@/models/TimeEntry';
import BudgetApproval from '@/models/BudgetApproval';

// Load environment variables
dotenv.config();

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB disconnection failed:', error);
  }
}

async function clearDatabase() {
  logger.info('🧹 Clearing existing data...');
  
  const { Conversation } = await import('@/models/Message');
  const { Payment } = await import('@/models/Payment');
  
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Project.deleteMany({});
  await Proposal.deleteMany({});
  await Contract.deleteMany({});
  await ServicePackage.deleteMany({});
  await ProjectTemplate.deleteMany({});
  await PreferredVendor.deleteMany({});
  await Review.deleteMany({});
  await Message.deleteMany({});
  await Conversation.deleteMany({});
  await Notification.deleteMany({});
  await TimeEntry.deleteMany({});
  await BudgetApproval.deleteMany({});
  await Payment.deleteMany({});
  
  logger.info('✅ Database cleared');
}

async function seedUsers() {
  logger.info('👥 Seeding users...');
  
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const users = [
    // Admin
    {
      email: 'admin@talenthive.com',
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'active',
      isEmailVerified: true,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
      },
    },
    // Clients
    {
      email: 'john.client@example.com',
      password: hashedPassword,
      role: 'client',
      accountStatus: 'active',
      isEmailVerified: true,
      profile: {
        firstName: 'John',
        lastName: 'Smith',
        bio: 'CEO of TechCorp, looking for talented developers',
        location: 'San Francisco, CA',
        website: 'https://techcorp.com',
      },
    },
    {
      email: 'sarah.manager@example.com',
      password: hashedPassword,
      role: 'client',
      accountStatus: 'active',
      isEmailVerified: true,
      profile: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        bio: 'Project Manager at StartupXYZ',
        location: 'New York, NY',
      },
    },
    // Freelancers
    {
      email: 'alice.dev@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Alice',
        lastName: 'Developer',
        bio: 'Full-stack developer with 5+ years experience in React and Node.js',
        location: 'Austin, TX',
      },
      freelancerProfile: {
        title: 'Full-Stack Developer',
        hourlyRate: 75,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
        availability: {
          status: 'available',
        },
      },
      rating: { average: 4.8, count: 15 },
    },
    {
      email: 'bob.designer@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Bob',
        lastName: 'Designer',
        bio: 'UI/UX Designer specializing in modern web applications',
        location: 'Los Angeles, CA',
      },
      freelancerProfile: {
        title: 'UI/UX Designer',
        hourlyRate: 65,
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
        availability: {
          status: 'available',
        },
      },
      rating: { average: 4.9, count: 22 },
    },
    {
      email: 'carol.writer@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Carol',
        lastName: 'Writer',
        bio: 'Technical writer and content strategist',
        location: 'Seattle, WA',
      },
      freelancerProfile: {
        title: 'Technical Writer',
        hourlyRate: 50,
        skills: ['Technical Writing', 'Content Strategy', 'SEO', 'Documentation'],
        availability: {
          status: 'available',
        },
      },
      rating: { average: 4.7, count: 18 },
    },
    // Additional Freelancers
    {
      email: 'david.mobile@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'David',
        lastName: 'Martinez',
        bio: 'Mobile app developer specializing in React Native and Flutter',
        location: 'Miami, FL',
      },
      freelancerProfile: {
        title: 'Mobile App Developer',
        hourlyRate: 80,
        skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
        availability: {
          status: 'available',
        },
      },
      rating: { average: 4.6, count: 12 },
    },
    {
      email: 'emma.data@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Emma',
        lastName: 'Chen',
        bio: 'Data scientist and machine learning engineer',
        location: 'Boston, MA',
      },
      freelancerProfile: {
        title: 'Data Scientist',
        hourlyRate: 95,
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'SQL'],
        availability: {
          status: 'busy',
        },
      },
      rating: { average: 5.0, count: 8 },
    },
    // Additional Clients
    {
      email: 'michael.startup@example.com',
      password: hashedPassword,
      role: 'client',
      accountStatus: 'active',
      isEmailVerified: true,
      profile: {
        firstName: 'Michael',
        lastName: 'Brown',
        bio: 'Founder of HealthTech startup',
        location: 'Denver, CO',
      },
    },
    {
      email: 'lisa.enterprise@example.com',
      password: hashedPassword,
      role: 'client',
      accountStatus: 'active',
      isEmailVerified: true,
      profile: {
        firstName: 'Lisa',
        lastName: 'Anderson',
        bio: 'IT Director at Fortune 500 company',
        location: 'Chicago, IL',
      },
    },
  ];
  
  const createdUsers = await User.insertMany(users);
  logger.info(`✅ Created ${createdUsers.length} users`);
  
  return createdUsers;
}

async function seedOrganizations(users: any[]) {
  logger.info('🏢 Seeding organizations...');
  
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  
  const organizations = [
    {
      name: 'TechCorp Solutions',
      description: 'Leading technology solutions provider',
      industry: 'Technology',
      size: '51-200',
      website: 'https://techcorp.com',
      owner: client1._id,
      members: [
        {
          user: client1._id,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
      budgetSettings: {
        monthlyBudget: 50000,
        approvalThreshold: 5000,
        autoApproveBelow: 1000,
      },
    },
    {
      name: 'StartupXYZ',
      description: 'Innovative startup disrupting the market',
      industry: 'Startup',
      size: '11-50',
      owner: client2._id,
      members: [
        {
          user: client2._id,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
      budgetSettings: {
        monthlyBudget: 20000,
        approvalThreshold: 2000,
        autoApproveBelow: 500,
      },
    },
  ];
  
  const createdOrgs = await Organization.insertMany(organizations);
  logger.info(`✅ Created ${createdOrgs.length} organizations`);
  
  return createdOrgs;
}

async function seedProjects(users: any[], organizations: any[]) {
  logger.info('📋 Seeding projects...');
  
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  
  const projects = [
    // Open projects
    {
      title: 'E-commerce Website Development',
      description: 'Build a modern e-commerce platform with React and Node.js',
      category: 'Web Development',
      budget: { 
        type: 'fixed',
        min: 5000, 
        max: 8000 
      },
      timeline: {
        duration: 60,
        unit: 'days',
      },
      skills: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      requirements: [
        'Responsive design',
        'Payment integration',
        'Admin dashboard',
        'Inventory management',
      ],
      client: client1._id,
      status: 'open',
    },
    {
      title: 'Mobile App UI/UX Design',
      description: 'Design user interface for iOS and Android mobile application',
      category: 'Design',
      budget: { 
        type: 'fixed',
        min: 2000, 
        max: 3500 
      },
      timeline: {
        duration: 30,
        unit: 'days',
      },
      skills: ['Figma', 'Mobile Design', 'Prototyping'],
      requirements: [
        'iOS and Android designs',
        'Interactive prototypes',
        'Design system',
      ],
      client: client2._id,
      status: 'open',
    },
    {
      title: 'Marketing Website Redesign',
      description: 'Redesign our company website with modern UI/UX',
      category: 'Web Development',
      budget: { 
        type: 'fixed',
        min: 3000, 
        max: 5000 
      },
      timeline: {
        duration: 45,
        unit: 'days',
      },
      skills: ['React', 'Design', 'SEO'],
      requirements: [
        'Modern design',
        'SEO optimization',
        'Fast loading',
      ],
      client: client1._id,
      status: 'open',
    },
    // In progress projects
    {
      title: 'Technical Documentation',
      description: 'Create comprehensive API documentation and user guides',
      category: 'Writing',
      budget: { 
        type: 'fixed',
        min: 1500, 
        max: 2500 
      },
      timeline: {
        duration: 21,
        unit: 'days',
      },
      skills: ['Technical Writing', 'API Documentation'],
      requirements: [
        'API reference documentation',
        'User guides',
        'Developer tutorials',
      ],
      client: client1._id,
      status: 'in_progress',
    },
    {
      title: 'Backend API Development',
      description: 'Build RESTful API with Node.js and Express',
      category: 'Web Development',
      budget: { 
        type: 'hourly',
        min: 50, 
        max: 80 
      },
      timeline: {
        duration: 30,
        unit: 'days',
      },
      skills: ['Node.js', 'Express', 'MongoDB', 'REST API'],
      requirements: [
        'RESTful architecture',
        'Authentication',
        'Database integration',
      ],
      client: client2._id,
      status: 'in_progress',
    },
    // Completed projects
    {
      title: 'Logo Design',
      description: 'Create a modern logo for our startup',
      category: 'Design',
      budget: { 
        type: 'fixed',
        min: 500, 
        max: 1000 
      },
      timeline: {
        duration: 7,
        unit: 'days',
      },
      skills: ['Graphic Design', 'Branding'],
      requirements: [
        'Multiple concepts',
        'Vector files',
        'Brand guidelines',
      ],
      client: client2._id,
      status: 'completed',
    },
    {
      title: 'WordPress Plugin Development',
      description: 'Custom WordPress plugin for e-commerce functionality',
      category: 'Web Development',
      budget: { 
        type: 'fixed',
        min: 2000, 
        max: 3000 
      },
      timeline: {
        duration: 20,
        unit: 'days',
      },
      skills: ['WordPress', 'PHP', 'JavaScript'],
      requirements: [
        'Custom functionality',
        'Admin interface',
        'Documentation',
      ],
      client: client1._id,
      status: 'completed',
    },
    // Cancelled project
    {
      title: 'Social Media Management',
      description: 'Manage social media accounts for 3 months',
      category: 'Marketing',
      budget: { 
        type: 'fixed',
        min: 1000, 
        max: 1500 
      },
      timeline: {
        duration: 90,
        unit: 'days',
      },
      skills: ['Social Media', 'Content Creation'],
      requirements: [
        'Daily posts',
        'Engagement tracking',
        'Monthly reports',
      ],
      client: client2._id,
      status: 'cancelled',
    },
    // Additional open projects for browsing
    {
      title: 'Python Data Analysis Script',
      description: 'Create Python scripts for analyzing sales data and generating reports',
      category: 'Data Science',
      budget: { 
        type: 'fixed',
        min: 1500, 
        max: 2500 
      },
      timeline: {
        duration: 15,
        unit: 'days',
      },
      skills: ['Python', 'Pandas', 'Data Visualization', 'Excel'],
      requirements: [
        'Data cleaning',
        'Statistical analysis',
        'Automated reports',
        'Documentation',
      ],
      client: users.find(u => u.email === 'michael.startup@example.com')?._id || client1._id,
      status: 'open',
    },
    {
      title: 'React Native Mobile App',
      description: 'Build a cross-platform mobile app for fitness tracking',
      category: 'Mobile Development',
      budget: { 
        type: 'fixed',
        min: 8000, 
        max: 12000 
      },
      timeline: {
        duration: 90,
        unit: 'days',
      },
      skills: ['React Native', 'Firebase', 'Redux', 'REST API'],
      requirements: [
        'User authentication',
        'Activity tracking',
        'Social features',
        'Push notifications',
      ],
      client: users.find(u => u.email === 'michael.startup@example.com')?._id || client1._id,
      status: 'open',
    },
    {
      title: 'SEO Optimization for Website',
      description: 'Improve search engine rankings for e-commerce website',
      category: 'Marketing',
      budget: { 
        type: 'fixed',
        min: 2000, 
        max: 3500 
      },
      timeline: {
        duration: 45,
        unit: 'days',
      },
      skills: ['SEO', 'Google Analytics', 'Content Marketing', 'Link Building'],
      requirements: [
        'Keyword research',
        'On-page optimization',
        'Technical SEO audit',
        'Monthly reports',
      ],
      client: users.find(u => u.email === 'lisa.enterprise@example.com')?._id || client2._id,
      status: 'open',
    },
    {
      title: 'DevOps CI/CD Pipeline Setup',
      description: 'Set up automated deployment pipeline with Docker and Kubernetes',
      category: 'DevOps',
      budget: { 
        type: 'fixed',
        min: 4000, 
        max: 6000 
      },
      timeline: {
        duration: 30,
        unit: 'days',
      },
      skills: ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Terraform'],
      requirements: [
        'Automated testing',
        'Deployment automation',
        'Monitoring setup',
        'Documentation',
      ],
      client: users.find(u => u.email === 'lisa.enterprise@example.com')?._id || client2._id,
      status: 'open',
    },
    {
      title: 'Video Editing for YouTube Channel',
      description: 'Edit 10 videos for educational YouTube channel',
      category: 'Video & Animation',
      budget: { 
        type: 'fixed',
        min: 1000, 
        max: 1800 
      },
      timeline: {
        duration: 20,
        unit: 'days',
      },
      skills: ['Video Editing', 'Adobe Premiere', 'After Effects', 'Color Grading'],
      requirements: [
        'Professional editing',
        'Intro/outro animations',
        'Subtitles',
        'Thumbnail design',
      ],
      client: users.find(u => u.email === 'michael.startup@example.com')?._id || client1._id,
      status: 'open',
    },
  ];
  
  const createdProjects = await Project.insertMany(projects);
  logger.info(`✅ Created ${createdProjects.length} projects`);
  
  return createdProjects;
}

async function seedServicePackages(users: any[]) {
  logger.info('📦 Seeding service packages...');
  
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const carol = users.find(u => u.email === 'carol.writer@example.com');
  
  const packages = [
    {
      freelancer: alice._id,
      title: 'Full-Stack Web Application',
      description: 'Complete web application development with modern technologies',
      category: 'Web Development',
      pricing: {
        type: 'fixed',
        amount: 3000,
      },
      deliveryTime: 30,
      revisions: 3,
      features: [
        'Responsive design',
        'Database integration',
        'User authentication',
        'Admin panel',
      ],
      skills: ['React', 'Node.js', 'MongoDB'],
      isActive: true,
    },
    {
      freelancer: bob._id,
      title: 'UI/UX Design Package',
      description: 'Complete UI/UX design for web or mobile applications',
      category: 'Design',
      pricing: {
        type: 'fixed',
        amount: 1500,
      },
      deliveryTime: 14,
      revisions: 5,
      features: [
        'User research',
        'Wireframes',
        'High-fidelity designs',
        'Prototype',
      ],
      skills: ['Figma', 'User Research', 'Prototyping'],
      isActive: true,
    },
    {
      freelancer: carol._id,
      title: 'Content Writing Service',
      description: 'Professional content writing for websites and blogs',
      category: 'Writing',
      pricing: {
        type: 'hourly',
        hourlyRate: 50,
      },
      deliveryTime: 7,
      revisions: 2,
      features: [
        'SEO optimized content',
        'Research included',
        'Multiple revisions',
      ],
      skills: ['Content Writing', 'SEO', 'Research'],
      isActive: true,
    },
  ];
  
  const createdPackages = await ServicePackage.insertMany(packages);
  logger.info(`✅ Created ${createdPackages.length} service packages`);
  
  return createdPackages;
}

async function seedProposals(users: any[], projects: any[]) {
  logger.info('💼 Seeding proposals...');
  
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const carol = users.find(u => u.email === 'carol.writer@example.com');
  
  const ecommerceProject = projects.find(p => p.title === 'E-commerce Website Development');
  const designProject = projects.find(p => p.title === 'Mobile App UI/UX Design');
  const docProject = projects.find(p => p.title === 'Technical Documentation');
  const marketingProject = projects.find(p => p.title === 'Marketing Website Redesign');
  const backendProject = projects.find(p => p.title === 'Backend API Development');
  
  const proposals = [
    // Pending proposals
    {
      project: ecommerceProject._id,
      freelancer: alice._id,
      coverLetter: 'I have extensive experience building e-commerce platforms with React and Node.js. I can deliver a high-quality solution within your timeline.',
      bidAmount: 6500,
      timeline: {
        duration: 45,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Frontend Development',
          description: 'Complete React frontend with responsive design',
          amount: 2500,
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Backend API',
          description: 'Node.js API with authentication and payment integration',
          amount: 2000,
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Testing & Deployment',
          description: 'Testing, bug fixes, and deployment',
          amount: 2000,
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        },
      ],
      status: 'submitted',
    },
    {
      project: marketingProject._id,
      freelancer: bob._id,
      coverLetter: 'I can help redesign your marketing website with a modern, conversion-focused design.',
      bidAmount: 4000,
      timeline: {
        duration: 35,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Design Phase',
          description: 'Create mockups and design system',
          amount: 2000,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Development Phase',
          description: 'Implement the design',
          amount: 2000,
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        },
      ],
      status: 'submitted',
    },
    // Accepted proposals
    {
      project: designProject._id,
      freelancer: bob._id,
      coverLetter: 'I specialize in mobile app design and have created award-winning interfaces. I would love to work on your project.',
      bidAmount: 2800,
      timeline: {
        duration: 25,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Research & Wireframes',
          description: 'User research and wireframe creation',
          amount: 800,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'UI Design',
          description: 'High-fidelity UI designs for all screens',
          amount: 1500,
          dueDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Prototype & Handoff',
          description: 'Interactive prototype and developer handoff',
          amount: 500,
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        },
      ],
      status: 'accepted',
    },
    {
      project: docProject._id,
      freelancer: carol._id,
      coverLetter: 'I have written technical documentation for many APIs and can create clear, comprehensive guides for your users.',
      bidAmount: 2000,
      timeline: {
        duration: 18,
        unit: 'days',
      },
      milestones: [
        {
          title: 'API Documentation',
          description: 'Complete API reference documentation',
          amount: 1200,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'User Guides',
          description: 'User guides and tutorials',
          amount: 800,
          dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        },
      ],
      status: 'accepted',
    },
    {
      project: backendProject._id,
      freelancer: alice._id,
      coverLetter: 'I have 5+ years of experience building scalable APIs with Node.js. I can deliver a robust solution.',
      bidAmount: 3500,
      timeline: {
        duration: 28,
        unit: 'days',
      },
      milestones: [
        {
          title: 'API Architecture',
          description: 'Design and implement API structure',
          amount: 1500,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Implementation',
          description: 'Complete API implementation',
          amount: 2000,
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        },
      ],
      status: 'accepted',
    },
    // Rejected proposals
    {
      project: ecommerceProject._id,
      freelancer: bob._id,
      coverLetter: 'I can help with the frontend design of your e-commerce platform.',
      bidAmount: 7500,
      timeline: {
        duration: 60,
        unit: 'days',
      },
      milestones: [],
      status: 'rejected',
    },
    // Withdrawn proposals
    {
      project: marketingProject._id,
      freelancer: carol._id,
      coverLetter: 'I can help with content for your marketing website.',
      bidAmount: 3000,
      timeline: {
        duration: 30,
        unit: 'days',
      },
      milestones: [],
      status: 'withdrawn',
    },
  ];
  
  const createdProposals = await Proposal.insertMany(proposals);
  logger.info(`✅ Created ${createdProposals.length} proposals`);
  
  return createdProposals;
}

async function seedContracts(users: any[], projects: any[], proposals: any[]) {
  logger.info('📄 Seeding contracts...');
  
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  
  const contracts = [];
  
  for (const proposal of acceptedProposals) {
    const project = projects.find(p => p._id.equals(proposal.project));
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (proposal.estimatedDuration || 30));
    
    logger.info(`Creating contract for proposal: ${proposal._id}, amount: ${proposal.bidAmount}`);
    
    const contractData = {
      project: proposal.project,
      client: project.client,
      freelancer: proposal.freelancer,
      proposal: proposal._id,
      title: `Contract for ${project.title}`,
      description: project.description,
      totalAmount: proposal.bidAmount || 1000, // Fallback amount
      currency: 'USD',
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      milestones: (proposal.milestones || []).map((milestone: any, index: number) => {
        const dueDate = new Date();
        dueDate.setDate(startDate.getDate() + (milestone.durationDays || 7) + (index * 7));
        
        return {
          title: milestone.title || `Milestone ${index + 1}`,
          description: milestone.description || `Milestone ${index + 1} description`,
          amount: milestone.amount || Math.floor((proposal.bidAmount || 1000) / (proposal.milestones?.length || 1)),
          dueDate: dueDate,
          status: 'pending',
        };
      }),
      terms: {
        paymentTerms: 'Payment will be released upon milestone completion and client approval.',
        cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
        intellectualProperty: 'All work product created under this contract will be owned by the client.',
        confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
        disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
      },
    };
    
    contracts.push(contractData);
  }
  
  const createdContracts = await Contract.insertMany(contracts);
  logger.info(`✅ Created ${createdContracts.length} contracts`);
  
  return createdContracts;
}

async function seedReviews(users: any[], contracts: any[]) {
  logger.info('⭐ Seeding reviews...');
  
  const reviews = [
    {
      contract: contracts[0]._id,
      project: contracts[0].project,
      reviewer: contracts[0].client,
      reviewee: contracts[0].freelancer,
      rating: 5,
      feedback: 'Excellent work! Alice delivered exactly what we needed on time and within budget. The code quality was outstanding and she was very professional throughout the project.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    },
    {
      contract: contracts[1]._id,
      project: contracts[1].project,
      reviewer: contracts[1].client,
      reviewee: contracts[1].freelancer,
      rating: 4,
      feedback: 'Great design work. Bob was very responsive and incorporated our feedback well. The final deliverable exceeded our expectations and was delivered on schedule.',
      categories: {
        communication: 4,
        quality: 5,
        professionalism: 4,
        deadlines: 4,
      },
      isPublic: true,
    },
  ];
  
  const createdReviews = await Review.insertMany(reviews);
  logger.info(`✅ Created ${createdReviews.length} reviews`);
  
  return createdReviews;
}

async function seedTimeEntries(users: any[], contracts: any[]) {
  logger.info('⏰ Seeding time entries...');
  
  const timeEntries = [
    {
      freelancer: contracts[0].freelancer,
      project: contracts[0].project,
      contract: contracts[0]._id,
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      duration: 28800, // 8 hours
      description: 'Frontend development - user authentication',
      hourlyRate: 75,
      billableAmount: 600,
      status: 'approved',
    },
    {
      freelancer: contracts[0].freelancer,
      project: contracts[0].project,
      contract: contracts[0]._id,
      startTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      duration: 21600, // 6 hours
      description: 'Backend API development',
      hourlyRate: 75,
      billableAmount: 450,
      status: 'approved',
    },
  ];
  
  const createdTimeEntries = await TimeEntry.insertMany(timeEntries);
  logger.info(`✅ Created ${createdTimeEntries.length} time entries`);
  
  return createdTimeEntries;
}

async function seedMessages(users: any[]) {
  logger.info('💬 Seeding messages...');
  
  const { Conversation } = await import('@/models/Message');
  
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  
  // Create conversations first
  const conversations = [
    {
      participants: [client1._id, alice._id],
      unreadCount: new Map([[client1._id.toString(), 0], [alice._id.toString(), 0]]),
    },
    {
      participants: [client2._id, bob._id],
      unreadCount: new Map([[client2._id.toString(), 1], [bob._id.toString(), 0]]),
    },
  ];
  
  const createdConversations = await Conversation.insertMany(conversations);
  logger.info(`✅ Created ${createdConversations.length} conversations`);
  
  // Create messages for conversations
  const messages = [
    {
      conversation: createdConversations[0]._id,
      sender: client1._id,
      content: 'Hi Alice, I reviewed your proposal for the e-commerce project. Can we discuss the timeline?',
      type: 'text',
      readBy: [client1._id, alice._id],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      conversation: createdConversations[0]._id,
      sender: alice._id,
      content: 'Sure! I can start next week and deliver within 45 days. Let me know if you have any questions.',
      type: 'text',
      readBy: [client1._id, alice._id],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
    },
    {
      conversation: createdConversations[0]._id,
      sender: client1._id,
      content: 'That sounds perfect! Let\'s move forward with the project.',
      type: 'text',
      readBy: [client1._id, alice._id],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      conversation: createdConversations[1]._id,
      sender: client2._id,
      content: 'Great work on the design mockups! Can you make a few adjustments to the color scheme?',
      type: 'text',
      readBy: [client2._id],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      conversation: createdConversations[1]._id,
      sender: bob._id,
      content: 'Absolutely! I\'ll update the color palette and send you the revised mockups by tomorrow.',
      type: 'text',
      readBy: [client2._id, bob._id],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];
  
  const createdMessages = await Message.insertMany(messages);
  logger.info(`✅ Created ${createdMessages.length} messages`);
  
  // Update conversations with last message
  await Conversation.findByIdAndUpdate(createdConversations[0]._id, {
    lastMessage: createdMessages[2]._id,
  });
  await Conversation.findByIdAndUpdate(createdConversations[1]._id, {
    lastMessage: createdMessages[4]._id,
  });
  
  return createdMessages;
}

async function seedNotifications(users: any[]) {
  logger.info('🔔 Seeding notifications...');
  
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const client1 = users.find(u => u.email === 'john.client@example.com');
  
  const notifications = [
    {
      user: alice._id,
      type: 'proposal',
      title: 'Proposal Accepted',
      message: 'Your proposal for "Backend API Development" has been accepted!',
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user: bob._id,
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from Sarah Johnson',
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user: client1._id,
      type: 'proposal',
      title: 'New Proposal',
      message: 'You received a new proposal for "E-commerce Website Development"',
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      user: alice._id,
      type: 'contract',
      title: 'Contract Signed',
      message: 'Contract for "Mobile App UI/UX Design" has been signed by the client',
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      user: client1._id,
      type: 'payment',
      title: 'Payment Processed',
      message: 'Payment of $1,500 has been processed for milestone completion',
      isRead: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      user: bob._id,
      type: 'review',
      title: 'New Review',
      message: 'You received a 5-star review from Sarah Johnson',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user: alice._id,
      type: 'project',
      title: 'New Project Match',
      message: 'A new project matching your skills has been posted: "Python Data Analysis Script"',
      isRead: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ];
  
  const createdNotifications = await Notification.insertMany(notifications);
  logger.info(`✅ Created ${createdNotifications.length} notifications`);
  
  return createdNotifications;
}

async function seedPayments(users: any[], contracts: any[]) {
  logger.info('💰 Seeding payments...');
  
  const { Payment } = await import('@/models/Payment');
  
  const payments = [];
  
  // Create payments for completed milestones
  for (const contract of contracts.slice(0, 2)) {
    // Payment for first milestone
    payments.push({
      contract: contract._id,
      milestone: contract.milestones[0]._id,
      client: contract.client,
      freelancer: contract.freelancer,
      amount: contract.milestones[0].amount,
      currency: 'USD',
      type: 'milestone_payment',
      status: 'completed',
      stripePaymentIntentId: `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platformFee: contract.milestones[0].amount * 0.1, // 10% platform fee
      freelancerAmount: contract.milestones[0].amount * 0.9,
      processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });
  }
  
  // Add some pending payments
  if (contracts.length > 2) {
    payments.push({
      contract: contracts[2]._id,
      milestone: contracts[2].milestones[0]._id,
      client: contracts[2].client,
      freelancer: contracts[2].freelancer,
      amount: contracts[2].milestones[0].amount,
      currency: 'USD',
      type: 'milestone_payment',
      status: 'pending',
      stripePaymentIntentId: `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platformFee: contracts[2].milestones[0].amount * 0.1,
      freelancerAmount: contracts[2].milestones[0].amount * 0.9,
    });
  }
  
  const createdPayments = await Payment.insertMany(payments);
  logger.info(`✅ Created ${createdPayments.length} payments`);
  
  return createdPayments;
}

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in order (due to dependencies)
    const users = await seedUsers();
    const organizations = await seedOrganizations(users);
    const projects = await seedProjects(users, organizations);
    const servicePackages = await seedServicePackages(users);
    const proposals = await seedProposals(users, projects);
    const contracts = await seedContracts(users, projects, proposals);
    const reviews = await seedReviews(users, contracts);
    const timeEntries = await seedTimeEntries(users, contracts);
    const payments = await seedPayments(users, contracts);
    const messages = await seedMessages(users);
    const notifications = await seedNotifications(users);
    
    logger.info('✅ Database seeding completed successfully');
    logger.info(`📊 Summary:
    - Users: ${users.length}
    - Organizations: ${organizations.length}
    - Projects: ${projects.length}
    - Service Packages: ${servicePackages.length}
    - Proposals: ${proposals.length}
    - Contracts: ${contracts.length}
    - Reviews: ${reviews.length}
    - Time Entries: ${timeEntries.length}
    - Payments: ${payments.length}
    - Messages: ${messages.length}
    - Notifications: ${notifications.length}`);
    
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
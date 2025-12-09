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
import { Category } from '@/models/Category';
import { Skill } from '@/models/Skill';
import { HireNowRequest } from '@/models/HireNowRequest';
import { PlatformSettings } from '@/models/PlatformSettings';
import { Settings } from '@/models/Settings';
import { generateEnhancedUsers, generateAdditionalProjects, generateAdditionalProposals } from './enhancedSeedData';
import { seedClientProjectsAndReviews } from './seedClientData';
import { enhanceSeedData } from './seedEnhanced';

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
  
  const { Conversation } = await import('@/models/Conversation');
  const { Payment } = await import('@/models/Payment');
  const { Transaction } = await import('@/models/Transaction');
  
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
  await Category.deleteMany({});
  await Skill.deleteMany({});
  await HireNowRequest.deleteMany({});
  await PlatformSettings.deleteMany({});
  await Settings.deleteMany({});
  await Transaction.deleteMany({});
  
  const { Dispute } = await import('@/models/Dispute');
  await Dispute.deleteMany({});
  
  logger.info('✅ Database cleared');
}

async function seedCategories(adminId: any) {
  logger.info('📁 Seeding categories...');
  
  const categories = [
    { name: 'Web Development', slug: 'web-development', description: 'Full-stack, frontend, and backend web development', icon: '💻', createdBy: adminId },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS, Android, and cross-platform mobile apps', icon: '📱', createdBy: adminId },
    { name: 'UI/UX Design', slug: 'ui-ux-design', description: 'User interface and user experience design', icon: '🎨', createdBy: adminId },
    { name: 'Graphic Design', slug: 'graphic-design', description: 'Logo design, branding, and visual identity', icon: '🖼️', createdBy: adminId },
    { name: 'Data Science', slug: 'data-science', description: 'Data analysis, machine learning, and AI', icon: '📊', createdBy: adminId },
    { name: 'DevOps', slug: 'devops', description: 'CI/CD, cloud infrastructure, and automation', icon: '⚙️', createdBy: adminId },
    { name: 'Content Writing', slug: 'content-writing', description: 'Blog posts, articles, and copywriting', icon: '✍️', createdBy: adminId },
    { name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, social media, and online advertising', icon: '📈', createdBy: adminId },
    { name: 'Video & Animation', slug: 'video-animation', description: 'Video editing, motion graphics, and 3D animation', icon: '🎬', createdBy: adminId },
    { name: 'Game Development', slug: 'game-development', description: 'Game design, programming, and asset creation', icon: '🎮', createdBy: adminId },
    { name: 'Blockchain', slug: 'blockchain', description: 'Smart contracts, DApps, and cryptocurrency', icon: '⛓️', createdBy: adminId },
    { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security audits, penetration testing, and compliance', icon: '🔒', createdBy: adminId },
  ];
  
  const createdCategories = await Category.insertMany(categories);
  logger.info(`✅ Created ${createdCategories.length} categories`);
  
  return createdCategories;
}

async function seedSkills(categories: any[], adminId: any) {
  logger.info('🛠️ Seeding skills...');
  
  const webDev = categories.find(c => c.slug === 'web-development');
  const mobileDev = categories.find(c => c.slug === 'mobile-development');
  const uiux = categories.find(c => c.slug === 'ui-ux-design');
  const graphicDesign = categories.find(c => c.slug === 'graphic-design');
  const dataScience = categories.find(c => c.slug === 'data-science');
  const devops = categories.find(c => c.slug === 'devops');
  const writing = categories.find(c => c.slug === 'content-writing');
  const marketing = categories.find(c => c.slug === 'digital-marketing');
  const video = categories.find(c => c.slug === 'video-animation');
  const gaming = categories.find(c => c.slug === 'game-development');
  const blockchain = categories.find(c => c.slug === 'blockchain');
  const security = categories.find(c => c.slug === 'cybersecurity');
  
  const skills = [
    // Web Development
    { name: 'React', slug: 'react', category: webDev._id, createdBy: adminId },
    { name: 'Vue.js', slug: 'vuejs', category: webDev._id, createdBy: adminId },
    { name: 'Angular', slug: 'angular', category: webDev._id, createdBy: adminId },
    { name: 'Node.js', slug: 'nodejs', category: webDev._id },
    { name: 'Express.js', slug: 'expressjs', category: webDev._id },
    { name: 'TypeScript', slug: 'typescript', category: webDev._id },
    { name: 'JavaScript', slug: 'javascript', category: webDev._id },
    { name: 'HTML/CSS', slug: 'html-css', category: webDev._id },
    { name: 'MongoDB', slug: 'mongodb', category: webDev._id },
    { name: 'PostgreSQL', slug: 'postgresql', category: webDev._id },
    { name: 'MySQL', slug: 'mysql', category: webDev._id },
    { name: 'GraphQL', slug: 'graphql', category: webDev._id },
    { name: 'REST API', slug: 'rest-api', category: webDev._id },
    { name: 'Next.js', slug: 'nextjs', category: webDev._id },
    { name: 'Tailwind CSS', slug: 'tailwind-css', category: webDev._id },
    
    // Mobile Development
    { name: 'React Native', slug: 'react-native', category: mobileDev._id },
    { name: 'Flutter', slug: 'flutter', category: mobileDev._id },
    { name: 'iOS Development', slug: 'ios-development', category: mobileDev._id },
    { name: 'Android Development', slug: 'android-development', category: mobileDev._id },
    { name: 'Swift', slug: 'swift', category: mobileDev._id },
    { name: 'Kotlin', slug: 'kotlin', category: mobileDev._id },
    { name: 'Firebase', slug: 'firebase', category: mobileDev._id },
    
    // UI/UX Design
    { name: 'Figma', slug: 'figma', category: uiux._id },
    { name: 'Adobe XD', slug: 'adobe-xd', category: uiux._id },
    { name: 'Sketch', slug: 'sketch', category: uiux._id },
    { name: 'Prototyping', slug: 'prototyping', category: uiux._id },
    { name: 'User Research', slug: 'user-research', category: uiux._id },
    { name: 'Wireframing', slug: 'wireframing', category: uiux._id },
    { name: 'Design Systems', slug: 'design-systems', category: uiux._id },
    
    // Graphic Design
    { name: 'Adobe Photoshop', slug: 'adobe-photoshop', category: graphicDesign._id },
    { name: 'Adobe Illustrator', slug: 'adobe-illustrator', category: graphicDesign._id },
    { name: 'Logo Design', slug: 'logo-design', category: graphicDesign._id },
    { name: 'Branding', slug: 'branding', category: graphicDesign._id },
    { name: 'Print Design', slug: 'print-design', category: graphicDesign._id },
    
    // Data Science
    { name: 'Python', slug: 'python', category: dataScience._id },
    { name: 'Machine Learning', slug: 'machine-learning', category: dataScience._id },
    { name: 'TensorFlow', slug: 'tensorflow', category: dataScience._id },
    { name: 'PyTorch', slug: 'pytorch', category: dataScience._id },
    { name: 'Data Analysis', slug: 'data-analysis', category: dataScience._id },
    { name: 'Pandas', slug: 'pandas', category: dataScience._id },
    { name: 'NumPy', slug: 'numpy', category: dataScience._id },
    { name: 'SQL', slug: 'sql', category: dataScience._id },
    
    // DevOps
    { name: 'Docker', slug: 'docker', category: devops._id },
    { name: 'Kubernetes', slug: 'kubernetes', category: devops._id },
    { name: 'AWS', slug: 'aws', category: devops._id },
    { name: 'Azure', slug: 'azure', category: devops._id },
    { name: 'Jenkins', slug: 'jenkins', category: devops._id },
    { name: 'Terraform', slug: 'terraform', category: devops._id },
    { name: 'CI/CD', slug: 'ci-cd', category: devops._id },
    
    // Content Writing
    { name: 'Technical Writing', slug: 'technical-writing', category: writing._id },
    { name: 'Copywriting', slug: 'copywriting', category: writing._id },
    { name: 'Content Strategy', slug: 'content-strategy', category: writing._id },
    { name: 'Blog Writing', slug: 'blog-writing', category: writing._id },
    
    // Digital Marketing
    { name: 'SEO', slug: 'seo', category: marketing._id },
    { name: 'Google Analytics', slug: 'google-analytics', category: marketing._id },
    { name: 'Social Media Marketing', slug: 'social-media-marketing', category: marketing._id },
    { name: 'Email Marketing', slug: 'email-marketing', category: marketing._id },
    { name: 'PPC Advertising', slug: 'ppc-advertising', category: marketing._id },
    
    // Video & Animation
    { name: 'Video Editing', slug: 'video-editing', category: video._id },
    { name: 'Adobe Premiere', slug: 'adobe-premiere', category: video._id },
    { name: 'After Effects', slug: 'after-effects', category: video._id },
    { name: '3D Animation', slug: '3d-animation', category: video._id },
    { name: 'Motion Graphics', slug: 'motion-graphics', category: video._id },
    
    // Game Development
    { name: 'Unity', slug: 'unity', category: gaming._id },
    { name: 'Unreal Engine', slug: 'unreal-engine', category: gaming._id },
    { name: 'C#', slug: 'csharp', category: gaming._id },
    { name: 'C++', slug: 'cpp', category: gaming._id },
    { name: 'Game Design', slug: 'game-design', category: gaming._id },
    
    // Blockchain
    { name: 'Solidity', slug: 'solidity', category: blockchain._id },
    { name: 'Smart Contracts', slug: 'smart-contracts', category: blockchain._id },
    { name: 'Web3', slug: 'web3', category: blockchain._id },
    { name: 'Ethereum', slug: 'ethereum', category: blockchain._id },
    
    // Cybersecurity
    { name: 'Penetration Testing', slug: 'penetration-testing', category: security._id },
    { name: 'Security Audits', slug: 'security-audits', category: security._id },
    { name: 'Network Security', slug: 'network-security', category: security._id },
    { name: 'Ethical Hacking', slug: 'ethical-hacking', category: security._id },
  ];
  
  // Add createdBy to all skills
  const skillsWithCreator = skills.map(skill => ({ ...skill, createdBy: adminId }));
  
  const createdSkills = await Skill.insertMany(skillsWithCreator);
  logger.info(`✅ Created ${createdSkills.length} skills`);
  
  return createdSkills;
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
      isVerified: true,
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
      isVerified: true,
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
      isVerified: true,
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
        bio: 'Passionate full-stack developer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies. I love turning complex problems into elegant solutions and have successfully delivered 50+ projects for clients worldwide.',
        location: 'Austin, TX',
        timezone: 'America/Chicago',
      },
      freelancerProfile: {
        title: 'Senior Full-Stack Developer',
        hourlyRate: 75,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL', 'Redis', 'CI/CD'],
        experience: '5+ years of professional software development experience. Previously worked at tech startups and Fortune 500 companies. Expert in building RESTful APIs, microservices architecture, and modern frontend applications.',
        availability: {
          status: 'available',
        },
        portfolio: [
          {
            title: 'E-commerce Platform',
            description: 'Built a full-featured e-commerce platform with React, Node.js, and Stripe integration. Handles 10k+ daily transactions.',
            images: [],
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS'],
            completedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Real-time Analytics Dashboard',
            description: 'Developed a real-time analytics dashboard for a SaaS company using React, WebSockets, and D3.js.',
            images: [],
            technologies: ['React', 'WebSocket', 'D3.js', 'Node.js'],
            completedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            dateEarned: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        ],
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
        bio: 'Award-winning UI/UX Designer with 7+ years of experience creating beautiful, user-centered digital experiences. I specialize in mobile app design, web applications, and design systems. My work has been featured in Awwwards and CSS Design Awards.',
        location: 'Los Angeles, CA',
        timezone: 'America/Los_Angeles',
      },
      freelancerProfile: {
        title: 'Senior UI/UX Designer',
        hourlyRate: 65,
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems', 'Responsive Design', 'Mobile Design', 'Usability Testing'],
        experience: '7+ years designing digital products for startups and enterprises. Expert in user research, information architecture, and creating pixel-perfect designs that convert.',
        availability: {
          status: 'available',
        },
        portfolio: [
          {
            title: 'Mobile Banking App',
            description: 'Redesigned a mobile banking app that increased user engagement by 45% and reduced support tickets by 30%.',
            images: [],
            technologies: ['Figma', 'Prototyping', 'User Testing'],
            completedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'SaaS Dashboard Design',
            description: 'Created a comprehensive design system and dashboard for a B2B SaaS platform serving 50k+ users.',
            images: [],
            technologies: ['Figma', 'Design System', 'Component Library'],
            completedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          },
        ],
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
  
  // Add enhanced users (50+ total)
  const enhancedUsers = await generateEnhancedUsers();
  users.push(...enhancedUsers);
  
  const createdUsers = await User.insertMany(users);
  
  logger.info(`✅ Created ${createdUsers.length} users`);
  
  // Mark some freelancers as featured
  const alice = createdUsers.find(u => u.email === 'alice.dev@example.com');
  const bob = createdUsers.find(u => u.email === 'bob.designer@example.com');
  const david = createdUsers.find(u => u.email === 'david.mobile@example.com');
  
  if (alice) {
    alice.isFeatured = true;
    alice.featuredOrder = 1;
    alice.featuredSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await alice.save();
  }
  
  if (bob) {
    bob.isFeatured = true;
    bob.featuredOrder = 2;
    bob.featuredSince = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    await bob.save();
  }
  
  if (david) {
    david.isFeatured = true;
    david.featuredOrder = 3;
    david.featuredSince = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await david.save();
  }
  
  // Add work experience and education to freelancers
  if (alice && alice.freelancerProfile) {
    (alice.freelancerProfile as any).workExperience = [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Innovations Inc.',
        location: 'San Francisco, CA',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2023-06-01'),
        current: false,
        description: 'Led development of microservices architecture serving 1M+ users. Mentored junior developers and established best practices for code quality.',
      },
      {
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Austin, TX',
        startDate: new Date('2018-03-01'),
        endDate: new Date('2019-12-01'),
        current: false,
        description: 'Built and maintained multiple web applications using React and Node.js. Implemented CI/CD pipelines and automated testing.',
      },
    ];
    (alice.freelancerProfile as any).education = [
      {
        degree: 'Bachelor of Science',
        institution: 'University of Texas',
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2014-09-01'),
        endDate: new Date('2018-05-01'),
        description: 'Graduated with honors. Focus on software engineering and algorithms.',
      },
    ];
    (alice.freelancerProfile as any).languages = [
      { language: 'English', proficiency: 'native' },
      { language: 'Spanish', proficiency: 'conversational' },
    ];
    await alice.save();
  }
  
  if (bob && bob.freelancerProfile) {
    (bob.freelancerProfile as any).workExperience = [
      {
        title: 'Lead UI/UX Designer',
        company: 'Design Studio Pro',
        location: 'Los Angeles, CA',
        startDate: new Date('2019-06-01'),
        current: true,
        description: 'Leading design team of 5 designers. Created design systems for Fortune 500 clients. Won multiple design awards.',
      },
      {
        title: 'UI Designer',
        company: 'Creative Agency',
        location: 'Los Angeles, CA',
        startDate: new Date('2016-01-01'),
        endDate: new Date('2019-05-01'),
        current: false,
        description: 'Designed user interfaces for web and mobile applications. Conducted user research and usability testing.',
      },
    ];
    (bob.freelancerProfile as any).education = [
      {
        degree: 'Bachelor of Fine Arts',
        institution: 'Art Center College of Design',
        fieldOfStudy: 'Graphic Design',
        startDate: new Date('2012-09-01'),
        endDate: new Date('2016-05-01'),
        description: 'Specialized in digital design and user experience.',
      },
    ];
    (bob.freelancerProfile as any).languages = [
      { language: 'English', proficiency: 'native' },
      { language: 'French', proficiency: 'fluent' },
    ];
    await bob.save();
  }
  
  if (david && david.freelancerProfile) {
    (david.freelancerProfile as any).workExperience = [
      {
        title: 'Mobile App Developer',
        company: 'App Solutions LLC',
        location: 'Miami, FL',
        startDate: new Date('2020-01-01'),
        current: true,
        description: 'Developing cross-platform mobile applications using React Native and Flutter. Published 10+ apps on App Store and Google Play.',
      },
    ];
    (david.freelancerProfile as any).education = [
      {
        degree: 'Bachelor of Science',
        institution: 'Florida International University',
        fieldOfStudy: 'Software Engineering',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-05-01'),
        description: 'Focus on mobile development and user interface design.',
      },
    ];
    (david.freelancerProfile as any).languages = [
      { language: 'English', proficiency: 'native' },
      { language: 'Spanish', proficiency: 'native' },
    ];
    await david.save();
  }
  
  logger.info(`✅ Created ${createdUsers.length} users (${alice && bob && david ? '3' : '0'} featured)`);
  
  return createdUsers;
}

async function seedOrganizations(users: any[]) {
  logger.info('🏢 Seeding organizations...');
  
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  
  const organizations = [
    {
      name: 'TechCorp Solutions',
      description: 'Leading technology solutions provider specializing in enterprise software',
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
      budget: {
        total: 50000,
        spent: 12500,
        remaining: 37500,
      },
      budgetSettings: {
        monthlyBudget: 50000,
        approvalThreshold: 5000,
        autoApproveBelow: 1000,
      },
    },
    {
      name: 'StartupXYZ',
      description: 'Innovative startup disrupting the market with AI solutions',
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
      budget: {
        total: 20000,
        spent: 8000,
        remaining: 12000,
      },
      budgetSettings: {
        monthlyBudget: 20000,
        approvalThreshold: 2000,
        autoApproveBelow: 500,
      },
    },
    {
      name: 'Digital Marketing Pro',
      description: 'Full-service digital marketing agency',
      industry: 'Marketing',
      size: '11-50',
      owner: client1._id,
      members: [
        {
          user: client1._id,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
      budget: {
        total: 35000,
        spent: 15000,
        remaining: 20000,
      },
      budgetSettings: {
        monthlyBudget: 35000,
        approvalThreshold: 3500,
        autoApproveBelow: 750,
      },
    },
    {
      name: 'CloudFirst Systems',
      description: 'Cloud infrastructure and DevOps consulting',
      industry: 'Technology',
      size: '51-200',
      owner: client2._id,
      members: [
        {
          user: client2._id,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
      budget: {
        total: 75000,
        spent: 22500,
        remaining: 52500,
      },
      budgetSettings: {
        monthlyBudget: 75000,
        approvalThreshold: 7500,
        autoApproveBelow: 1500,
      },
    },
    {
      name: 'Creative Studios Inc',
      description: 'Design and creative content production',
      industry: 'Design',
      size: '11-50',
      owner: client1._id,
      members: [
        {
          user: client1._id,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
      budget: {
        total: 30000,
        spent: 9000,
        remaining: 21000,
      },
      budgetSettings: {
        monthlyBudget: 30000,
        approvalThreshold: 3000,
        autoApproveBelow: 600,
      },
    },
    {
      name: 'DataViz Analytics',
      description: 'Business intelligence and data visualization services',
      industry: 'Analytics',
      size: '1-10',
      owner: client2._id,
      members: [
        {
          user: client2._id,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
      budget: {
        total: 25000,
        spent: 5000,
        remaining: 20000,
      },
      budgetSettings: {
        monthlyBudget: 25000,
        approvalThreshold: 2500,
        autoApproveBelow: 500,
      },
    },
  ];
  
  const createdOrgs = await Organization.insertMany(organizations);
  logger.info(`✅ Created ${createdOrgs.length} organizations`);
  
  return createdOrgs;
}

async function seedProjects(users: any[], organizations: any[], categories: any[]) {
  logger.info('📋 Seeding projects...');
  
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  
  // Get category IDs
  const webDevCat = categories.find(c => c.slug === 'web-development')?._id;
  const designCat = categories.find(c => c.slug === 'ui-ux-design')?._id;
  const mobileCat = categories.find(c => c.slug === 'mobile-development')?._id;
  const writingCat = categories.find(c => c.slug === 'content-writing')?._id;
  const marketingCat = categories.find(c => c.slug === 'digital-marketing')?._id;
  const dataScienceCat = categories.find(c => c.slug === 'data-science')?._id;
  const devopsCat = categories.find(c => c.slug === 'devops')?._id;
  const videoCat = categories.find(c => c.slug === 'video-animation')?._id;
  const blockchainCat = categories.find(c => c.slug === 'blockchain')?._id;
  
  // Get all skills for mapping names to IDs
  const allSkills = await Skill.find();
  const skillNameToId = new Map(allSkills.map(s => [s.name, s._id]));
  
  // Helper function to convert skill names to ObjectIds
  const getSkillIds = (skillNames: string[]): any[] => {
    return skillNames
      .map(name => skillNameToId.get(name))
      .filter(id => id !== undefined);
  };
  
  const projects = [
    // Open projects
    {
      title: 'E-commerce Website Development',
      description: 'Build a modern e-commerce platform with React and Node.js',
      category: webDevCat,
      budget: { 
        type: 'fixed',
        min: 5000, 
        max: 8000 
      },
      timeline: {
        duration: 60,
        unit: 'days',
      },
      skills: getSkillIds(['React', 'Node.js', 'MongoDB']),
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
      category: designCat,
      budget: { 
        type: 'fixed',
        min: 2000, 
        max: 3500 
      },
      timeline: {
        duration: 30,
        unit: 'days',
      },
      skills: getSkillIds(['Figma', 'Prototyping']),
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
      category: webDevCat,
      budget: { 
        type: 'fixed',
        min: 3000, 
        max: 5000 
      },
      timeline: {
        duration: 45,
        unit: 'days',
      },
      skills: getSkillIds(['React', 'SEO']),
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
      category: writingCat,
      budget: { 
        type: 'fixed',
        min: 1500, 
        max: 2500 
      },
      timeline: {
        duration: 21,
        unit: 'days',
      },
      skills: getSkillIds(['Technical Writing']),
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
      category: webDevCat,
      budget: { 
        type: 'hourly',
        min: 50, 
        max: 80 
      },
      timeline: {
        duration: 30,
        unit: 'days',
      },
      skills: getSkillIds(['Node.js', 'Express.js', 'MongoDB', 'REST API']),
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
      category: designCat,
      budget: { 
        type: 'fixed',
        min: 500, 
        max: 1000 
      },
      timeline: {
        duration: 7,
        unit: 'days',
      },
      skills: getSkillIds(['Logo Design', 'Branding']),
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
      category: webDevCat,
      budget: { 
        type: 'fixed',
        min: 2000, 
        max: 3000 
      },
      timeline: {
        duration: 20,
        unit: 'days',
      },
      skills: getSkillIds(['JavaScript']),
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
      category: marketingCat,
      budget: { 
        type: 'fixed',
        min: 1000, 
        max: 1500 
      },
      timeline: {
        duration: 90,
        unit: 'days',
      },
      skills: getSkillIds(['Social Media Marketing']),
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
      category: dataScienceCat,
      budget: { 
        type: 'fixed',
        min: 1500, 
        max: 2500 
      },
      timeline: {
        duration: 15,
        unit: 'days',
      },
      skills: getSkillIds(['Python', 'Pandas', 'Data Analysis']),
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
      category: mobileCat,
      budget: { 
        type: 'fixed',
        min: 8000, 
        max: 12000 
      },
      timeline: {
        duration: 90,
        unit: 'days',
      },
      skills: getSkillIds(['React Native', 'Firebase', 'REST API']),
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
      category: marketingCat,
      budget: { 
        type: 'fixed',
        min: 2000, 
        max: 3500 
      },
      timeline: {
        duration: 45,
        unit: 'days',
      },
      skills: getSkillIds(['SEO', 'Google Analytics']),
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
      category: devopsCat,
      budget: { 
        type: 'fixed',
        min: 4000, 
        max: 6000 
      },
      timeline: {
        duration: 30,
        unit: 'days',
      },
      skills: getSkillIds(['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Terraform']),
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
      category: videoCat,
      budget: { 
        type: 'fixed',
        min: 1000, 
        max: 1800 
      },
      timeline: {
        duration: 20,
        unit: 'days',
      },
      skills: getSkillIds(['Video Editing', 'Adobe Premiere', 'After Effects']),
      requirements: [
        'Professional editing',
        'Intro/outro animations',
        'Subtitles',
        'Thumbnail design',
      ],
      client: users.find(u => u.email === 'michael.startup@example.com')?._id || client1._id,
      status: 'open',
    },
    // Draft projects
    {
      title: 'Machine Learning Model Development',
      description: 'Build a machine learning model for customer churn prediction',
      category: dataScienceCat,
      budget: { 
        type: 'fixed',
        min: 5000, 
        max: 8000 
      },
      timeline: {
        duration: 45,
        unit: 'days',
      },
      skills: getSkillIds(['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis']),
      requirements: [
        'Data preprocessing',
        'Model training',
        'Performance evaluation',
        'Documentation',
      ],
      client: users.find(u => u.email === 'lisa.enterprise@example.com')?._id || client2._id,
      status: 'draft',
      isDraft: true,
      draftSavedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Blockchain Smart Contract Development',
      description: 'Develop smart contracts for NFT marketplace',
      category: blockchainCat,
      budget: { 
        type: 'fixed',
        min: 10000, 
        max: 15000 
      },
      timeline: {
        duration: 60,
        unit: 'days',
      },
      skills: getSkillIds(['Solidity', 'Smart Contracts', 'Web3', 'Ethereum']),
      requirements: [
        'NFT minting contract',
        'Marketplace contract',
        'Security audit',
        'Testing',
      ],
      client: users.find(u => u.email === 'michael.startup@example.com')?._id || client1._id,
      status: 'draft',
      isDraft: true,
      draftSavedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Corporate Website Redesign',
      description: 'Complete redesign of corporate website with modern UI',
      category: webDevCat,
      budget: { 
        type: 'fixed',
        min: 8000, 
        max: 12000 
      },
      timeline: {
        duration: 60,
        unit: 'days',
      },
      skills: getSkillIds(['React', 'TypeScript', 'Tailwind CSS']),
      requirements: [
        'Responsive design',
        'CMS integration',
        'SEO optimization',
        'Performance optimization',
      ],
      client: users.find(u => u.email === 'lisa.enterprise@example.com')?._id || client2._id,
      status: 'draft',
      isDraft: true,
      draftSavedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];
  
  // Add enhanced projects (100+ total)
  const additionalProjects = generateAdditionalProjects(users, categories, skillNameToId);
  projects.push(...additionalProjects);
  
  const createdProjects = await Project.insertMany(projects);
  logger.info(`✅ Created ${createdProjects.length} projects (${projects.filter(p => p.isDraft).length} drafts)`);
  
  return createdProjects;
}

async function seedServicePackages(users: any[]) {
  logger.info('📦 Seeding service packages...');
  
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const carol = users.find(u => u.email === 'carol.writer@example.com');
  
  // Get categories
  const categories = await Category.find();
  const webDevCat = categories.find(c => c.slug === 'web-development')?._id;
  const designCat = categories.find(c => c.slug === 'ui-ux-design')?._id;
  const writingCat = categories.find(c => c.slug === 'content-writing')?._id;
  
  const packages = [
    {
      freelancer: alice._id,
      title: 'Full-Stack Web Application',
      description: 'Complete web application development with modern technologies',
      category: webDevCat,
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
      category: designCat,
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
      category: writingCat,
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
      coverLetter: 'I can help with the frontend design of your e-commerce platform. With my expertise in UI/UX design, I will create a beautiful and user-friendly interface.',
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
      coverLetter: 'I can help with content for your marketing website. I specialize in creating engaging copy that converts visitors into customers.',
      bidAmount: 3000,
      timeline: {
        duration: 30,
        unit: 'days',
      },
      milestones: [],
      status: 'withdrawn',
    },
  ];
  
  // Add enhanced proposals (200+ total)
  // Note: We generate proposals carefully to avoid duplicate project-freelancer combinations
  const freelancers = users.filter(u => u.role === 'freelancer');
  const additionalProposals = generateAdditionalProposals(freelancers, projects);
  
  // Filter out any proposals that would create duplicates with hardcoded proposals
  const hardcodedCombinations = new Set(proposals.map(p => `${p.project}-${p.freelancer}`));
  const filteredAdditionalProposals = additionalProposals.filter(p => {
    const key = `${p.project}-${p.freelancer}`;
    return !hardcodedCombinations.has(key);
  });
  
  proposals.push(...filteredAdditionalProposals);
  
  const createdProposals = await Proposal.insertMany(proposals);
  logger.info(`✅ Created ${createdProposals.length} proposals`);
  
  return createdProposals;
}

async function seedHireNowRequests(users: any[]) {
  logger.info('🤝 Seeding hire now requests...');
  
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  const michael = users.find(u => u.email === 'michael.startup@example.com');
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const carol = users.find(u => u.email === 'carol.writer@example.com');
  const emma = users.find(u => u.email === 'emma.data@example.com');
  
  const hireNowRequests = [
    // Pending request
    {
      client: client1._id,
      freelancer: alice._id,
      projectTitle: 'Quick Website Fix',
      projectDescription: 'Need urgent help fixing a bug in our production website. Should take 2-3 hours.',
      budget: 300,
      timeline: {
        duration: 3,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Bug Fix',
          description: 'Identify and fix the production bug',
          amount: 300,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      ],
      message: 'Hi Alice, we have an urgent bug that needs fixing. Can you help us out?',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    // Accepted request
    {
      client: client2._id,
      freelancer: bob._id,
      projectTitle: 'Logo Redesign',
      projectDescription: 'Redesign our company logo with a modern look',
      budget: 800,
      timeline: {
        duration: 7,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Initial Concepts',
          description: 'Provide 3 logo concepts',
          amount: 400,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Final Logo',
          description: 'Deliver final logo with all file formats',
          amount: 400,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ],
      message: 'Love your portfolio! Would you be interested in redesigning our logo?',
      status: 'accepted',
      respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      responseMessage: 'Thank you! I would love to work on this project.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    // Rejected request
    {
      client: michael._id,
      freelancer: emma._id,
      projectTitle: 'Data Analysis Project',
      projectDescription: 'Analyze customer data and provide insights',
      budget: 1500,
      timeline: {
        duration: 14,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Data Analysis',
          description: 'Complete analysis and report',
          amount: 1500,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      ],
      message: 'We need help analyzing our customer data. Are you available?',
      status: 'rejected',
      respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      responseMessage: 'Thank you for reaching out, but I am currently fully booked.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    // Another pending request
    {
      client: michael._id,
      freelancer: carol._id,
      projectTitle: 'Blog Content Writing',
      projectDescription: 'Write 5 blog posts for our company blog',
      budget: 500,
      timeline: {
        duration: 10,
        unit: 'days',
      },
      milestones: [
        {
          title: 'Blog Posts',
          description: 'Deliver 5 SEO-optimized blog posts',
          amount: 500,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
      ],
      message: 'We need quality blog content. Can you help?',
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];
  
  const createdRequests = await HireNowRequest.insertMany(hireNowRequests);
  logger.info(`✅ Created ${createdRequests.length} hire now requests`);
  
  return createdRequests;
}

async function seedContracts(users: any[], projects: any[], proposals: any[], hireNowRequests: any[]) {
  logger.info('📄 Seeding contracts...');
  
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  const acceptedHireNowRequests = hireNowRequests.filter((r: any) => r.status === 'accepted');
  
  const contracts = [];
  
  for (const proposal of acceptedProposals) {
    const project = projects.find(p => p._id.equals(proposal.project));
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (proposal.estimatedDuration || 30));
    
    const totalAmount = proposal.bidAmount || 1000;
    
    // Create milestones ensuring they sum to totalAmount
    let milestones = [];
    if (proposal.milestones && proposal.milestones.length > 0) {
      // Use proposal milestones but ensure amounts sum correctly
      const proposalMilestoneTotal = proposal.milestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
      
      if (proposalMilestoneTotal === totalAmount) {
        // Amounts already match, use as-is
        milestones = proposal.milestones.map((milestone: any, index: number) => {
          const dueDate = new Date();
          dueDate.setDate(startDate.getDate() + (milestone.durationDays || 7) + (index * 7));
          return {
            title: milestone.title || `Milestone ${index + 1}`,
            description: milestone.description || `Milestone ${index + 1} description`,
            amount: milestone.amount,
            dueDate: milestone.dueDate || dueDate,
            status: 'pending',
          };
        });
      } else {
        // Adjust amounts proportionally to match totalAmount
        const ratio = totalAmount / (proposalMilestoneTotal || 1);
        let runningTotal = 0;
        milestones = proposal.milestones.map((milestone: any, index: number) => {
          const dueDate = new Date();
          dueDate.setDate(startDate.getDate() + (milestone.durationDays || 7) + (index * 7));
          
          let amount;
          if (index === proposal.milestones.length - 1) {
            // Last milestone gets the remainder to ensure exact total
            amount = totalAmount - runningTotal;
          } else {
            amount = Math.round((milestone.amount || 0) * ratio);
            runningTotal += amount;
          }
          
          return {
            title: milestone.title || `Milestone ${index + 1}`,
            description: milestone.description || `Milestone ${index + 1} description`,
            amount: amount,
            dueDate: milestone.dueDate || dueDate,
            status: 'pending',
          };
        });
      }
    } else {
      // No milestones in proposal, create default ones that sum to totalAmount
      const milestoneCount = 3;
      const baseAmount = Math.floor(totalAmount / milestoneCount);
      const remainder = totalAmount - (baseAmount * (milestoneCount - 1));
      
      milestones = [
        {
          title: 'Phase 1 - Initial Development',
          description: 'Initial setup and core functionality',
          amount: baseAmount,
          dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
        {
          title: 'Phase 2 - Main Development',
          description: 'Main features and integration',
          amount: baseAmount,
          dueDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
        {
          title: 'Phase 3 - Final Delivery',
          description: 'Testing, refinement, and delivery',
          amount: remainder,
          dueDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      ];
    }
    
    // Verify milestone total matches contract total
    const milestoneTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
    logger.info(`Creating contract for proposal: ${proposal._id}, totalAmount: ${totalAmount}, milestoneTotal: ${milestoneTotal}`);
    
    // Generate signatures for both parties (required for active status)
    const signedAt = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // Signed 1 day before start
    const signatures = [
      {
        signedBy: project.client,
        signedAt: signedAt,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        signatureHash: `client-sig-${proposal._id}`,
      },
      {
        signedBy: proposal.freelancer,
        signedAt: new Date(signedAt.getTime() + 60 * 60 * 1000), // Freelancer signed 1 hour later
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        signatureHash: `freelancer-sig-${proposal._id}`,
      },
    ];

    const contractData = {
      project: proposal.project,
      client: project.client,
      freelancer: proposal.freelancer,
      proposal: proposal._id,
      sourceType: 'proposal',
      title: `Contract for ${project.title}`,
      description: project.description,
      totalAmount: totalAmount,
      currency: 'USD',
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      milestones: milestones,
      signatures: signatures,
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
  
  // Create contracts for accepted hire now requests
  logger.info(`📄 Creating contracts for ${acceptedHireNowRequests.length} accepted hire now requests...`);
  
  // Get default category for hire now projects
  const defaultCategory = await Category.findOne({});
  
  for (const hireNowRequest of acceptedHireNowRequests) {
    const startDate = new Date();
    const timelineMultiplier = hireNowRequest.timeline.unit === 'days' ? 1 : hireNowRequest.timeline.unit === 'weeks' ? 7 : 30;
    const endDate = new Date(Date.now() + (hireNowRequest.timeline.duration * timelineMultiplier * 24 * 60 * 60 * 1000));
    
    // Create project for hire now
    const hireNowProject = await Project.create({
      title: hireNowRequest.projectTitle,
      description: hireNowRequest.projectDescription,
      client: hireNowRequest.client,
      category: defaultCategory?._id,
      skills: [],
      budget: {
        type: 'fixed',
        min: hireNowRequest.budget,
        max: hireNowRequest.budget,
      },
      timeline: hireNowRequest.timeline,
      status: 'in_progress',
      selectedFreelancer: hireNowRequest.freelancer,
    });
    
    // Create proposal for hire now
    // Ensure cover letter is at least 50 characters
    const baseCoverLetter = `Direct hire request accepted for project "${hireNowRequest.projectTitle}". ${hireNowRequest.projectDescription}`;
    const coverLetter = baseCoverLetter.length >= 50 ? baseCoverLetter : baseCoverLetter.padEnd(50, ' ');
    
    const hireNowProposal = await Proposal.create({
      project: hireNowProject._id,
      freelancer: hireNowRequest.freelancer,
      coverLetter: coverLetter,
      bidAmount: hireNowRequest.budget,
      timeline: hireNowRequest.timeline,
      milestones: hireNowRequest.milestones.length > 0 ? hireNowRequest.milestones : [{
        title: 'Project Completion',
        description: 'Complete the project as described',
        amount: hireNowRequest.budget,
        dueDate: endDate,
      }],
      status: 'accepted',
    });
    
    // Create milestones for contract
    const hireNowMilestones = hireNowRequest.milestones.length > 0 
      ? hireNowRequest.milestones.map((m: any) => ({
          title: m.title,
          description: m.description || 'Milestone delivery',
          amount: m.amount,
          dueDate: m.dueDate || endDate,
          status: 'pending',
        }))
      : [{
          title: 'Project Completion',
          description: 'Complete the project as described',
          amount: hireNowRequest.budget,
          dueDate: endDate,
          status: 'pending',
        }];
    
    // Generate signatures
    const signedAt = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    const signatures = [
      {
        signedBy: hireNowRequest.client,
        signedAt: signedAt,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        signatureHash: `client-sig-hirenow-${hireNowRequest._id}`,
      },
      {
        signedBy: hireNowRequest.freelancer,
        signedAt: new Date(signedAt.getTime() + 60 * 60 * 1000),
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        signatureHash: `freelancer-sig-hirenow-${hireNowRequest._id}`,
      },
    ];
    
    contracts.push({
      project: hireNowProject._id,
      client: hireNowRequest.client,
      freelancer: hireNowRequest.freelancer,
      proposal: hireNowProposal._id,
      sourceType: 'hire_now',
      hireNowRequest: hireNowRequest._id,
      title: hireNowRequest.projectTitle,
      description: hireNowRequest.projectDescription,
      totalAmount: hireNowRequest.budget,
      currency: 'USD',
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      milestones: hireNowMilestones,
      signatures: signatures,
      terms: {
        paymentTerms: 'Payment will be released upon milestone completion and client approval.',
        cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
        intellectualProperty: 'All work product created under this contract will be owned by the client.',
        confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
        disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
      },
    });
    
    logger.info(`✅ Created hire_now contract for: ${hireNowRequest.projectTitle}`);
  }
  
  // Create contracts for service packages (simulate some orders)
  logger.info('📄 Creating sample service package contracts...');
  
  const servicePackages = await ServicePackage.find({ isActive: true }).limit(2);
  const clients = users.filter(u => u.role === 'client');
  
  for (let i = 0; i < servicePackages.length && i < clients.length; i++) {
    const servicePackage = servicePackages[i];
    const client = clients[i];
    
    const price = servicePackage.pricing.amount || servicePackage.pricing.hourlyRate || 1000;
    const deliveryDays = servicePackage.deliveryTime || 14;
    const startDate = new Date();
    const endDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
    
    // Create project for service
    // Note: servicePackage.skills contains string names, not ObjectIds, so we use empty array
    const serviceProject = await Project.create({
      title: `Service: ${servicePackage.title}`,
      description: servicePackage.description,
      client: client._id,
      category: servicePackage.category || defaultCategory?._id,
      skills: [],
      budget: {
        type: 'fixed',
        min: price,
        max: price,
      },
      timeline: {
        duration: deliveryDays,
        unit: 'days',
      },
      status: 'in_progress',
      selectedFreelancer: servicePackage.freelancer,
    });
    
    // Create proposal for service - ensure cover letter is at least 50 characters
    const serviceCoverLetterBase = `Service package order: ${servicePackage.title}. ${servicePackage.description || 'Professional service delivery as described in the package.'}`;
    const serviceCoverLetter = serviceCoverLetterBase.length >= 50 ? serviceCoverLetterBase : serviceCoverLetterBase.padEnd(50, ' ');
    
    const serviceProposal = await Proposal.create({
      project: serviceProject._id,
      freelancer: servicePackage.freelancer,
      coverLetter: serviceCoverLetter,
      bidAmount: price,
      timeline: {
        duration: deliveryDays,
        unit: 'days',
      },
      milestones: [{
        title: 'Service Delivery',
        description: `Complete delivery of ${servicePackage.title}`,
        amount: price,
        dueDate: endDate,
      }],
      status: 'accepted',
    });
    
    // Generate signatures
    const signedAt = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    const signatures = [
      {
        signedBy: client._id,
        signedAt: signedAt,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        signatureHash: `client-sig-service-${servicePackage._id}`,
      },
      {
        signedBy: servicePackage.freelancer,
        signedAt: new Date(signedAt.getTime() + 60 * 60 * 1000),
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        signatureHash: `freelancer-sig-service-${servicePackage._id}`,
      },
    ];
    
    contracts.push({
      project: serviceProject._id,
      client: client._id,
      freelancer: servicePackage.freelancer,
      proposal: serviceProposal._id,
      sourceType: 'service',
      servicePackage: servicePackage._id,
      title: servicePackage.title,
      description: servicePackage.description,
      totalAmount: price,
      currency: 'USD',
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      milestones: [{
        title: 'Service Delivery',
        description: `Complete delivery of ${servicePackage.title}`,
        amount: price,
        dueDate: endDate,
        status: 'pending',
      }],
      signatures: signatures,
      terms: {
        paymentTerms: 'Payment will be released upon service completion and client approval.',
        cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
        intellectualProperty: 'All work product created under this contract will be owned by the client.',
        confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
        disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
      },
    });
    
    // Increment order count
    servicePackage.orders = (servicePackage.orders || 0) + 1;
    await servicePackage.save();
    
    logger.info(`✅ Created service contract for: ${servicePackage.title}`);
  }
  
  const createdContracts = await Contract.insertMany(contracts);
  logger.info(`✅ Created ${createdContracts.length} contracts (proposal: ${acceptedProposals.length}, hire_now: ${acceptedHireNowRequests.length}, service: ${servicePackages.length})`);
  
  return createdContracts;
}

async function seedReviews(users: any[], contracts: any[], projects: any[]) {
  logger.info('⭐ Seeding reviews...');
  
  const alice = users.find(u => u.email === 'alice.dev@example.com');
  const bob = users.find(u => u.email === 'bob.designer@example.com');
  const carol = users.find(u => u.email === 'carol.writer@example.com');
  const client1 = users.find(u => u.email === 'john.client@example.com');
  const client2 = users.find(u => u.email === 'sarah.manager@example.com');
  
  // Only create reviews for contracts that exist and have the proper structure
  const reviews = [];
  
  // Review from contract 0 (if exists)
  if (contracts[0]) {
    reviews.push({
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
    });
  }
  
  // Review from contract 1 (if exists)
  if (contracts[1]) {
    reviews.push({
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
    });
  }
  
  // Create mock reviews without contracts for display purposes
  // These reviews will show on freelancer profiles but aren't tied to actual contracts
  const mockProject = projects[0];
  
  // Additional reviews for Alice (using mock data)
  reviews.push(
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: client2._id,
      reviewee: alice._id,
      rating: 5,
      feedback: 'Alice is an exceptional developer! She built our entire backend infrastructure from scratch and it has been running flawlessly. Her attention to detail and proactive communication made the entire process smooth.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    },
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: client1._id,
      reviewee: alice._id,
      rating: 4,
      feedback: 'Very skilled developer with great problem-solving abilities. Alice completed the project ahead of schedule and was always available for questions. Would definitely hire again!',
      categories: {
        communication: 4,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    }
  );
  
  // Additional reviews for Bob
  reviews.push(
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: client1._id,
      reviewee: bob._id,
      rating: 5,
      feedback: 'Bob created an amazing UI/UX design for our mobile app. His creativity and understanding of user experience principles really shined through. The design has received excellent feedback from our users.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 4,
      },
      isPublic: true,
    },
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: client2._id,
      reviewee: bob._id,
      rating: 4,
      feedback: 'Professional designer who delivered high-quality mockups. Bob was patient with our revision requests and always provided thoughtful explanations for his design choices.',
      categories: {
        communication: 4,
        quality: 4,
        professionalism: 5,
        deadlines: 4,
      },
      isPublic: true,
    }
  );
  
  // Reviews for Carol
  reviews.push(
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: client1._id,
      reviewee: carol._id,
      rating: 5,
      feedback: 'Carol is an outstanding content writer! She delivered well-researched, engaging articles that perfectly matched our brand voice. Her SEO expertise really helped improve our search rankings.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    },
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: client2._id,
      reviewee: carol._id,
      rating: 4,
      feedback: 'Great writer with excellent attention to detail. Carol produced high-quality content consistently and was very receptive to feedback. Highly recommended!',
      categories: {
        communication: 4,
        quality: 5,
        professionalism: 4,
        deadlines: 4,
      },
      isPublic: true,
    }
  );

  // Add 20+ more reviews for each freelancer
  const feedbackTemplates = [
    'Excellent work! Delivered exactly what was needed on time and within budget.',
    'Very professional and responsive. Great communication throughout the project.',
    'Outstanding quality! Exceeded our expectations. Will definitely hire again.',
    'Skilled professional who understands requirements perfectly.',
    'Great attention to detail and very reliable. Highly recommended!',
    'Delivered high-quality work with minimal revisions needed.',
    'Very responsive and easy to work with. Great problem solver.',
    'Exceptional talent! The work quality is outstanding.',
    'Professional approach and excellent communication. Very satisfied!',
    'Reliable and consistent. Always delivers on time.',
    'Great work! Very impressed with the final deliverable.',
    'Highly skilled and very professional. Would hire again!',
    'Excellent communication and great work quality.',
    'Very thorough and detail-oriented. Great to work with.',
    'Outstanding results! Exceeded all expectations.',
    'Professional and reliable. Great to work with.',
    'Excellent quality work. Very satisfied with the results.',
    'Great problem-solving skills and very responsive.',
    'Delivered exactly as promised. Very professional.',
    'Outstanding work! Highly recommended for future projects.',
  ];

  // Add 20 reviews for Alice
  for (let i = 0; i < 20; i++) {
    reviews.push({
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: i % 2 === 0 ? client1._id : client2._id,
      reviewee: alice._id,
      rating: 4 + Math.random(),
      feedback: feedbackTemplates[i % feedbackTemplates.length],
      categories: {
        communication: 4 + Math.floor(Math.random() * 2),
        quality: 4 + Math.floor(Math.random() * 2),
        professionalism: 4 + Math.floor(Math.random() * 2),
        deadlines: 4 + Math.floor(Math.random() * 2),
      },
      isPublic: true,
    });
  }

  // Add 20 reviews for Bob
  for (let i = 0; i < 20; i++) {
    reviews.push({
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: i % 2 === 0 ? client1._id : client2._id,
      reviewee: bob._id,
      rating: 4 + Math.random(),
      feedback: feedbackTemplates[i % feedbackTemplates.length],
      categories: {
        communication: 4 + Math.floor(Math.random() * 2),
        quality: 4 + Math.floor(Math.random() * 2),
        professionalism: 4 + Math.floor(Math.random() * 2),
        deadlines: 4 + Math.floor(Math.random() * 2),
      },
      isPublic: true,
    });
  }

  // Add 20 reviews for Carol
  for (let i = 0; i < 20; i++) {
    reviews.push({
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: i % 2 === 0 ? client1._id : client2._id,
      reviewee: carol._id,
      rating: 4 + Math.random(),
      feedback: feedbackTemplates[i % feedbackTemplates.length],
      categories: {
        communication: 4 + Math.floor(Math.random() * 2),
        quality: 4 + Math.floor(Math.random() * 2),
        professionalism: 4 + Math.floor(Math.random() * 2),
        deadlines: 4 + Math.floor(Math.random() * 2),
      },
      isPublic: true,
    });
  }

  // ========== REVIEWS GIVEN BY FREELANCERS TO CLIENTS ==========
  // These are reviews that freelancers give to clients after completing projects
  const freelancerFeedbackTemplates = [
    'Great client to work with! Clear requirements and prompt communication.',
    'Professional and respectful throughout the project. Would work with again.',
    'Excellent collaboration. The client provided detailed feedback and was very supportive.',
    'Smooth project from start to finish. Client was responsive and understanding.',
    'Highly recommend this client. Fair expectations and timely payments.',
  ];

  // Alice reviews clients
  reviews.push(
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: alice._id,
      reviewee: client1._id,
      rating: 5,
      feedback: 'John was an excellent client to work with. He provided clear requirements from the start and was always available for questions. The project scope was well-defined and he gave constructive feedback throughout.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    },
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: alice._id,
      reviewee: client2._id,
      rating: 4,
      feedback: 'Sarah was professional and organized. The project requirements were clear and she provided timely feedback. Would definitely work with her again on future projects.',
      categories: {
        communication: 4,
        quality: 5,
        professionalism: 5,
        deadlines: 4,
      },
      isPublic: true,
    }
  );

  // Bob reviews clients
  reviews.push(
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: bob._id,
      reviewee: client1._id,
      rating: 5,
      feedback: 'Working with John was a pleasure. He had a clear vision for the design and gave helpful feedback. Communication was excellent throughout the project.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    },
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: bob._id,
      reviewee: client2._id,
      rating: 4,
      feedback: 'Sarah provided detailed design briefs and was open to creative suggestions. Great collaboration experience.',
      categories: {
        communication: 4,
        quality: 4,
        professionalism: 5,
        deadlines: 4,
      },
      isPublic: true,
    }
  );

  // Carol reviews clients
  reviews.push(
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: carol._id,
      reviewee: client1._id,
      rating: 5,
      feedback: 'John is a fantastic client! He provided all the necessary information upfront and was very responsive to drafts. The content direction was clear and feedback was constructive.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    },
    {
      contract: new mongoose.Types.ObjectId(),
      project: mockProject._id,
      reviewer: carol._id,
      reviewee: client2._id,
      rating: 5,
      feedback: 'Sarah was wonderful to work with. She had a clear content strategy and provided excellent feedback. Highly recommend working with her.',
      categories: {
        communication: 5,
        quality: 5,
        professionalism: 5,
        deadlines: 5,
      },
      isPublic: true,
    }
  );
  
  const createdReviews = await Review.insertMany(reviews);
  logger.info(`✅ Created ${createdReviews.length} reviews`);
  console.log(`[SEED REVIEWS] Total reviews created: ${createdReviews.length}`);
  
  // ROOT CAUSE FIX: Update user ratings based on created reviews
  logger.info('📊 Updating user ratings from reviews...');
  const revieweeIds = [...new Set(reviews.map(r => r.reviewee.toString()))];
  
  for (const revieweeId of revieweeIds) {
    const userReviews = createdReviews.filter(r => r.reviewee.toString() === revieweeId);
    if (userReviews.length > 0) {
      const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / userReviews.length;
      
      await User.findByIdAndUpdate(revieweeId, {
        'rating.average': averageRating,
        'rating.count': userReviews.length,
      });
      
      const user = await User.findById(revieweeId);
      logger.info(`✅ Updated ${user?.profile.firstName} ${user?.profile.lastName}: ${averageRating.toFixed(2)} (${userReviews.length} reviews)`);
    }
  }
  
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
  
  const { Conversation } = await import('@/models/Conversation');
  
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
      link: '/proposals',
      isRead: false,
      priority: 'high',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user: bob._id,
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from Sarah Johnson',
      link: '/messages',
      isRead: false,
      priority: 'normal',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user: client1._id,
      type: 'proposal',
      title: 'New Proposal',
      message: 'You received a new proposal for "E-commerce Website Development"',
      link: '/projects',
      isRead: true,
      priority: 'normal',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      user: alice._id,
      type: 'contract',
      title: 'Contract Signed',
      message: 'Contract for "Mobile App UI/UX Design" has been signed by the client',
      link: '/contracts',
      isRead: true,
      priority: 'high',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      user: client1._id,
      type: 'payment',
      title: 'Payment Processed',
      message: 'Payment of $1,500 has been processed for milestone completion',
      link: '/payments',
      isRead: true,
      priority: 'high',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      user: bob._id,
      type: 'review',
      title: 'New Review',
      message: 'You received a 5-star review from Sarah Johnson',
      link: '/profile',
      isRead: false,
      priority: 'normal',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user: alice._id,
      type: 'system',
      title: 'New Project Match',
      message: 'A new project matching your skills has been posted: "Python Data Analysis Script"',
      link: '/projects',
      isRead: false,
      priority: 'normal',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ];
  
  const createdNotifications = await Notification.insertMany(notifications);
  logger.info(`✅ Created ${createdNotifications.length} notifications`);
  
  return createdNotifications;
}

async function seedPlatformSettings(adminId: any) {
  logger.info('⚙️ Seeding platform settings...');
  
  const settings = await PlatformSettings.create({
    commissionRate: 10, // 10%
    minCommission: 100, // $1.00
    maxCommission: 1000000, // $10,000
    paymentProcessingFee: 2.9, // 2.9%
    currency: 'USD',
    taxRate: 0,
    withdrawalMinAmount: 1000, // $10.00
    withdrawalFee: 0,
    escrowHoldDays: 7,
    refundPolicy: 'Refunds are processed within 7-14 business days after approval.',
    termsOfService: 'By using TalentHive, you agree to our terms of service.',
    privacyPolicy: 'We respect your privacy and protect your personal information.',
    isActive: true,
    updatedBy: adminId,
  });
  
  logger.info(`✅ Created platform settings`);
  return settings;
}

async function seedSettings() {
  logger.info('⚙️ Seeding new settings model...');
  
  const settings = await Settings.create({
    platformFee: 5, // 5%
    escrowPeriodDays: 7,
    minWithdrawalAmount: 10,
    maintenanceMode: false,
    commissionSettings: [
      {
        name: 'Standard Commission',
        commissionPercentage: 5,
        description: 'Default platform commission for all transactions',
        isActive: true,
      },
      {
        name: 'Premium Projects',
        commissionPercentage: 3,
        minAmount: 5000,
        description: 'Reduced commission for high-value projects',
        isActive: true,
      },
      {
        name: 'Enterprise Clients',
        commissionPercentage: 2,
        minAmount: 10000,
        description: 'Special rate for enterprise-level projects',
        isActive: true,
      },
    ],
  });
  
  logger.info(`✅ Created settings with ${settings.commissionSettings.length} commission tiers`);
  return settings;
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

async function seedTransactions(users: any[], contracts: any[]) {
  logger.info('💳 Seeding transactions...');
  
  const { Transaction } = await import('@/models/Transaction');
  
  const transactions = [];
  const now = new Date();
  
  // Create transactions for contracts
  for (let i = 0; i < Math.min(contracts.length, 10); i++) {
    const contract = contracts[i];
    const amount = contract.totalAmount || 5000;
    const platformCommission = Math.round(amount * 0.2); // 20% commission
    const freelancerAmount = amount - platformCommission;
    
    // Vary the dates
    const daysAgo = Math.floor(Math.random() * 30);
    const transactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    transactions.push({
      contract: contract._id,
      milestone: contract.milestones?.[0]?._id || null,
      amount,
      platformCommission,
      freelancerAmount,
      status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'held_in_escrow' : 'released',
      stripePaymentIntentId: `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stripeTransferId: i % 3 === 2 ? `tr_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
      client: contract.client,
      freelancer: contract.freelancer,
      paidAt: i % 3 === 2 ? transactionDate : null,
      releasedAt: i % 3 === 2 ? transactionDate : null,
      createdAt: transactionDate,
    });
  }
  
  const createdTransactions = await Transaction.insertMany(transactions);
  logger.info(`✅ Created ${createdTransactions.length} transactions`);
  
  return createdTransactions;
}

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding (Full Comprehensive Data)...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in order (due to dependencies)
    const users = await seedUsers();
    const admin = users.find(u => u.role === 'admin');
    const platformSettings = await seedPlatformSettings(admin._id);
    const newSettings = await seedSettings();
    const categories = await seedCategories(admin._id);
    const skills = await seedSkills(categories, admin._id);
    const organizations = await seedOrganizations(users);
    
    // Organizations are created separately and linked through OrganizationMember model
    const projects = await seedProjects(users, organizations, categories);
    const servicePackages = await seedServicePackages(users);
    const proposals = await seedProposals(users, projects);
    const hireNowRequests = await seedHireNowRequests(users);
    const contracts = await seedContracts(users, projects, proposals, hireNowRequests);
    const reviews = await seedReviews(users, contracts, projects);
    const timeEntries = await seedTimeEntries(users, contracts);
    const payments = await seedPayments(users, contracts);
    const transactions = await seedTransactions(users, contracts);
    const messages = await seedMessages(users);
    const notifications = await seedNotifications(users);
    
    // TODO: Seed additional client projects and reviews
    // Temporarily disabled due to schema validation issues
    // The main seed already creates projects for clients via generateAdditionalProjects
    // await seedClientProjectsAndReviews();
    
    // Enhance seed data with slugs, completed contracts, and profile viewers
    logger.info('🔧 Enhancing seed data...');
    await enhanceSeedData(true); // Pass true to skip connection/disconnection
    
    logger.info('✅ Database seeding completed successfully');
    logger.info(`📊 Summary:
    - Platform Settings: Created
    - New Settings Model: Created with ${newSettings.commissionSettings.length} commission tiers
    - Categories: ${categories.length}
    - Skills: ${skills.length}
    - Users: ${users.length}
    - Organizations: ${organizations.length}
    - Projects: ${projects.length}
    - Service Packages: ${servicePackages.length}
    - Proposals: ${proposals.length}
    - Hire Now Requests: ${hireNowRequests.length}
    - Contracts: ${contracts.length}
    - Reviews: ${reviews.length}
    - Time Entries: ${timeEntries.length}
    - Payments: ${payments.length}
    - Transactions: ${transactions.length}
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
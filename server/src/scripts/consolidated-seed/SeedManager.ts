import { logger } from '@/utils/logger';
import { 
  SeedConfiguration, 
  SeedResult, 
  SeedProgress, 
  SeedError,
  EntityCounts,
  GenerationContext
} from './types';
import { ConfigurationManager } from './ConfigurationManager';
import { DatabaseOperations } from './DatabaseOperations';
import { ProgressTracker } from './ProgressTracker';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceOptimizer } from './PerformanceOptimizer';

/**
 * Central orchestrator for the database seeding process
 * Coordinates configuration, data generation, and database operations
 */
export class SeedManager {
  private configManager: ConfigurationManager;
  private dbOps: DatabaseOperations;
  private progressTracker: ProgressTracker;
  private performanceMonitor: PerformanceMonitor;
  private performanceOptimizer: PerformanceOptimizer;
  private errors: SeedError[] = [];

  constructor() {
    this.configManager = ConfigurationManager.getInstance();
    this.dbOps = new DatabaseOperations();
    this.progressTracker = new ProgressTracker();
    this.performanceMonitor = new PerformanceMonitor();
    this.performanceOptimizer = new PerformanceOptimizer();
  }

  /**
   * Execute the complete seeding process
   */
  async execute(config: SeedConfiguration): Promise<SeedResult> {
    const startTime = Date.now();
    logger.info(' Starting consolidated database seeding...');

    try {
      // Apply performance optimizations
      await this.performanceOptimizer.applyRuntimeOptimizations();
      const optimizedConfig = this.performanceOptimizer.optimizeSeedConfiguration(config);
      
      // Start performance monitoring
      this.performanceMonitor.startOperation('seeding');

      // Validate environment and configuration
      await this.validateEnvironment();
      this.configManager.validateConfiguration(optimizedConfig);

      // Initialize progress tracking
      this.progressTracker.initialize(this.calculateTotalSteps(optimizedConfig));

      // Connect to database
      await this.dbOps.connect();
      this.progressTracker.completeStep('Database connection established');

      // Clear existing data if not skipping
      if (!optimizedConfig.skipExisting) {
        await this.dbOps.clearDatabase();
        this.progressTracker.completeStep('Database cleared');
      }

      // Execute seeding steps in order with performance monitoring
      const summary = await this.executeSeedingSteps(optimizedConfig);

      // End performance monitoring
      this.performanceMonitor.endOperation('seeding');

      const duration = Date.now() - startTime;
      logger.info(` Seeding completed successfully in ${duration}ms`);

      // Validate performance requirements
      const performanceValidation = this.performanceMonitor.validatePerformance();
      if (!performanceValidation.isValid) {
        logger.warn('  Performance requirements not met:');
        performanceValidation.violations.forEach(v => {
          logger.warn(`   - ${v.description}`);
        });
      }

      return {
        success: true,
        summary,
        duration,
        errors: this.errors
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(' Seeding failed:', error);

      this.errors.push({
        step: 'execution',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
        timestamp: new Date()
      });

      return {
        success: false,
        summary: this.getEmptyEntityCounts(),
        duration,
        errors: this.errors
      };

    } finally {
      await this.dbOps.disconnect();
    }
  }

  /**
   * Validate the environment before seeding
   */
  async validateEnvironment(): Promise<boolean> {
    logger.info(' Validating environment...');

    // Check database connection
    const dbConnected = await this.dbOps.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Check required environment variables
    const requiredEnvVars = ['MONGODB_URI'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }

    logger.info(' Environment validation passed');
    return true;
  }

  /**
   * Clean up resources and temporary data
   */
  async cleanup(): Promise<void> {
    logger.info(' Cleaning up seeding resources...');
    
    try {
      await this.dbOps.cleanup();
      this.errors = [];
      this.progressTracker.reset();
      logger.info(' Cleanup completed');
    } catch (error) {
      logger.error(' Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get current seeding progress
   */
  getProgress(): SeedProgress {
    return this.progressTracker.getProgress();
  }

  /**
   * Get performance metrics and validation results
   */
  getPerformanceMetrics(): {
    summary: any;
    validation: any;
    report: string;
  } {
    const summary = this.performanceMonitor.getPerformanceSummary();
    const validation = this.performanceMonitor.validatePerformance();
    const report = this.performanceMonitor.generateReport();

    return {
      summary,
      validation,
      report
    };
  }

  /**
   * Execute the main seeding steps
   */
  private async executeSeedingSteps(config: SeedConfiguration): Promise<EntityCounts> {
    const context: GenerationContext = {
      existingData: new Map(),
      configuration: config,
      dependencies: []
    };

    const summary: EntityCounts = {
      users: 0,
      projects: 0,
      proposals: 0,
      contracts: 0,
      reviews: 0,
      organizations: 0,
      categories: 0,
      skills: 0
    };

    // Step 1: Seed foundation data (categories, skills, platform settings)
    if (config.enableModules.includes('categories') || config.enableModules.includes('skills')) {
      const foundationCounts = await this.seedFoundationData(context);
      summary.categories = foundationCounts.categories;
      summary.skills = foundationCounts.skills;
      this.progressTracker.completeStep('Foundation data seeded');
    }

    // Step 2: Seed users (with auto-generated slugs)
    if (config.enableModules.includes('users')) {
      summary.users = await this.seedUsers(config, context);
      this.progressTracker.completeStep('Users seeded');
    }

    // Step 3: Seed organizations
    if (config.enableModules.includes('organizations')) {
      summary.organizations = await this.seedOrganizations(context);
      this.progressTracker.completeStep('Organizations seeded');
    }

    // Step 4: Seed projects
    if (config.enableModules.includes('projects')) {
      summary.projects = await this.seedProjects(config, context);
      this.progressTracker.completeStep('Projects seeded');
    }

    // Step 5: Seed interaction data (proposals, contracts, reviews)
    if (config.enableModules.includes('proposals') || config.enableModules.includes('contracts') || config.enableModules.includes('reviews')) {
      const interactionCounts = await this.seedInteractionData(context);
      summary.proposals = interactionCounts.proposals;
      summary.contracts = interactionCounts.contracts;
      summary.reviews = interactionCounts.reviews;
      this.progressTracker.completeStep('Interaction data seeded');
    }

    return summary;
  }

  /**
   * Seed foundation data (categories, skills, platform settings)
   */
  private async seedFoundationData(context: GenerationContext): Promise<{ categories: number; skills: number }> {
    logger.info(' Seeding foundation data...');
    
    const { Category } = await import('@/models/Category');
    const { Skill } = await import('@/models/Skill');
    const { PlatformSettings } = await import('@/models/PlatformSettings');
    const { Settings } = await import('@/models/Settings');
    
    // Create a basic admin user first if none exists
    const { User } = await import('@/models/User');
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      admin = await User.create({
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
      });
      logger.info(' Created basic admin user for foundation data');
    }
    
    const adminId = admin._id;
    
    // Create categories
    const categories = [
      { name: 'Web Development', slug: 'web-development', description: 'Full-stack, frontend, and backend web development', icon: '', createdBy: adminId },
      { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS, Android, and cross-platform mobile apps', icon: '', createdBy: adminId },
      { name: 'UI/UX Design', slug: 'ui-ux-design', description: 'User interface and user experience design', icon: '', createdBy: adminId },
      { name: 'Graphic Design', slug: 'graphic-design', description: 'Logo design, branding, and visual identity', icon: '', createdBy: adminId },
      { name: 'Data Science', slug: 'data-science', description: 'Data analysis, machine learning, and AI', icon: '', createdBy: adminId },
      { name: 'DevOps', slug: 'devops', description: 'CI/CD, cloud infrastructure, and automation', icon: '', createdBy: adminId },
      { name: 'Content Writing', slug: 'content-writing', description: 'Blog posts, articles, and copywriting', icon: '', createdBy: adminId },
      { name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, social media, and online advertising', icon: '', createdBy: adminId },
      { name: 'Video & Animation', slug: 'video-animation', description: 'Video editing, motion graphics, and 3D animation', icon: '', createdBy: adminId },
      { name: 'Game Development', slug: 'game-development', description: 'Game design, programming, and asset creation', icon: '', createdBy: adminId },
      { name: 'Blockchain', slug: 'blockchain', description: 'Smart contracts, DApps, and cryptocurrency', icon: '', createdBy: adminId },
      { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security audits, penetration testing, and compliance', icon: '', createdBy: adminId },
    ];
    
    const createdCategories = await Category.insertMany(categories);
    context.existingData.set('categories', createdCategories);
    
    // Create skills
    const webDev = createdCategories.find(c => c.slug === 'web-development');
    const mobileDev = createdCategories.find(c => c.slug === 'mobile-development');
    const uiux = createdCategories.find(c => c.slug === 'ui-ux-design');
    const graphicDesign = createdCategories.find(c => c.slug === 'graphic-design');
    const dataScience = createdCategories.find(c => c.slug === 'data-science');
    const devops = createdCategories.find(c => c.slug === 'devops');
    const writing = createdCategories.find(c => c.slug === 'content-writing');
    const marketing = createdCategories.find(c => c.slug === 'digital-marketing');
    const video = createdCategories.find(c => c.slug === 'video-animation');
    const gaming = createdCategories.find(c => c.slug === 'game-development');
    const blockchain = createdCategories.find(c => c.slug === 'blockchain');
    const security = createdCategories.find(c => c.slug === 'cybersecurity');
    
    const skills = [
      // Web Development
      { name: 'React', slug: 'react', category: webDev._id, createdBy: adminId },
      { name: 'Vue.js', slug: 'vuejs', category: webDev._id, createdBy: adminId },
      { name: 'Angular', slug: 'angular', category: webDev._id, createdBy: adminId },
      { name: 'Node.js', slug: 'nodejs', category: webDev._id, createdBy: adminId },
      { name: 'Express.js', slug: 'expressjs', category: webDev._id, createdBy: adminId },
      { name: 'TypeScript', slug: 'typescript', category: webDev._id, createdBy: adminId },
      { name: 'JavaScript', slug: 'javascript', category: webDev._id, createdBy: adminId },
      { name: 'HTML/CSS', slug: 'html-css', category: webDev._id, createdBy: adminId },
      { name: 'MongoDB', slug: 'mongodb', category: webDev._id, createdBy: adminId },
      { name: 'PostgreSQL', slug: 'postgresql', category: webDev._id, createdBy: adminId },
      { name: 'MySQL', slug: 'mysql', category: webDev._id, createdBy: adminId },
      { name: 'GraphQL', slug: 'graphql', category: webDev._id, createdBy: adminId },
      { name: 'REST API', slug: 'rest-api', category: webDev._id, createdBy: adminId },
      { name: 'Next.js', slug: 'nextjs', category: webDev._id, createdBy: adminId },
      { name: 'Tailwind CSS', slug: 'tailwind-css', category: webDev._id, createdBy: adminId },
      
      // Mobile Development
      { name: 'React Native', slug: 'react-native', category: mobileDev._id, createdBy: adminId },
      { name: 'Flutter', slug: 'flutter', category: mobileDev._id, createdBy: adminId },
      { name: 'iOS Development', slug: 'ios-development', category: mobileDev._id, createdBy: adminId },
      { name: 'Android Development', slug: 'android-development', category: mobileDev._id, createdBy: adminId },
      { name: 'Swift', slug: 'swift', category: mobileDev._id, createdBy: adminId },
      { name: 'Kotlin', slug: 'kotlin', category: mobileDev._id, createdBy: adminId },
      { name: 'Firebase', slug: 'firebase', category: mobileDev._id, createdBy: adminId },
      
      // UI/UX Design
      { name: 'Figma', slug: 'figma', category: uiux._id, createdBy: adminId },
      { name: 'Adobe XD', slug: 'adobe-xd', category: uiux._id, createdBy: adminId },
      { name: 'Sketch', slug: 'sketch', category: uiux._id, createdBy: adminId },
      { name: 'Prototyping', slug: 'prototyping', category: uiux._id, createdBy: adminId },
      { name: 'User Research', slug: 'user-research', category: uiux._id, createdBy: adminId },
      { name: 'Wireframing', slug: 'wireframing', category: uiux._id, createdBy: adminId },
      { name: 'Design Systems', slug: 'design-systems', category: uiux._id, createdBy: adminId },
      
      // Other categories with key skills
      { name: 'Adobe Photoshop', slug: 'adobe-photoshop', category: graphicDesign._id, createdBy: adminId },
      { name: 'Adobe Illustrator', slug: 'adobe-illustrator', category: graphicDesign._id, createdBy: adminId },
      { name: 'Logo Design', slug: 'logo-design', category: graphicDesign._id, createdBy: adminId },
      { name: 'Branding', slug: 'branding', category: graphicDesign._id, createdBy: adminId },
      
      { name: 'Python', slug: 'python', category: dataScience._id, createdBy: adminId },
      { name: 'Machine Learning', slug: 'machine-learning', category: dataScience._id, createdBy: adminId },
      { name: 'TensorFlow', slug: 'tensorflow', category: dataScience._id, createdBy: adminId },
      { name: 'Data Analysis', slug: 'data-analysis', category: dataScience._id, createdBy: adminId },
      { name: 'Pandas', slug: 'pandas', category: dataScience._id, createdBy: adminId },
      { name: 'SQL', slug: 'sql', category: dataScience._id, createdBy: adminId },
      
      { name: 'Docker', slug: 'docker', category: devops._id, createdBy: adminId },
      { name: 'Kubernetes', slug: 'kubernetes', category: devops._id, createdBy: adminId },
      { name: 'AWS', slug: 'aws', category: devops._id, createdBy: adminId },
      { name: 'Jenkins', slug: 'jenkins', category: devops._id, createdBy: adminId },
      { name: 'CI/CD', slug: 'ci-cd', category: devops._id, createdBy: adminId },
      
      { name: 'Technical Writing', slug: 'technical-writing', category: writing._id, createdBy: adminId },
      { name: 'Copywriting', slug: 'copywriting', category: writing._id, createdBy: adminId },
      { name: 'Content Strategy', slug: 'content-strategy', category: writing._id, createdBy: adminId },
      
      { name: 'SEO', slug: 'seo', category: marketing._id, createdBy: adminId },
      { name: 'Google Analytics', slug: 'google-analytics', category: marketing._id, createdBy: adminId },
      { name: 'Social Media Marketing', slug: 'social-media-marketing', category: marketing._id, createdBy: adminId },
    ];
    
    const createdSkills = await Skill.insertMany(skills);
    context.existingData.set('skills', createdSkills);
    
    // Create platform settings
    await PlatformSettings.create({
      commissionRate: 10,
      minCommission: 100,
      maxCommission: 1000000,
      paymentProcessingFee: 2.9,
      currency: 'USD',
      taxRate: 0,
      withdrawalMinAmount: 1000,
      withdrawalFee: 0,
      escrowHoldDays: 7,
      refundPolicy: 'Refunds are processed within 7-14 business days after approval.',
      termsOfService: 'By using TalentHive, you agree to our terms of service.',
      privacyPolicy: 'We respect your privacy and protect your personal information.',
      isActive: true,
      updatedBy: adminId,
    });
    
    // Create new settings model
    await Settings.create({
      platformFee: 5,
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
      ],
    });
    
    return { categories: createdCategories.length, skills: createdSkills.length };
  }

  /**
   * Seed users with auto-generated slugs
   */
  private async seedUsers(config: SeedConfiguration, context: GenerationContext): Promise<number> {
    logger.info(' Seeding users...');
    
    const { UserGenerator } = await import('./UserGenerator');
    const userGenerator = new UserGenerator();
    
    // Calculate total users needed
    const totalUsers = config.userCounts.admins + config.userCounts.clients + config.userCounts.freelancers;
    
    // Generate users
    const users = await userGenerator.generate(totalUsers, context);
    
    // Validate generated users
    const validation = userGenerator.validate(users);
    if (!validation.isValid) {
      logger.error(' User validation failed:', validation.errors);
      throw new Error(`User validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      logger.warn(' User validation warnings:', validation.warnings);
    }
    
    // Save users to database
    const { User } = await import('@/models/User');
    const createdUsers = await User.insertMany(users);
    
    // Store users in context for other generators
    context.existingData.set('users', createdUsers);
    
    // Seed RBAC system
    const { seedPermissions } = await import('../seedPermissions');
    const { seedRoles } = await import('../seedRoles');
    
    const permissions = await seedPermissions();
    const roles = await seedRoles();
    
    // Assign Super Admin role to main admin user
    const admin = createdUsers.find(u => u.role === 'admin');
    if (admin && roles.length > 0) {
      const superAdminRole = roles.find(r => r.slug === 'super-admin');
      if (superAdminRole && superAdminRole._id) {
        if (!admin.permissions) {
          admin.permissions = { roles: [], directPermissions: [], deniedPermissions: [] };
        }
        admin.permissions.roles = [superAdminRole._id as any];
        admin.lastPermissionUpdate = new Date();
        await admin.save();
        logger.info(` Assigned Super Admin role to ${admin.email}`);
      }
    }
    
    logger.info(` Created ${createdUsers.length} users with RBAC system`);
    return createdUsers.length;
  }

  /**
   * Seed organizations
   */
  private async seedOrganizations(context: GenerationContext): Promise<number> {
    logger.info(' Seeding organizations...');
    
    const { Organization } = await import('@/models/Organization');
    
    const users = context.existingData.get('users') || [];
    const clients = users.filter((u: any) => u.role === 'client');
    
    if (clients.length === 0) {
      logger.warn(' No clients found, skipping organization seeding');
      return 0;
    }
    
    const organizations = [];
    
    for (let i = 0; i < Math.min(6, clients.length); i++) {
      const client = clients[i];
      const companyTypes = ['Technology', 'Startup', 'Marketing', 'Design', 'Analytics', 'Consulting'];
      const companySizes = ['1-10', '11-50', '51-200', '201-500'];
      
      organizations.push({
        name: `${companyTypes[i % companyTypes.length]} Company ${i + 1}`,
        description: `Leading ${companyTypes[i % companyTypes.length].toLowerCase()} solutions provider specializing in innovative services`,
        industry: companyTypes[i % companyTypes.length],
        size: companySizes[i % companySizes.length],
        website: `https://company${i + 1}.com`,
        owner: client._id,
        members: [
          {
            user: client._id,
            role: 'owner',
            permissions: ['*'],
            joinedAt: new Date(),
          },
        ],
        budget: {
          total: Math.floor(Math.random() * 50000) + 20000,
          spent: Math.floor(Math.random() * 15000) + 5000,
          remaining: Math.floor(Math.random() * 35000) + 15000,
        },
        budgetSettings: {
          monthlyBudget: Math.floor(Math.random() * 50000) + 20000,
          approvalThreshold: Math.floor(Math.random() * 5000) + 2000,
          autoApproveBelow: Math.floor(Math.random() * 1000) + 500,
        },
      });
    }
    
    const createdOrganizations = await Organization.insertMany(organizations);
    context.existingData.set('organizations', createdOrganizations);
    
    logger.info(` Created ${createdOrganizations.length} organizations`);
    return createdOrganizations.length;
  }

  /**
   * Seed projects with market-based data
   */
  private async seedProjects(config: SeedConfiguration, context: GenerationContext): Promise<number> {
    logger.info(' Seeding projects...');
    
    const { Project } = await import('@/models/Project');
    const { Skill } = await import('@/models/Skill');
    
    const users = context.existingData.get('users') || [];
    const categories = context.existingData.get('categories') || [];
    const skills = context.existingData.get('skills') || [];
    
    const clients = users.filter((u: any) => u.role === 'client');
    if (clients.length === 0) {
      logger.warn(' No clients found, skipping project seeding');
      return 0;
    }
    
    // Create skill name to ID mapping
    const skillNameToId = new Map(skills.map((s: any) => [s.name, s._id]));
    const getSkillIds = (skillNames: string[]): any[] => {
      return skillNames
        .map(name => skillNameToId.get(name))
        .filter(id => id !== undefined);
    };
    
    // Get category IDs safely
    const webDevCat = categories.find((c: any) => c.slug === 'web-development')?._id;
    const designCat = categories.find((c: any) => c.slug === 'ui-ux-design')?._id;
    const mobileCat = categories.find((c: any) => c.slug === 'mobile-development')?._id;
    const writingCat = categories.find((c: any) => c.slug === 'content-writing')?._id;
    const marketingCat = categories.find((c: any) => c.slug === 'digital-marketing')?._id;
    const dataScienceCat = categories.find((c: any) => c.slug === 'data-science')?._id;
    
    // Use first category as fallback if specific categories not found
    const fallbackCat = categories[0]?._id;
    
    const projects = [
      {
        title: 'E-commerce Website Development',
        description: 'Build a modern e-commerce platform with React and Node.js',
        category: webDevCat || fallbackCat,
        budget: { type: 'fixed', min: 5000, max: 8000 },
        timeline: { duration: 60, unit: 'days' },
        skills: getSkillIds(['React', 'Node.js', 'MongoDB']),
        requirements: ['Responsive design', 'Payment integration', 'Admin dashboard', 'Inventory management'],
        client: clients[0]._id,
        status: 'open',
      },
      {
        title: 'Mobile App UI/UX Design',
        description: 'Design user interface for iOS and Android mobile application',
        category: designCat || fallbackCat,
        budget: { type: 'fixed', min: 2000, max: 3500 },
        timeline: { duration: 30, unit: 'days' },
        skills: getSkillIds(['Figma', 'Prototyping']),
        requirements: ['iOS and Android designs', 'Interactive prototypes', 'Design system'],
        client: clients[Math.min(1, clients.length - 1)]._id,
        status: 'open',
      },
      {
        title: 'Marketing Website Redesign',
        description: 'Redesign our company website with modern UI/UX',
        category: webDevCat || fallbackCat,
        budget: { type: 'fixed', min: 3000, max: 5000 },
        timeline: { duration: 45, unit: 'days' },
        skills: getSkillIds(['React', 'SEO']),
        requirements: ['Modern design', 'SEO optimization', 'Fast loading'],
        client: clients[0]._id,
        status: 'open',
      },
      {
        title: 'Technical Documentation',
        description: 'Create comprehensive API documentation and user guides',
        category: writingCat || fallbackCat,
        budget: { type: 'fixed', min: 1500, max: 2500 },
        timeline: { duration: 21, unit: 'days' },
        skills: getSkillIds(['Technical Writing']),
        requirements: ['API reference documentation', 'User guides', 'Developer tutorials'],
        client: clients[0]._id,
        status: 'in_progress',
      },
      {
        title: 'Backend API Development',
        description: 'Build RESTful API with Node.js and Express',
        category: webDevCat || fallbackCat,
        budget: { type: 'hourly', min: 50, max: 80 },
        timeline: { duration: 30, unit: 'days' },
        skills: getSkillIds(['Node.js', 'Express.js', 'MongoDB', 'REST API']),
        requirements: ['RESTful architecture', 'Authentication', 'Database integration'],
        client: clients[Math.min(1, clients.length - 1)]._id,
        status: 'in_progress',
      },
      {
        title: 'Python Data Analysis Script',
        description: 'Create Python scripts for analyzing sales data and generating reports',
        category: dataScienceCat || fallbackCat,
        budget: { type: 'fixed', min: 1500, max: 2500 },
        timeline: { duration: 15, unit: 'days' },
        skills: getSkillIds(['Python', 'Pandas', 'Data Analysis']),
        requirements: ['Data cleaning', 'Statistical analysis', 'Automated reports', 'Documentation'],
        client: clients[Math.min(2, clients.length - 1)]._id,
        status: 'open',
      },
      {
        title: 'React Native Mobile App',
        description: 'Build a cross-platform mobile app for fitness tracking',
        category: mobileCat || fallbackCat,
        budget: { type: 'fixed', min: 8000, max: 12000 },
        timeline: { duration: 90, unit: 'days' },
        skills: getSkillIds(['React Native', 'Firebase', 'REST API']),
        requirements: ['User authentication', 'Activity tracking', 'Social features', 'Push notifications'],
        client: clients[Math.min(2, clients.length - 1)]._id,
        status: 'open',
      },
      {
        title: 'SEO Optimization for Website',
        description: 'Improve search engine rankings for e-commerce website',
        category: marketingCat || fallbackCat,
        budget: { type: 'fixed', min: 2000, max: 3500 },
        timeline: { duration: 45, unit: 'days' },
        skills: getSkillIds(['SEO', 'Google Analytics']),
        requirements: ['Keyword research', 'On-page optimization', 'Technical SEO audit', 'Monthly reports'],
        client: clients[Math.min(3, clients.length - 1)]._id,
        status: 'open',
      },
    ];
    
    // Generate additional projects based on configuration
    const totalConfiguredProjects = config.projectCounts.draft + config.projectCounts.open + 
                                   config.projectCounts.inProgress + config.projectCounts.completed + 
                                   config.projectCounts.cancelled;
    const additionalProjectCount = Math.max(0, totalConfiguredProjects - projects.length);
    for (let i = 0; i < additionalProjectCount; i++) {
      const client = clients[i % clients.length];
      const category = categories[i % categories.length];
      const projectTypes = ['Website Development', 'Mobile App', 'Design Project', 'Content Creation', 'Data Analysis'];
      const projectType = projectTypes[i % projectTypes.length];
      
      projects.push({
        title: `${projectType} ${i + 1}`,
        description: `Professional ${projectType.toLowerCase()} project with modern technologies and best practices.`,
        category: category._id || fallbackCat,
        budget: { 
          type: Math.random() > 0.7 ? 'hourly' : 'fixed',
          min: Math.floor(Math.random() * 5000) + 1000,
          max: Math.floor(Math.random() * 10000) + 5000
        },
        timeline: { 
          duration: Math.floor(Math.random() * 60) + 14,
          unit: 'days'
        },
        skills: skills.slice(0, Math.floor(Math.random() * 5) + 1).map((s: any) => s._id),
        requirements: ['High quality deliverables', 'Timely communication', 'Professional approach'],
        client: client._id,
        status: ['open', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      });
    }
    
    const createdProjects = await Project.insertMany(projects);
    context.existingData.set('projects', createdProjects);
    
    logger.info(` Created ${createdProjects.length} projects`);
    return createdProjects.length;
  }

  /**
   * Seed interaction data (proposals, contracts, reviews)
   */
  private async seedInteractionData(context: GenerationContext): Promise<{ proposals: number; contracts: number; reviews: number }> {
    logger.info(' Seeding interaction data...');
    
    const { Proposal } = await import('@/models/Proposal');
    const { Contract } = await import('@/models/Contract');
    const { Review } = await import('@/models/Review');
    const ServicePackage = (await import('@/models/ServicePackage')).default;
    const { HireNowRequest } = await import('@/models/HireNowRequest');
    
    const users = context.existingData.get('users') || [];
    const projects = context.existingData.get('projects') || [];
    const categories = context.existingData.get('categories') || [];
    
    const freelancers = users.filter((u: any) => u.role === 'freelancer');
    const clients = users.filter((u: any) => u.role === 'client');
    
    // Use first category as fallback
    const fallbackCat = categories[0]?._id;
    
    if (freelancers.length === 0 || projects.length === 0) {
      logger.warn(' No freelancers or projects found, skipping interaction data seeding');
      return { proposals: 0, contracts: 0, reviews: 0 };
    }
    
    // Create service packages
    const servicePackages = [];
    for (let i = 0; i < Math.min(3, freelancers.length); i++) {
      const freelancer = freelancers[i];
      const category = categories[i % categories.length];
      
      servicePackages.push({
        freelancer: freelancer._id,
        title: `Professional Service Package ${i + 1}`,
        description: `Complete professional service with modern technologies and best practices.`,
        category: category._id || fallbackCat,
        pricing: { type: 'fixed', amount: Math.floor(Math.random() * 3000) + 1000 },
        deliveryTime: Math.floor(Math.random() * 21) + 7,
        revisions: Math.floor(Math.random() * 5) + 2,
        features: ['High quality work', 'Fast delivery', 'Multiple revisions', 'Professional support'],
        skills: ['Professional Skills', 'Quality Assurance', 'Communication'],
        isActive: true,
      });
    }
    
    const createdServicePackages = await ServicePackage.insertMany(servicePackages);
    
    // Create hire now requests
    const hireNowRequests = [];
    for (let i = 0; i < Math.min(4, clients.length * freelancers.length); i++) {
      const client = clients[i % clients.length];
      const freelancer = freelancers[i % freelancers.length];
      const statuses = ['pending', 'accepted', 'rejected'];
      const status = statuses[i % statuses.length];
      
      hireNowRequests.push({
        client: client._id,
        freelancer: freelancer._id,
        projectTitle: `Quick Project ${i + 1}`,
        projectDescription: `Urgent project that needs immediate attention and professional delivery.`,
        budget: Math.floor(Math.random() * 2000) + 500,
        timeline: { duration: Math.floor(Math.random() * 14) + 3, unit: 'days' },
        milestones: [{
          title: 'Project Completion',
          description: 'Complete the project as described',
          amount: Math.floor(Math.random() * 2000) + 500,
          dueDate: new Date(Date.now() + (Math.floor(Math.random() * 14) + 3) * 24 * 60 * 60 * 1000),
        }],
        message: `Hi, I need help with this project. Can you help?`,
        status,
        respondedAt: status !== 'pending' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        responseMessage: status === 'accepted' ? 'I would love to work on this project!' : status === 'rejected' ? 'Sorry, I am currently fully booked.' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
      });
    }
    
    const createdHireNowRequests = await HireNowRequest.insertMany(hireNowRequests);
    
    // Create proposals
    const proposals = [];
    const openProjects = projects.filter((p: any) => p.status === 'open');
    
    for (let i = 0; i < Math.min(20, openProjects.length * 2); i++) {
      const project = openProjects[i % openProjects.length];
      const freelancer = freelancers[i % freelancers.length];
      
      // Avoid duplicate proposals for same project-freelancer combination
      const existingProposal = proposals.find(p => 
        p.project.toString() === project._id.toString() && 
        p.freelancer.toString() === freelancer._id.toString()
      );
      
      if (existingProposal) continue;
      
      const statuses = ['submitted', 'accepted', 'rejected'];
      const status = statuses[i % statuses.length];
      const bidAmount = Math.floor(Math.random() * 5000) + 1000;
      
      proposals.push({
        project: project._id,
        freelancer: freelancer._id,
        coverLetter: `I have extensive experience in this field and can deliver high-quality results within your timeline. I would love to work on your project and bring your vision to life.`,
        bidAmount,
        timeline: { duration: Math.floor(Math.random() * 45) + 14, unit: 'days' },
        milestones: [
          {
            title: 'Phase 1 - Initial Development',
            description: 'Initial setup and core functionality',
            amount: Math.floor(bidAmount * 0.4),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Phase 2 - Final Delivery',
            description: 'Testing, refinement, and delivery',
            amount: Math.floor(bidAmount * 0.6),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
        status,
      });
    }
    
    const createdProposals = await Proposal.insertMany(proposals);
    
    // Create contracts from accepted proposals and hire now requests
    const contracts = [];
    const acceptedProposals = createdProposals.filter(p => p.status === 'accepted');
    const acceptedHireNowRequests = createdHireNowRequests.filter(r => r.status === 'accepted');
    
    // Contracts from proposals
    for (const proposal of acceptedProposals) {
      const project = projects.find((p: any) => p._id.equals(proposal.project));
      if (!project) continue;
      
      const startDate = new Date();
      const endDate = new Date(Date.now() + (proposal.timeline?.duration || 30) * 24 * 60 * 60 * 1000);
      
      contracts.push({
        project: proposal.project,
        client: project.client,
        freelancer: proposal.freelancer,
        proposal: proposal._id,
        sourceType: 'proposal',
        title: `Contract for ${project.title}`,
        description: project.description,
        totalAmount: proposal.bidAmount,
        currency: 'USD',
        startDate,
        endDate,
        status: 'active',
        milestones: proposal.milestones.map((m: any) => ({
          title: m.title,
          description: m.description,
          amount: m.amount,
          dueDate: m.dueDate,
          status: 'pending',
        })),
        signatures: [
          {
            signedBy: project.client,
            signedAt: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Seed Script)',
            signatureHash: `client-sig-${proposal._id}`,
          },
          {
            signedBy: proposal.freelancer,
            signedAt: new Date(startDate.getTime() - 23 * 60 * 60 * 1000),
            ipAddress: '192.168.1.2',
            userAgent: 'Mozilla/5.0 (Seed Script)',
            signatureHash: `freelancer-sig-${proposal._id}`,
          },
        ],
        terms: {
          paymentTerms: 'Payment will be released upon milestone completion and client approval.',
          cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
          intellectualProperty: 'All work product created under this contract will be owned by the client.',
          confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
          disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
        },
      });
    }
    
    const createdContracts = await Contract.insertMany(contracts);
    
    // Create reviews
    const reviews = [];
    const mockProject = projects[0];
    
    // Create reviews for each freelancer
    for (const freelancer of freelancers.slice(0, 5)) {
      const reviewCount = Math.floor(Math.random() * 15) + 5; // 5-20 reviews per freelancer
      
      for (let i = 0; i < reviewCount; i++) {
        const client = clients[i % clients.length];
        const rating = 4 + Math.random(); // 4.0 to 5.0 rating
        
        const feedbackTemplates = [
          'Excellent work! Delivered exactly what was needed on time and within budget.',
          'Very professional and responsive. Great communication throughout the project.',
          'Outstanding quality! Exceeded our expectations. Will definitely hire again.',
          'Skilled professional who understands requirements perfectly.',
          'Great attention to detail and very reliable. Highly recommended!',
        ];
        
        reviews.push({
          contract: createdContracts[0]?._id || new (await import('mongoose')).Types.ObjectId(),
          project: mockProject._id,
          reviewer: client._id,
          reviewee: freelancer._id,
          rating,
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
    }
    
    const createdReviews = await Review.insertMany(reviews);
    
    // Update user ratings based on reviews
    const { User } = await import('@/models/User');
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
      }
    }
    
    logger.info(` Created interaction data: ${createdProposals.length} proposals, ${createdContracts.length} contracts, ${createdReviews.length} reviews`);
    return { 
      proposals: createdProposals.length, 
      contracts: createdContracts.length, 
      reviews: createdReviews.length 
    };
  }

  /**
   * Calculate total steps for progress tracking
   */
  private calculateTotalSteps(config: SeedConfiguration): number {
    let steps = 2; // Database connection + cleanup
    
    if (config.enableModules.includes('categories') || config.enableModules.includes('skills')) steps += 1;
    if (config.enableModules.includes('users')) steps += 1;
    if (config.enableModules.includes('organizations')) steps += 1;
    if (config.enableModules.includes('projects')) steps += 1;
    if (config.enableModules.includes('proposals') || config.enableModules.includes('contracts') || config.enableModules.includes('reviews')) steps += 1;
    
    return steps;
  }

  /**
   * Get empty entity counts for error scenarios
   */
  private getEmptyEntityCounts(): EntityCounts {
    return {
      users: 0,
      projects: 0,
      proposals: 0,
      contracts: 0,
      reviews: 0,
      organizations: 0,
      categories: 0,
      skills: 0
    };
  }
}
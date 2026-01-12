import { logger } from '@/utils/logger';
import { 
  ProjectData, 
  ProjectGenerator as IProjectGenerator, 
  GenerationContext, 
  ValidationResult,
  ProjectStatus,
  ProjectComplexity,
  BudgetData,
  TimelineData
} from './types';
import { 
  MARKET_DATA,
  INDUSTRY_PROJECT_TYPES,
  calculateRealisticBudget,
  generateIndustryProject,
  generateTemporalPatterns
} from '../realisticDataGenerators';

/**
 * Generates realistic project data with complexity-based budgets and market trends
 * Integrates seasonal patterns and industry-specific requirements
 */
export class ProjectGenerator implements IProjectGenerator {
  private industryTypes = Object.keys(INDUSTRY_PROJECT_TYPES);
  private temporalPatterns = generateTemporalPatterns();

  /**
   * Generate projects with specified count and context
   */
  async generate(count: number, context: GenerationContext): Promise<ProjectData[]> {
    const { projectCounts } = context.configuration;
    const totalRequested = Object.values(projectCounts).reduce((sum, count) => sum + count, 0);
    
    if (count !== totalRequested) {
      logger.warn(`Requested count (${count}) doesn't match configuration total (${totalRequested}). Using configuration.`);
    }

    const projects: ProjectData[] = [];

    // Generate projects by status to ensure proper distribution
    const draftProjects = await this.generateByStatus('draft', projectCounts.draft, context);
    const openProjects = await this.generateByStatus('open', projectCounts.open, context);
    const inProgressProjects = await this.generateByStatus('in_progress', projectCounts.inProgress, context);
    const completedProjects = await this.generateByStatus('completed', projectCounts.completed, context);
    const cancelledProjects = await this.generateByStatus('cancelled', projectCounts.cancelled, context);

    projects.push(...draftProjects, ...openProjects, ...inProgressProjects, ...completedProjects, ...cancelledProjects);

    logger.info(` Generated ${projects.length} projects (${draftProjects.length} draft, ${openProjects.length} open, ${inProgressProjects.length} in progress, ${completedProjects.length} completed, ${cancelledProjects.length} cancelled)`);
    return projects;
  }

  /**
   * Generate projects by category
   */
  async generateByCategory(category: string, count: number, context: GenerationContext): Promise<ProjectData[]> {
    logger.info(` Generating ${count} projects for category: ${category}`);
    
    const projects: ProjectData[] = [];
    const categories = context.existingData.get('categories') || [];
    const skills = context.existingData.get('skills') || [];
    const clients = context.existingData.get('clients') || [];

    const categoryData = categories.find((c: any) => c.name === category || c.slug === category);
    if (!categoryData) {
      throw new Error(`Category not found: ${category}`);
    }

    const categorySkills = skills.filter((s: any) => s.category?.toString() === categoryData._id?.toString());

    for (let i = 0; i < count; i++) {
      const project = await this.generateSingleProject(context, {
        category: categoryData,
        skills: categorySkills,
        clients,
        forceCategory: true,
      });
      projects.push(project);
    }

    return projects;
  }

  /**
   * Generate projects by status
   */
  async generateByStatus(status: ProjectStatus, count: number, context: GenerationContext): Promise<ProjectData[]> {
    logger.info(` Generating ${count} projects with status: ${status}`);
    
    const projects: ProjectData[] = [];
    const categories = context.existingData.get('categories') || [];
    const skills = context.existingData.get('skills') || [];
    const clients = context.existingData.get('clients') || [];

    for (let i = 0; i < count; i++) {
      const project = await this.generateSingleProject(context, {
        categories,
        skills,
        clients,
        forceStatus: status,
      });
      projects.push(project);
    }

    return projects;
  }

  /**
   * Validate generated project data
   */
  validate(data: ProjectData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const project = data[i];
      const prefix = `Project ${i + 1}`;

      // Required fields validation
      if (!project.title || project.title.length < 10) {
        errors.push(`${prefix}: Title must be at least 10 characters`);
      }
      if (!project.description || project.description.length < 50) {
        errors.push(`${prefix}: Description must be at least 50 characters`);
      }
      if (!project.category) {
        errors.push(`${prefix}: Category is required`);
      }
      if (!project.client) {
        errors.push(`${prefix}: Client is required`);
      }
      if (!project.budget || !project.budget.type) {
        errors.push(`${prefix}: Budget information is required`);
      }
      if (!project.timeline || !project.timeline.duration) {
        errors.push(`${prefix}: Timeline information is required`);
      }
      if (!project.skills || project.skills.length === 0) {
        warnings.push(`${prefix}: No skills specified`);
      }
      if (!project.requirements || project.requirements.length === 0) {
        warnings.push(`${prefix}: No requirements specified`);
      }

      // Budget validation
      if (project.budget) {
        if (project.budget.type === 'fixed') {
          if (project.budget.min <= 0 || project.budget.max <= 0) {
            errors.push(`${prefix}: Fixed budget amounts must be positive`);
          }
          if (project.budget.min > project.budget.max) {
            errors.push(`${prefix}: Budget minimum cannot exceed maximum`);
          }
          if (project.budget.max > 100000) {
            warnings.push(`${prefix}: Very high budget (${project.budget.max})`);
          }
        } else if (project.budget.type === 'hourly') {
          if (project.budget.min < 10 || project.budget.max > 500) {
            warnings.push(`${prefix}: Hourly rate seems unrealistic (${project.budget.min}-${project.budget.max})`);
          }
        }
      }

      // Timeline validation
      if (project.timeline) {
        if (project.timeline.duration <= 0) {
          errors.push(`${prefix}: Timeline duration must be positive`);
        }
        if (project.timeline.duration > 365 && project.timeline.unit === 'days') {
          warnings.push(`${prefix}: Very long timeline (${project.timeline.duration} days)`);
        }
      }

      // Status-specific validation
      if (project.status === 'draft' && !project.isDraft) {
        warnings.push(`${prefix}: Draft status but isDraft flag not set`);
      }
      if (project.isDraft && project.status !== 'draft') {
        errors.push(`${prefix}: isDraft flag set but status is not draft`);
      }

      // Complexity validation
      if (project.complexity && !['simple', 'moderate', 'complex', 'enterprise'].includes(project.complexity)) {
        errors.push(`${prefix}: Invalid complexity level`);
      }

      // Estimated hours validation
      if (project.estimatedHours && project.estimatedHours <= 0) {
        errors.push(`${prefix}: Estimated hours must be positive`);
      }
    }

    // Check for duplicate titles
    const titles = data.map(p => p.title);
    const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
    if (duplicateTitles.length > 0) {
      warnings.push(`Duplicate project titles found: ${[...new Set(duplicateTitles)].join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get dependencies for project generation
   */
  getDependencies(): string[] {
    return ['categories', 'skills', 'clients'];
  }

  /**
   * Generate a single project with specified constraints
   */
  private async generateSingleProject(
    context: GenerationContext,
    options: {
      categories?: any[];
      skills?: any[];
      clients?: any[];
      category?: any;
      forceCategory?: boolean;
      forceStatus?: ProjectStatus;
    }
  ): Promise<ProjectData> {
    const { categories = [], skills = [], clients = [] } = options;

    // Select category
    const category = options.forceCategory && options.category 
      ? options.category 
      : this.selectRandomCategory(categories);

    // Select relevant skills
    const categorySkills = skills.filter((s: any) => 
      s.category?.toString() === category._id?.toString()
    );
    const selectedSkills = this.selectRandomSkills(categorySkills, 3, 6);

    // Select client
    const client = this.selectRandomClient(clients);

    // Determine complexity and generate budget
    const complexity = this.selectComplexity();
    const estimatedHours = this.estimateHours(complexity);
    const budget = this.generateBudget(complexity, selectedSkills, estimatedHours);
    const timeline = this.generateTimeline(complexity, estimatedHours);

    // Generate project content
    const industryType = this.selectIndustryType();
    const industryProject = generateIndustryProject(industryType as keyof typeof INDUSTRY_PROJECT_TYPES);
    
    const title = this.generateTitle(category, complexity, industryProject);
    const description = this.generateDescription(industryProject, complexity, selectedSkills);
    const requirements = this.generateRequirements(complexity, industryProject);

    // Determine status
    const status = options.forceStatus || this.selectStatus();

    // Create project data
    const project: ProjectData = {
      title,
      description,
      category: category._id,
      budget,
      timeline,
      skills: selectedSkills.map((s: any) => s._id),
      requirements,
      client: client._id,
      status,
      complexity,
      estimatedHours,
      industryType,
      specialRequirements: industryProject.specialRequirements,
    };

    // Add draft-specific fields
    if (status === 'draft') {
      project.isDraft = true;
      project.draftSavedAt = this.generateDraftSaveDate();
    }

    return project;
  }

  /**
   * Select random category with weighted distribution
   */
  private selectRandomCategory(categories: any[]): any {
    if (categories.length === 0) {
      throw new Error('No categories available for project generation');
    }

    // Weight categories based on market demand
    const categoryWeights: Record<string, number> = {
      'web-development': 0.25,
      'mobile-development': 0.15,
      'ui-ux-design': 0.12,
      'data-science': 0.10,
      'digital-marketing': 0.08,
      'devops': 0.08,
      'content-writing': 0.07,
      'graphic-design': 0.06,
      'video-animation': 0.04,
      'game-development': 0.03,
      'blockchain': 0.02,
    };

    const random = Math.random();
    let cumulative = 0;

    for (const category of categories) {
      const weight = categoryWeights[category.slug] || 0.01;
      cumulative += weight;
      if (random <= cumulative) {
        return category;
      }
    }

    // Fallback to random selection
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Select random skills from category
   */
  private selectRandomSkills(categorySkills: any[], min: number, max: number): any[] {
    if (categorySkills.length === 0) {
      return [];
    }

    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...categorySkills].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, categorySkills.length));
  }

  /**
   * Select random client
   */
  private selectRandomClient(clients: any[]): any {
    if (clients.length === 0) {
      throw new Error('No clients available for project generation');
    }
    return clients[Math.floor(Math.random() * clients.length)];
  }

  /**
   * Select project complexity with realistic distribution
   */
  private selectComplexity(): ProjectComplexity {
    const complexities: ProjectComplexity[] = ['simple', 'moderate', 'complex', 'enterprise'];
    const weights = [0.3, 0.4, 0.25, 0.05]; // 30% simple, 40% moderate, 25% complex, 5% enterprise
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < complexities.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return complexities[i];
      }
    }
    
    return 'moderate'; // fallback
  }

  /**
   * Estimate hours based on complexity
   */
  private estimateHours(complexity: ProjectComplexity): number {
    const hourRanges = {
      simple: [10, 40],
      moderate: [40, 120],
      complex: [120, 300],
      enterprise: [300, 800],
    };

    const [min, max] = hourRanges[complexity];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate budget based on complexity and market data
   */
  private generateBudget(complexity: ProjectComplexity, skills: any[], estimatedHours: number): BudgetData {
    const skillNames = skills.map((s: any) => s.name);
    const budget = calculateRealisticBudget('project', skillNames, estimatedHours, complexity);
    
    return {
      type: budget.type,
      min: budget.min,
      max: budget.max,
      currency: 'USD',
    };
  }

  /**
   * Generate timeline based on complexity and hours
   */
  private generateTimeline(complexity: ProjectComplexity, estimatedHours: number): TimelineData {
    // Assume 6 hours of work per day on average
    const workDaysNeeded = Math.ceil(estimatedHours / 6);
    
    // Add buffer based on complexity
    const bufferMultipliers = {
      simple: 1.2,
      moderate: 1.4,
      complex: 1.6,
      enterprise: 2.0,
    };
    
    const totalDays = Math.ceil(workDaysNeeded * bufferMultipliers[complexity]);
    
    // Convert to appropriate units
    if (totalDays <= 14) {
      return { duration: totalDays, unit: 'days' };
    } else if (totalDays <= 90) {
      const weeks = Math.ceil(totalDays / 7);
      return { duration: weeks, unit: 'weeks' };
    } else {
      const months = Math.ceil(totalDays / 30);
      return { duration: months, unit: 'months' };
    }
  }

  /**
   * Select project status with realistic distribution
   */
  private selectStatus(): ProjectStatus {
    const statuses: ProjectStatus[] = ['draft', 'open', 'in_progress', 'completed', 'cancelled'];
    const weights = [0.15, 0.35, 0.25, 0.20, 0.05]; // Realistic distribution
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return statuses[i];
      }
    }
    
    return 'open'; // fallback
  }

  /**
   * Select industry type
   */
  private selectIndustryType(): string {
    return this.industryTypes[Math.floor(Math.random() * this.industryTypes.length)];
  }

  /**
   * Generate project title
   */
  private generateTitle(category: any, complexity: ProjectComplexity, industryProject: any): string {
    const complexityAdjectives = {
      simple: ['Quick', 'Simple', 'Basic', 'Straightforward'],
      moderate: ['Professional', 'Complete', 'Full-Featured', 'Comprehensive'],
      complex: ['Advanced', 'Enterprise-Grade', 'Scalable', 'High-Performance'],
      enterprise: ['Enterprise', 'Large-Scale', 'Mission-Critical', 'Strategic'],
    };

    const adjective = complexityAdjectives[complexity][
      Math.floor(Math.random() * complexityAdjectives[complexity].length)
    ];

    // Use industry project title or generate based on category
    if (Math.random() > 0.5 && industryProject.title) {
      return `${adjective} ${industryProject.title}`;
    }

    const categoryTitles = {
      'web-development': ['Website Development', 'Web Application', 'E-commerce Platform', 'Web Portal'],
      'mobile-development': ['Mobile App', 'iOS Application', 'Android App', 'Cross-Platform App'],
      'ui-ux-design': ['UI/UX Design', 'User Interface Design', 'User Experience Design', 'Design System'],
      'data-science': ['Data Analysis', 'Machine Learning Model', 'Data Pipeline', 'Analytics Dashboard'],
      'digital-marketing': ['Marketing Campaign', 'SEO Optimization', 'Social Media Strategy', 'Content Marketing'],
      'devops': ['CI/CD Pipeline', 'Infrastructure Setup', 'Cloud Migration', 'DevOps Implementation'],
      'content-writing': ['Content Creation', 'Blog Writing', 'Technical Documentation', 'Copywriting'],
      'graphic-design': ['Logo Design', 'Brand Identity', 'Marketing Materials', 'Visual Design'],
      'video-animation': ['Video Production', 'Animation Project', 'Motion Graphics', 'Video Editing'],
      'game-development': ['Game Development', 'Mobile Game', 'Web Game', 'Game Design'],
      'blockchain': ['Smart Contract', 'DApp Development', 'Blockchain Integration', 'Crypto Platform'],
    };

    const titles = categoryTitles[category.slug as keyof typeof categoryTitles] || ['Custom Project'];
    const baseTitle = titles[Math.floor(Math.random() * titles.length)];
    
    return `${adjective} ${baseTitle}`;
  }

  /**
   * Generate project description
   */
  private generateDescription(industryProject: any, complexity: ProjectComplexity, skills: any[]): string {
    const skillNames = skills.map((s: any) => s.name).slice(0, 4).join(', ');
    
    const complexityDescriptions = {
      simple: 'We need a straightforward solution that meets our basic requirements.',
      moderate: 'Looking for a professional solution with modern features and good user experience.',
      complex: 'Seeking an advanced solution with sophisticated features and high performance requirements.',
      enterprise: 'Enterprise-level project requiring scalable architecture and robust security measures.',
    };

    const baseDescription = industryProject.description || complexityDescriptions[complexity];
    
    const additionalDetails = [
      `Technologies required: ${skillNames}.`,
      'Looking for an experienced professional who can deliver high-quality results.',
      'Please provide examples of similar work in your proposal.',
      'Clear communication and regular updates are essential.',
    ];

    return `${baseDescription} ${additionalDetails.join(' ')}`;
  }

  /**
   * Generate project requirements
   */
  private generateRequirements(complexity: ProjectComplexity, industryProject: any): string[] {
    const baseRequirements = [
      'Clean, well-documented code',
      'Responsive design',
      'Cross-browser compatibility',
      'Regular progress updates',
    ];

    const complexityRequirements = {
      simple: [
        'Basic functionality',
        'Simple user interface',
        'Mobile-friendly design',
      ],
      moderate: [
        'User authentication',
        'Database integration',
        'Admin panel',
        'SEO optimization',
      ],
      complex: [
        'Scalable architecture',
        'Performance optimization',
        'Security best practices',
        'API integration',
        'Testing coverage',
      ],
      enterprise: [
        'Enterprise security standards',
        'High availability',
        'Load balancing',
        'Monitoring and logging',
        'Disaster recovery',
        'Compliance requirements',
      ],
    };

    const requirements = [
      ...baseRequirements,
      ...complexityRequirements[complexity],
    ];

    // Add industry-specific requirements
    if (industryProject.specialRequirements) {
      requirements.push(...industryProject.specialRequirements.slice(0, 2));
    }

    return requirements;
  }

  /**
   * Generate draft save date
   */
  private generateDraftSaveDate(): Date {
    const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }
}
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
    if (config.enableModules.includes('foundation')) {
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
    if (config.enableModules.includes('interactions')) {
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
    
    // This will be implemented in the next tasks
    // For now, return placeholder counts
    return { categories: 0, skills: 0 };
  }

  /**
   * Seed users with auto-generated slugs
   */
  private async seedUsers(config: SeedConfiguration, context: GenerationContext): Promise<number> {
    logger.info(' Seeding users...');
    
    // This will be implemented in task 3
    // For now, return placeholder count
    return 0;
  }

  /**
   * Seed organizations
   */
  private async seedOrganizations(context: GenerationContext): Promise<number> {
    logger.info(' Seeding organizations...');
    
    // This will be implemented in later tasks
    return 0;
  }

  /**
   * Seed projects with market-based data
   */
  private async seedProjects(config: SeedConfiguration, context: GenerationContext): Promise<number> {
    logger.info(' Seeding projects...');
    
    // This will be implemented in task 3.3
    return 0;
  }

  /**
   * Seed interaction data (proposals, contracts, reviews)
   */
  private async seedInteractionData(context: GenerationContext): Promise<{ proposals: number; contracts: number; reviews: number }> {
    logger.info(' Seeding interaction data...');
    
    // This will be implemented in later tasks
    return { proposals: 0, contracts: 0, reviews: 0 };
  }

  /**
   * Calculate total steps for progress tracking
   */
  private calculateTotalSteps(config: SeedConfiguration): number {
    let steps = 2; // Database connection + cleanup
    
    if (config.enableModules.includes('foundation')) steps += 1;
    if (config.enableModules.includes('users')) steps += 1;
    if (config.enableModules.includes('organizations')) steps += 1;
    if (config.enableModules.includes('projects')) steps += 1;
    if (config.enableModules.includes('interactions')) steps += 1;
    
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
import { logger } from '@/utils/logger';
import { 
  SeedConfiguration, 
  Environment, 
  UserCountConfig, 
  ProjectCountConfig,
  ValidationResult 
} from './types';

/**
 * Manages seeding configurations for different environments
 * Supports development, testing, and demo environment configurations
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private configurations: Map<Environment, SeedConfiguration> = new Map();

  private constructor() {
    this.initializeDefaultConfigurations();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get configuration for specific environment
   */
  getConfiguration(environment: Environment): SeedConfiguration {
    const config = this.configurations.get(environment);
    if (!config) {
      throw new Error(`No configuration found for environment: ${environment}`);
    }

    // Apply environment variable overrides
    return this.applyEnvironmentOverrides(config);
  }

  /**
   * Set custom configuration for environment
   */
  setConfiguration(environment: Environment, config: SeedConfiguration): void {
    const validationResult = this.validateConfiguration(config);
    if (!validationResult.isValid) {
      throw new Error(`Invalid configuration: ${validationResult.errors.join(', ')}`);
    }

    this.configurations.set(environment, { ...config });
    logger.info(` Configuration set for environment: ${environment}`);
  }

  /**
   * Get all available environments
   */
  getAvailableEnvironments(): Environment[] {
    return Array.from(this.configurations.keys());
  }

  /**
   * Initialize default configurations for all environments
   */
  private initializeDefaultConfigurations(): void {
    // Development environment - comprehensive test data
    this.configurations.set('development', {
      environment: 'development',
      userCounts: {
        admins: 3,
        clients: 25,
        freelancers: 50
      },
      projectCounts: {
        draft: 8,
        open: 15,
        inProgress: 12,
        completed: 20,
        cancelled: 3
      },
      enableModules: [
        'users',
        'projects', 
        'proposals',
        'contracts',
        'reviews',
        'organizations',
        'categories',
        'skills'
      ],
      batchSize: 100,
      skipExisting: false
    });

    // Testing environment - minimal data for CI/CD
    this.configurations.set('testing', {
      environment: 'testing',
      userCounts: {
        admins: 1,
        clients: 5,
        freelancers: 10
      },
      projectCounts: {
        draft: 2,
        open: 3,
        inProgress: 2,
        completed: 5,
        cancelled: 1
      },
      enableModules: [
        'users',
        'projects',
        'proposals',
        'contracts',
        'reviews'
      ],
      batchSize: 50,
      skipExisting: true
    });

    // Demo environment - curated, presentation-ready data
    this.configurations.set('demo', {
      environment: 'demo',
      userCounts: {
        admins: 2,
        clients: 15,
        freelancers: 30
      },
      projectCounts: {
        draft: 3,
        open: 8,
        inProgress: 6,
        completed: 15,
        cancelled: 2
      },
      enableModules: [
        'users',
        'projects',
        'proposals', 
        'contracts',
        'reviews',
        'organizations',
        'categories',
        'skills'
      ],
      batchSize: 75,
      skipExisting: false
    });

    logger.info(' Initialized default configurations for all environments');
  }

  /**
   * Apply environment variable overrides to configuration
   */
  private applyEnvironmentOverrides(baseConfig: SeedConfiguration): SeedConfiguration {
    const config = { ...baseConfig };

    // User count overrides
    if (process.env.SEED_ADMIN_COUNT) {
      config.userCounts.admins = parseInt(process.env.SEED_ADMIN_COUNT, 10);
    }
    if (process.env.SEED_CLIENT_COUNT) {
      config.userCounts.clients = parseInt(process.env.SEED_CLIENT_COUNT, 10);
    }
    if (process.env.SEED_FREELANCER_COUNT) {
      config.userCounts.freelancers = parseInt(process.env.SEED_FREELANCER_COUNT, 10);
    }

    // Project count overrides
    if (process.env.SEED_PROJECT_DRAFT_COUNT) {
      config.projectCounts.draft = parseInt(process.env.SEED_PROJECT_DRAFT_COUNT, 10);
    }
    if (process.env.SEED_PROJECT_OPEN_COUNT) {
      config.projectCounts.open = parseInt(process.env.SEED_PROJECT_OPEN_COUNT, 10);
    }
    if (process.env.SEED_PROJECT_PROGRESS_COUNT) {
      config.projectCounts.inProgress = parseInt(process.env.SEED_PROJECT_PROGRESS_COUNT, 10);
    }
    if (process.env.SEED_PROJECT_COMPLETED_COUNT) {
      config.projectCounts.completed = parseInt(process.env.SEED_PROJECT_COMPLETED_COUNT, 10);
    }
    if (process.env.SEED_PROJECT_CANCELLED_COUNT) {
      config.projectCounts.cancelled = parseInt(process.env.SEED_PROJECT_CANCELLED_COUNT, 10);
    }

    // Batch size override
    if (process.env.SEED_BATCH_SIZE) {
      config.batchSize = parseInt(process.env.SEED_BATCH_SIZE, 10);
    }

    // Skip existing override
    if (process.env.SEED_SKIP_EXISTING) {
      config.skipExisting = process.env.SEED_SKIP_EXISTING.toLowerCase() === 'true';
    }

    // Module overrides
    if (process.env.SEED_ENABLE_MODULES) {
      config.enableModules = process.env.SEED_ENABLE_MODULES.split(',').map(m => m.trim());
    }

    return config;
  }

  /**
   * Validate configuration parameters
   */
  validateConfiguration(config: SeedConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Environment validation
    if (!['development', 'testing', 'demo'].includes(config.environment)) {
      errors.push('Environment must be development, testing, or demo');
    }

    // User count validation
    if (config.userCounts.admins < 1) {
      errors.push('At least 1 admin user is required');
    }
    if (config.userCounts.admins > 10) {
      warnings.push('More than 10 admin users is unusual');
    }
    if (config.userCounts.clients < 1) {
      errors.push('At least 1 client user is required');
    }
    if (config.userCounts.freelancers < 1) {
      errors.push('At least 1 freelancer user is required');
    }
    if (config.userCounts.clients + config.userCounts.freelancers > 1000) {
      warnings.push('Large user counts may impact seeding performance');
    }

    // Project count validation
    const totalProjects = Object.values(config.projectCounts).reduce((sum, count) => sum + count, 0);
    if (totalProjects === 0) {
      errors.push('At least one project is required');
    }
    if (totalProjects > config.userCounts.clients * 10) {
      warnings.push('Project count seems high relative to client count');
    }

    // Batch size validation
    if (config.batchSize < 1) {
      errors.push('Batch size must be at least 1');
    }
    if (config.batchSize > 1000) {
      warnings.push('Large batch sizes may cause memory issues');
    }

    // Module validation
    const validModules = ['users', 'projects', 'proposals', 'contracts', 'reviews', 'organizations', 'categories', 'skills'];
    const invalidModules = config.enableModules.filter(module => !validModules.includes(module));
    if (invalidModules.length > 0) {
      errors.push(`Invalid modules: ${invalidModules.join(', ')}`);
    }

    // Dependency validation
    if (config.enableModules.includes('proposals') && !config.enableModules.includes('projects')) {
      errors.push('Proposals module requires projects module');
    }
    if (config.enableModules.includes('contracts') && !config.enableModules.includes('proposals')) {
      errors.push('Contracts module requires proposals module');
    }
    if (config.enableModules.includes('reviews') && !config.enableModules.includes('contracts')) {
      errors.push('Reviews module requires contracts module');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration summary for logging
   */
  getConfigurationSummary(config: SeedConfiguration): string {
    const totalUsers = config.userCounts.admins + config.userCounts.clients + config.userCounts.freelancers;
    const totalProjects = Object.values(config.projectCounts).reduce((sum, count) => sum + count, 0);
    
    return `Environment: ${config.environment}
Users: ${totalUsers} (${config.userCounts.admins} admins, ${config.userCounts.clients} clients, ${config.userCounts.freelancers} freelancers)
Projects: ${totalProjects} (${config.projectCounts.draft} draft, ${config.projectCounts.open} open, ${config.projectCounts.inProgress} in progress, ${config.projectCounts.completed} completed, ${config.projectCounts.cancelled} cancelled)
Modules: ${config.enableModules.join(', ')}
Batch Size: ${config.batchSize}
Skip Existing: ${config.skipExisting}`;
  }

  /**
   * Create configuration from environment variables
   */
  static createFromEnvironment(): SeedConfiguration {
    const environment = (process.env.SEED_ENVIRONMENT || 'development') as Environment;
    const manager = ConfigurationManager.getInstance();
    return manager.getConfiguration(environment);
  }

  /**
   * Get recommended configuration based on use case
   */
  getRecommendedConfiguration(useCase: 'development' | 'testing' | 'demo' | 'performance'): SeedConfiguration {
    switch (useCase) {
      case 'development':
        return this.getConfiguration('development');
      
      case 'testing':
        return this.getConfiguration('testing');
      
      case 'demo':
        return this.getConfiguration('demo');
      
      case 'performance':
        return {
          environment: 'development',
          userCounts: {
            admins: 5,
            clients: 100,
            freelancers: 200
          },
          projectCounts: {
            draft: 20,
            open: 50,
            inProgress: 40,
            completed: 100,
            cancelled: 10
          },
          enableModules: [
            'users',
            'projects',
            'proposals',
            'contracts',
            'reviews',
            'organizations',
            'categories',
            'skills'
          ],
          batchSize: 200,
          skipExisting: false
        };
      
      default:
        return this.getConfiguration('development');
    }
  }

  /**
   * Export configuration to JSON
   */
  exportConfiguration(environment: Environment): string {
    const config = this.getConfiguration(environment);
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfiguration(environment: Environment, configJson: string): void {
    try {
      const config = JSON.parse(configJson) as SeedConfiguration;
      config.environment = environment; // Ensure environment matches
      this.setConfiguration(environment, config);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(environment?: Environment): void {
    if (environment) {
      this.configurations.delete(environment);
    } else {
      this.configurations.clear();
    }
    this.initializeDefaultConfigurations();
    logger.info(` Reset configurations to defaults${environment ? ` for ${environment}` : ''}`);
  }

  /**
   * Get configuration validation errors for environment variables
   */
  validateEnvironmentVariables(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for invalid numeric values
    const numericEnvVars = [
      'SEED_ADMIN_COUNT',
      'SEED_CLIENT_COUNT', 
      'SEED_FREELANCER_COUNT',
      'SEED_PROJECT_DRAFT_COUNT',
      'SEED_PROJECT_OPEN_COUNT',
      'SEED_PROJECT_PROGRESS_COUNT',
      'SEED_PROJECT_COMPLETED_COUNT',
      'SEED_PROJECT_CANCELLED_COUNT',
      'SEED_BATCH_SIZE'
    ];

    for (const envVar of numericEnvVars) {
      const value = process.env[envVar];
      if (value && (isNaN(parseInt(value, 10)) || parseInt(value, 10) < 0)) {
        errors.push(`${envVar} must be a non-negative number, got: ${value}`);
      }
    }

    // Check boolean values
    const booleanEnvVars = ['SEED_SKIP_EXISTING'];
    for (const envVar of booleanEnvVars) {
      const value = process.env[envVar];
      if (value && !['true', 'false'].includes(value.toLowerCase())) {
        errors.push(`${envVar} must be 'true' or 'false', got: ${value}`);
      }
    }

    // Check environment value
    const environment = process.env.SEED_ENVIRONMENT;
    if (environment && !['development', 'testing', 'demo'].includes(environment)) {
      errors.push(`SEED_ENVIRONMENT must be 'development', 'testing', or 'demo', got: ${environment}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
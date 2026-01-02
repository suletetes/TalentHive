import { logger } from '@/utils/logger';
import { 
  DataGenerator, 
  GenerationContext, 
  ValidationResult, 
  SeedConfiguration,
  UserData,
  ProjectData,
  ProposalData,
  EntityCounts
} from './types';
import { UserGenerator } from './UserGenerator';
import { ProjectGenerator } from './ProjectGenerator';
import { RelationshipGenerator } from './RelationshipGenerator';
import { ContractGenerator, ContractData } from './ContractGenerator';
import { ReviewGenerator, ReviewData } from './ReviewGenerator';

/**
 * Module registration interface for extensibility
 */
export interface GeneratorModule {
  name: string;
  generator: DataGenerator<any>;
  dependencies: string[];
  priority: number;
  enabled: boolean;
  category: 'core' | 'extended' | 'plugin';
}

/**
 * Generation result for a specific module
 */
export interface ModuleGenerationResult {
  moduleName: string;
  success: boolean;
  generatedCount: number;
  duration: number;
  errors: string[];
  warnings: string[];
}

/**
 * Selective seeding options
 */
export interface SelectiveSeedingOptions {
  modules?: string[];
  categories?: ('core' | 'extended' | 'plugin')[];
  skipDependencies?: boolean;
  dryRun?: boolean;
}

/**
 * Modular data generator system that provides separation of concerns
 * and supports selective seeding of specific data categories
 */
export class ModularGeneratorSystem {
  private modules: Map<string, GeneratorModule> = new Map();
  private generationOrder: string[] = [];
  private context: GenerationContext;

  constructor(context: GenerationContext) {
    this.context = context;
    this.initializeCoreModules();
  }

  /**
   * Initialize core system modules
   */
  private initializeCoreModules(): void {
    // Register core modules with their dependencies and priorities
    this.registerModule({
      name: 'users',
      generator: new UserGenerator(),
      dependencies: [],
      priority: 1,
      enabled: true,
      category: 'core'
    });

    this.registerModule({
      name: 'projects',
      generator: new ProjectGenerator(),
      dependencies: ['users'],
      priority: 2,
      enabled: true,
      category: 'core'
    });

    this.registerModule({
      name: 'proposals',
      generator: new RelationshipGenerator(),
      dependencies: ['users', 'projects'],
      priority: 3,
      enabled: true,
      category: 'core'
    });

    this.registerModule({
      name: 'contracts',
      generator: new ContractGenerator(),
      dependencies: ['users', 'projects', 'proposals'],
      priority: 4,
      enabled: true,
      category: 'core'
    });

    this.registerModule({
      name: 'reviews',
      generator: new ReviewGenerator(),
      dependencies: ['users', 'contracts'],
      priority: 5,
      enabled: true,
      category: 'core'
    });

    // Calculate generation order based on dependencies
    this.calculateGenerationOrder();
    
    logger.info(` Initialized modular generator system with ${this.modules.size} modules`);
  }

  /**
   * Register a new generator module
   */
  registerModule(module: GeneratorModule): void {
    if (this.modules.has(module.name)) {
      logger.warn(`Module ${module.name} already registered, overwriting...`);
    }

    this.modules.set(module.name, module);
    this.calculateGenerationOrder();
    
    logger.info(` Registered module: ${module.name} (${module.category})`);
  }

  /**
   * Unregister a module
   */
  unregisterModule(moduleName: string): boolean {
    if (!this.modules.has(moduleName)) {
      logger.warn(`Module ${moduleName} not found for unregistration`);
      return false;
    }

    // Check if other modules depend on this one
    const dependentModules = Array.from(this.modules.values())
      .filter(module => module.dependencies.includes(moduleName))
      .map(module => module.name);

    if (dependentModules.length > 0) {
      logger.error(`Cannot unregister ${moduleName}: modules [${dependentModules.join(', ')}] depend on it`);
      return false;
    }

    this.modules.delete(moduleName);
    this.calculateGenerationOrder();
    
    logger.info(` Unregistered module: ${moduleName}`);
    return true;
  }

  /**
   * Enable or disable a module
   */
  setModuleEnabled(moduleName: string, enabled: boolean): boolean {
    const module = this.modules.get(moduleName);
    if (!module) {
      logger.error(`Module ${moduleName} not found`);
      return false;
    }

    module.enabled = enabled;
    this.calculateGenerationOrder();
    
    logger.info(`${enabled ? '' : ''} Module ${moduleName} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get list of registered modules
   */
  getRegisteredModules(): GeneratorModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: 'core' | 'extended' | 'plugin'): GeneratorModule[] {
    return Array.from(this.modules.values()).filter(module => module.category === category);
  }

  /**
   * Generate data for all enabled modules
   */
  async generateAll(): Promise<ModuleGenerationResult[]> {
    logger.info(' Starting modular data generation for all enabled modules...');
    
    const results: ModuleGenerationResult[] = [];
    const enabledModules = this.generationOrder.filter(name => {
      const module = this.modules.get(name);
      return module?.enabled && this.context.configuration.enableModules.includes(name);
    });

    for (const moduleName of enabledModules) {
      const result = await this.generateModule(moduleName);
      results.push(result);
      
      // Stop if there were critical errors
      if (!result.success && this.isCriticalModule(moduleName)) {
        logger.error(` Critical module ${moduleName} failed, stopping generation`);
        break;
      }
    }

    const totalGenerated = results.reduce((sum, r) => sum + r.generatedCount, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const successfulModules = results.filter(r => r.success).length;

    logger.info(` Modular generation complete: ${successfulModules}/${results.length} modules successful, ${totalGenerated} entities generated in ${totalDuration}ms`);
    
    return results;
  }

  /**
   * Generate data for specific modules (selective seeding)
   */
  async generateSelective(options: SelectiveSeedingOptions): Promise<ModuleGenerationResult[]> {
    logger.info(' Starting selective data generation...');
    
    let modulesToGenerate: string[] = [];

    if (options.modules) {
      modulesToGenerate = options.modules;
    } else if (options.categories) {
      modulesToGenerate = Array.from(this.modules.values())
        .filter(module => options.categories!.includes(module.category))
        .map(module => module.name);
    } else {
      modulesToGenerate = this.generationOrder;
    }

    // Include dependencies unless explicitly skipped
    if (!options.skipDependencies) {
      modulesToGenerate = this.resolveDependencies(modulesToGenerate);
    }

    // Filter by enabled modules and configuration
    const enabledModules = modulesToGenerate.filter(name => {
      const module = this.modules.get(name);
      return module?.enabled && this.context.configuration.enableModules.includes(name);
    });

    if (options.dryRun) {
      logger.info(` Dry run - would generate modules: ${enabledModules.join(', ')}`);
      return enabledModules.map(name => ({
        moduleName: name,
        success: true,
        generatedCount: 0,
        duration: 0,
        errors: [],
        warnings: ['Dry run - no data generated']
      }));
    }

    const results: ModuleGenerationResult[] = [];
    for (const moduleName of enabledModules) {
      const result = await this.generateModule(moduleName);
      results.push(result);
    }

    logger.info(` Selective generation complete: ${results.length} modules processed`);
    return results;
  }

  /**
   * Generate data for a specific module
   */
  private async generateModule(moduleName: string): Promise<ModuleGenerationResult> {
    const startTime = Date.now();
    const module = this.modules.get(moduleName);
    
    if (!module) {
      return {
        moduleName,
        success: false,
        generatedCount: 0,
        duration: 0,
        errors: [`Module ${moduleName} not found`],
        warnings: []
      };
    }

    logger.info(` Generating data for module: ${moduleName}`);

    try {
      // Get count for this module from configuration
      const count = this.getModuleCount(moduleName);
      
      if (count === 0) {
        logger.info(` Skipping ${moduleName} - count is 0`);
        return {
          moduleName,
          success: true,
          generatedCount: 0,
          duration: Date.now() - startTime,
          errors: [],
          warnings: ['Skipped - count is 0']
        };
      }

      // Generate data
      const data = await module.generator.generate(count, this.context);
      
      // Validate generated data
      const validation = module.generator.validate(data);
      
      // Store generated data in context for dependent modules
      this.context.existingData.set(moduleName, data);
      
      const duration = Date.now() - startTime;
      
      logger.info(` Module ${moduleName}: generated ${data.length} entities in ${duration}ms`);
      
      return {
        moduleName,
        success: validation.isValid,
        generatedCount: data.length,
        duration,
        errors: validation.errors,
        warnings: validation.warnings
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(` Module ${moduleName} failed: ${errorMessage}`);
      
      return {
        moduleName,
        success: false,
        generatedCount: 0,
        duration,
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * Get the count for a specific module from configuration
   */
  private getModuleCount(moduleName: string): number {
    const config = this.context.configuration;
    
    switch (moduleName) {
      case 'users':
        return config.userCounts.admins + config.userCounts.clients + config.userCounts.freelancers;
      case 'projects':
        return Object.values(config.projectCounts).reduce((sum, count) => sum + count, 0);
      case 'proposals':
        // Typically 2-5 proposals per open project
        return config.projectCounts.open * 3;
      case 'contracts':
        // Contracts come from accepted proposals (about 15% acceptance rate)
        return Math.floor(config.projectCounts.open * 3 * 0.15);
      case 'reviews':
        // Reviews come from completed contracts (about 80% review rate)
        return Math.floor(config.projectCounts.completed * 0.8);
      default:
        return 10; // Default count for custom modules
    }
  }

  /**
   * Calculate generation order based on dependencies
   */
  private calculateGenerationOrder(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (moduleName: string): void => {
      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected involving module: ${moduleName}`);
      }
      
      if (visited.has(moduleName)) {
        return;
      }

      const module = this.modules.get(moduleName);
      if (!module) {
        throw new Error(`Module ${moduleName} not found`);
      }

      visiting.add(moduleName);
      
      // Visit dependencies first
      for (const dependency of module.dependencies) {
        visit(dependency);
      }
      
      visiting.delete(moduleName);
      visited.add(moduleName);
      order.push(moduleName);
    };

    // Sort modules by priority first, then visit
    const moduleNames = Array.from(this.modules.keys())
      .sort((a, b) => {
        const moduleA = this.modules.get(a)!;
        const moduleB = this.modules.get(b)!;
        return moduleA.priority - moduleB.priority;
      });

    for (const moduleName of moduleNames) {
      if (!visited.has(moduleName)) {
        visit(moduleName);
      }
    }

    this.generationOrder = order;
    logger.debug(` Generation order calculated: ${order.join(' → ')}`);
  }

  /**
   * Resolve dependencies for a list of modules
   */
  private resolveDependencies(moduleNames: string[]): string[] {
    const resolved = new Set<string>();
    
    const resolve = (moduleName: string): void => {
      if (resolved.has(moduleName)) {
        return;
      }
      
      const module = this.modules.get(moduleName);
      if (!module) {
        logger.warn(`Module ${moduleName} not found when resolving dependencies`);
        return;
      }
      
      // Resolve dependencies first
      for (const dependency of module.dependencies) {
        resolve(dependency);
      }
      
      resolved.add(moduleName);
    };

    for (const moduleName of moduleNames) {
      resolve(moduleName);
    }

    // Return in generation order
    return this.generationOrder.filter(name => resolved.has(name));
  }

  /**
   * Check if a module is critical (failure should stop generation)
   */
  private isCriticalModule(moduleName: string): boolean {
    const criticalModules = ['users', 'projects'];
    return criticalModules.includes(moduleName);
  }

  /**
   * Validate module interfaces for consistency
   */
  validateModuleInterfaces(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [name, module] of this.modules) {
      // Check if generator implements required interface
      if (!module.generator.generate || typeof module.generator.generate !== 'function') {
        errors.push(`Module ${name}: generator missing generate() method`);
      }
      
      if (!module.generator.validate || typeof module.generator.validate !== 'function') {
        errors.push(`Module ${name}: generator missing validate() method`);
      }
      
      if (!module.generator.getDependencies || typeof module.generator.getDependencies !== 'function') {
        errors.push(`Module ${name}: generator missing getDependencies() method`);
      }

      // Check dependency consistency
      const declaredDeps = module.dependencies;
      const generatorDeps = module.generator.getDependencies();
      
      const missingDeps = generatorDeps.filter(dep => !declaredDeps.includes(dep));
      if (missingDeps.length > 0) {
        warnings.push(`Module ${name}: generator declares dependencies [${generatorDeps.join(', ')}] but module only lists [${declaredDeps.join(', ')}]`);
      }

      // Check if dependencies exist
      for (const dep of declaredDeps) {
        if (!this.modules.has(dep)) {
          errors.push(`Module ${name}: dependency '${dep}' not registered`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get system statistics
   */
  getSystemStats(): any {
    const modules = Array.from(this.modules.values());
    const enabledCount = modules.filter(m => m.enabled).length;
    const categoryStats = {
      core: modules.filter(m => m.category === 'core').length,
      extended: modules.filter(m => m.category === 'extended').length,
      plugin: modules.filter(m => m.category === 'plugin').length
    };

    return {
      totalModules: modules.length,
      enabledModules: enabledCount,
      disabledModules: modules.length - enabledCount,
      categoryBreakdown: categoryStats,
      generationOrder: this.generationOrder,
      configuredModules: this.context.configuration.enableModules
    };
  }

  /**
   * Export module configuration
   */
  exportConfiguration(): any {
    const config = {
      modules: {},
      generationOrder: this.generationOrder,
      timestamp: new Date().toISOString()
    };

    for (const [name, module] of this.modules) {
      config.modules[name] = {
        dependencies: module.dependencies,
        priority: module.priority,
        enabled: module.enabled,
        category: module.category
      };
    }

    return config;
  }

  /**
   * Import module configuration
   */
  importConfiguration(config: any): void {
    if (!config.modules) {
      throw new Error('Invalid configuration: missing modules');
    }

    for (const [name, moduleConfig] of Object.entries(config.modules as any)) {
      const existingModule = this.modules.get(name);
      if (existingModule) {
        existingModule.enabled = moduleConfig.enabled;
        existingModule.priority = moduleConfig.priority;
        // Note: dependencies and category are not updated to prevent breaking changes
      }
    }

    this.calculateGenerationOrder();
    logger.info(' Module configuration imported successfully');
  }

  /**
   * Reset all modules to default state
   */
  reset(): void {
    this.context.existingData.clear();
    
    // Reset all modules to enabled state
    for (const module of this.modules.values()) {
      module.enabled = true;
    }
    
    this.calculateGenerationOrder();
    logger.info(' Modular generator system reset to default state');
  }
}
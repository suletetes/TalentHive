import { logger } from '@/utils/logger';
import { 
  SeedPlugin, 
  PluginContext, 
  PluginGenerator, 
  PluginMetadata 
} from '../PluginSystem';
import { 
  DataGenerator, 
  GenerationContext, 
  ValidationResult 
} from '../types';

/**
 * Example data structure for demonstration
 */
interface ExampleData {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

/**
 * Example data generator for demonstration
 */
class ExampleDataGenerator implements DataGenerator<ExampleData> {
  
  async generate(count: number, context: GenerationContext): Promise<ExampleData[]> {
    logger.info(` Generating ${count} example data items...`);
    
    const data: ExampleData[] = [];
    
    for (let i = 0; i < count; i++) {
      data.push({
        id: `example-${i + 1}`,
        name: `Example Item ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
        createdAt: new Date(),
        metadata: {
          category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          priority: Math.floor(Math.random() * 5) + 1,
          tags: [`tag${Math.floor(Math.random() * 10)}`, `tag${Math.floor(Math.random() * 10)}`]
        }
      });
    }
    
    return data;
  }

  validate(data: ExampleData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const prefix = `Example item ${i + 1}`;

      if (!item.id) {
        errors.push(`${prefix}: ID is required`);
      }
      if (!item.name) {
        errors.push(`${prefix}: Name is required`);
      }
      if (typeof item.value !== 'number') {
        errors.push(`${prefix}: Value must be a number`);
      }
      if (!(item.createdAt instanceof Date)) {
        errors.push(`${prefix}: CreatedAt must be a Date`);
      }
      if (item.value < 0) {
        warnings.push(`${prefix}: Negative value (${item.value})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getDependencies(): string[] {
    return []; // No dependencies for this example
  }
}

/**
 * Example plugin implementation
 * Demonstrates how to create a custom plugin for the seeding system
 */
export class ExamplePlugin implements SeedPlugin {
  name = 'example-plugin';
  version = '1.0.0';
  description = 'Example plugin demonstrating the plugin system capabilities';
  author = 'TalentHive Development Team';
  dependencies: string[] = [];
  category: 'plugin' = 'plugin';

  private context?: PluginContext;
  private generators: PluginGenerator[] = [];

  /**
   * Initialize the plugin
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    
    logger.info(` Initializing ${this.name} v${this.version}`);
    
    // Create generators
    this.generators = [
      {
        name: 'example-data',
        generator: new ExampleDataGenerator(),
        dependencies: [],
        priority: 100, // Low priority (runs after core modules)
        enabled: true
      }
    ];
    
    // Perform any initialization logic here
    // For example: validate configuration, set up connections, etc.
    
    logger.info(` ${this.name} initialized with ${this.generators.length} generators`);
  }

  /**
   * Cleanup when plugin is unloaded
   */
  async cleanup(): Promise<void> {
    logger.info(` Cleaning up ${this.name}`);
    
    // Perform cleanup logic here
    // For example: close connections, clear caches, etc.
    
    this.context = undefined;
    this.generators = [];
    
    logger.info(` ${this.name} cleanup complete`);
  }

  /**
   * Get data generators provided by this plugin
   */
  getGenerators(): PluginGenerator[] {
    return this.generators;
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): PluginMetadata {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      homepage: 'https://github.com/talenthive/seeding-plugins',
      repository: 'https://github.com/talenthive/seeding-plugins/tree/main/example-plugin',
      license: 'MIT',
      keywords: ['seeding', 'example', 'demo', 'plugin'],
      engines: {
        node: '>=16.0.0',
        npm: '>=8.0.0'
      }
    };
  }

  /**
   * Plugin-specific configuration method (optional)
   */
  configure(options: any): void {
    if (this.context) {
      this.context.configuration = { ...this.context.configuration, ...options };
      logger.info(` ${this.name} configuration updated`);
    }
  }

  /**
   * Plugin-specific status method (optional)
   */
  getStatus(): any {
    return {
      name: this.name,
      version: this.version,
      initialized: !!this.context,
      generators: this.generators.length,
      enabled: this.generators.filter(g => g.enabled).length,
      uptime: this.context ? Date.now() - new Date().getTime() : 0
    };
  }
}

/**
 * Factory function to create plugin instance
 * This is the recommended way to export plugins
 */
export function createExamplePlugin(): ExamplePlugin {
  return new ExamplePlugin();
}

/**
 * Plugin manifest (optional but recommended)
 * Can be used by plugin managers to understand the plugin without loading it
 */
export const pluginManifest = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'Example plugin demonstrating the plugin system capabilities',
  author: 'TalentHive Development Team',
  main: 'ExamplePlugin.ts',
  category: 'plugin',
  dependencies: [],
  engines: {
    node: '>=16.0.0',
    npm: '>=8.0.0'
  },
  keywords: ['seeding', 'example', 'demo', 'plugin']
};
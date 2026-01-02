import { logger } from '@/utils/logger';
import { 
  DataGenerator, 
  GenerationContext, 
  ValidationResult 
} from './types';
import { ModularGeneratorSystem, GeneratorModule } from './ModularGeneratorSystem';

/**
 * Plugin interface that all plugins must implement
 */
export interface SeedPlugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies: string[];
  category: 'core' | 'extended' | 'plugin';
  
  // Plugin lifecycle methods
  initialize(context: PluginContext): Promise<void>;
  cleanup(): Promise<void>;
  
  // Data generation
  getGenerators(): PluginGenerator[];
  
  // Plugin metadata
  getMetadata(): PluginMetadata;
}

/**
 * Plugin generator wrapper
 */
export interface PluginGenerator {
  name: string;
  generator: DataGenerator<any>;
  dependencies: string[];
  priority: number;
  enabled: boolean;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords: string[];
  engines?: {
    node?: string;
    npm?: string;
  };
}

/**
 * Plugin context provided to plugins during initialization
 */
export interface PluginContext {
  generatorSystem: ModularGeneratorSystem;
  configuration: any;
  logger: any;
  utilities: PluginUtilities;
}

/**
 * Utilities provided to plugins
 */
export interface PluginUtilities {
  validateData<T>(data: T[], validator: (item: T) => boolean): ValidationResult;
  generateId(): string;
  formatDate(date: Date): string;
  randomChoice<T>(items: T[]): T;
  randomInt(min: number, max: number): number;
  randomFloat(min: number, max: number): number;
}

/**
 * Plugin loading result
 */
export interface PluginLoadResult {
  success: boolean;
  plugin?: LoadedPlugin;
  error?: string;
  warnings: string[];
}

/**
 * Loaded plugin wrapper
 */
export interface LoadedPlugin {
  plugin: SeedPlugin;
  metadata: PluginMetadata;
  loadedAt: Date;
  enabled: boolean;
  generators: PluginGenerator[];
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult extends ValidationResult {
  compatibilityIssues: string[];
  securityWarnings: string[];
}

/**
 * Plugin system for extensible data generation
 * Supports loading, validating, and managing custom data generation plugins
 */
export class PluginSystem {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private generatorSystem: ModularGeneratorSystem;
  private pluginContext: PluginContext;
  private utilities: PluginUtilities;

  constructor(generatorSystem: ModularGeneratorSystem) {
    this.generatorSystem = generatorSystem;
    this.utilities = this.createUtilities();
    this.pluginContext = {
      generatorSystem: this.generatorSystem,
      configuration: {},
      logger,
      utilities: this.utilities
    };
  }

  /**
   * Load a plugin from a plugin instance
   */
  async loadPlugin(plugin: SeedPlugin): Promise<PluginLoadResult> {
    const warnings: string[] = [];
    
    try {
      logger.info(` Loading plugin: ${plugin.name} v${plugin.version}`);
      
      // Validate plugin
      const validation = await this.validatePlugin(plugin);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Plugin validation failed: ${validation.errors.join(', ')}`,
          warnings: validation.warnings
        };
      }
      
      warnings.push(...validation.warnings);
      warnings.push(...validation.compatibilityIssues);
      warnings.push(...validation.securityWarnings);

      // Check if plugin already loaded
      if (this.plugins.has(plugin.name)) {
        const existing = this.plugins.get(plugin.name)!;
        if (existing.metadata.version === plugin.version) {
          return {
            success: false,
            error: `Plugin ${plugin.name} v${plugin.version} is already loaded`,
            warnings
          };
        }
        
        // Unload existing version
        await this.unloadPlugin(plugin.name);
        warnings.push(`Replaced existing version ${existing.metadata.version}`);
      }

      // Initialize plugin
      await plugin.initialize(this.pluginContext);
      
      // Get generators from plugin
      const generators = plugin.getGenerators();
      
      // Register generators with the modular system
      for (const pluginGenerator of generators) {
        const module: GeneratorModule = {
          name: `${plugin.name}.${pluginGenerator.name}`,
          generator: pluginGenerator.generator,
          dependencies: pluginGenerator.dependencies,
          priority: pluginGenerator.priority,
          enabled: pluginGenerator.enabled,
          category: plugin.category
        };
        
        this.generatorSystem.registerModule(module);
      }

      // Create loaded plugin wrapper
      const loadedPlugin: LoadedPlugin = {
        plugin,
        metadata: plugin.getMetadata(),
        loadedAt: new Date(),
        enabled: true,
        generators
      };

      this.plugins.set(plugin.name, loadedPlugin);
      
      logger.info(` Plugin ${plugin.name} loaded successfully with ${generators.length} generators`);
      
      return {
        success: true,
        plugin: loadedPlugin,
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(` Failed to load plugin ${plugin.name}: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        warnings
      };
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginName: string): Promise<boolean> {
    const loadedPlugin = this.plugins.get(pluginName);
    if (!loadedPlugin) {
      logger.warn(`Plugin ${pluginName} not found for unloading`);
      return false;
    }

    try {
      logger.info(` Unloading plugin: ${pluginName}`);
      
      // Unregister generators
      for (const generator of loadedPlugin.generators) {
        const moduleName = `${pluginName}.${generator.name}`;
        this.generatorSystem.unregisterModule(moduleName);
      }
      
      // Cleanup plugin
      await loadedPlugin.plugin.cleanup();
      
      // Remove from loaded plugins
      this.plugins.delete(pluginName);
      
      logger.info(` Plugin ${pluginName} unloaded successfully`);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(` Failed to unload plugin ${pluginName}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Enable or disable a plugin
   */
  setPluginEnabled(pluginName: string, enabled: boolean): boolean {
    const loadedPlugin = this.plugins.get(pluginName);
    if (!loadedPlugin) {
      logger.error(`Plugin ${pluginName} not found`);
      return false;
    }

    loadedPlugin.enabled = enabled;
    
    // Enable/disable all generators from this plugin
    for (const generator of loadedPlugin.generators) {
      const moduleName = `${pluginName}.${generator.name}`;
      this.generatorSystem.setModuleEnabled(moduleName, enabled);
    }
    
    logger.info(`${enabled ? '' : ''} Plugin ${pluginName} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get list of loaded plugins
   */
  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(pluginName: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: 'core' | 'extended' | 'plugin'): LoadedPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.plugin.category === category);
  }

  /**
   * Validate plugin before loading
   */
  private async validatePlugin(plugin: SeedPlugin): Promise<PluginValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const compatibilityIssues: string[] = [];
    const securityWarnings: string[] = [];

    // Basic interface validation
    if (!plugin.name || typeof plugin.name !== 'string') {
      errors.push('Plugin name is required and must be a string');
    }
    
    if (!plugin.version || typeof plugin.version !== 'string') {
      errors.push('Plugin version is required and must be a string');
    }
    
    if (!plugin.description || typeof plugin.description !== 'string') {
      errors.push('Plugin description is required and must be a string');
    }

    // Validate plugin name format
    if (plugin.name && !/^[a-z0-9-_]+$/i.test(plugin.name)) {
      errors.push('Plugin name must contain only alphanumeric characters, hyphens, and underscores');
    }

    // Validate version format (basic semver check)
    if (plugin.version && !/^\d+\.\d+\.\d+/.test(plugin.version)) {
      warnings.push('Plugin version should follow semantic versioning (x.y.z)');
    }

    // Validate category
    if (!['core', 'extended', 'plugin'].includes(plugin.category)) {
      errors.push('Plugin category must be one of: core, extended, plugin');
    }

    // Validate required methods
    const requiredMethods = ['initialize', 'cleanup', 'getGenerators', 'getMetadata'];
    for (const method of requiredMethods) {
      if (typeof plugin[method as keyof SeedPlugin] !== 'function') {
        errors.push(`Plugin must implement ${method}() method`);
      }
    }

    // Validate dependencies
    if (!Array.isArray(plugin.dependencies)) {
      errors.push('Plugin dependencies must be an array');
    } else {
      for (const dep of plugin.dependencies) {
        if (typeof dep !== 'string') {
          errors.push('All plugin dependencies must be strings');
        }
      }
    }

    // Check for dependency conflicts
    for (const dep of plugin.dependencies) {
      if (!this.generatorSystem.getRegisteredModules().some(m => m.name === dep)) {
        compatibilityIssues.push(`Dependency '${dep}' is not available`);
      }
    }

    // Security validation
    if (plugin.name.includes('..') || plugin.name.includes('/')) {
      securityWarnings.push('Plugin name contains potentially unsafe characters');
    }

    // Try to get generators (basic functionality test)
    try {
      const generators = plugin.getGenerators();
      if (!Array.isArray(generators)) {
        errors.push('getGenerators() must return an array');
      } else {
        // Validate each generator
        for (let i = 0; i < generators.length; i++) {
          const gen = generators[i];
          if (!gen.name || typeof gen.name !== 'string') {
            errors.push(`Generator ${i}: name is required and must be a string`);
          }
          if (!gen.generator || typeof gen.generator.generate !== 'function') {
            errors.push(`Generator ${i}: must implement DataGenerator interface`);
          }
          if (!Array.isArray(gen.dependencies)) {
            errors.push(`Generator ${i}: dependencies must be an array`);
          }
          if (typeof gen.priority !== 'number') {
            errors.push(`Generator ${i}: priority must be a number`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to get generators: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Try to get metadata (basic functionality test)
    try {
      const metadata = plugin.getMetadata();
      if (!metadata || typeof metadata !== 'object') {
        errors.push('getMetadata() must return an object');
      } else {
        if (!metadata.name || metadata.name !== plugin.name) {
          warnings.push('Metadata name should match plugin name');
        }
        if (!metadata.version || metadata.version !== plugin.version) {
          warnings.push('Metadata version should match plugin version');
        }
      }
    } catch (error) {
      errors.push(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compatibilityIssues,
      securityWarnings
    };
  }

  /**
   * Create utility functions for plugins
   */
  private createUtilities(): PluginUtilities {
    return {
      validateData: <T>(data: T[], validator: (item: T) => boolean): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        for (let i = 0; i < data.length; i++) {
          try {
            if (!validator(data[i])) {
              errors.push(`Item ${i + 1} failed validation`);
            }
          } catch (error) {
            errors.push(`Item ${i + 1} validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      },

      generateId: (): string => {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      },

      formatDate: (date: Date): string => {
        return date.toISOString();
      },

      randomChoice: <T>(items: T[]): T => {
        if (items.length === 0) {
          throw new Error('Cannot choose from empty array');
        }
        return items[Math.floor(Math.random() * items.length)];
      },

      randomInt: (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },

      randomFloat: (min: number, max: number): number => {
        return Math.random() * (max - min) + min;
      }
    };
  }

  /**
   * Get system statistics
   */
  getSystemStats(): any {
    const plugins = Array.from(this.plugins.values());
    const enabledCount = plugins.filter(p => p.enabled).length;
    const categoryStats = {
      core: plugins.filter(p => p.plugin.category === 'core').length,
      extended: plugins.filter(p => p.plugin.category === 'extended').length,
      plugin: plugins.filter(p => p.plugin.category === 'plugin').length
    };

    const totalGenerators = plugins.reduce((sum, p) => sum + p.generators.length, 0);

    return {
      totalPlugins: plugins.length,
      enabledPlugins: enabledCount,
      disabledPlugins: plugins.length - enabledCount,
      categoryBreakdown: categoryStats,
      totalGenerators,
      oldestPlugin: plugins.length > 0 ? Math.min(...plugins.map(p => p.loadedAt.getTime())) : null,
      newestPlugin: plugins.length > 0 ? Math.max(...plugins.map(p => p.loadedAt.getTime())) : null
    };
  }

  /**
   * Export plugin configuration
   */
  exportConfiguration(): any {
    const config = {
      plugins: {},
      timestamp: new Date().toISOString()
    };

    for (const [name, loadedPlugin] of this.plugins) {
      config.plugins[name] = {
        version: loadedPlugin.metadata.version,
        enabled: loadedPlugin.enabled,
        loadedAt: loadedPlugin.loadedAt.toISOString(),
        generators: loadedPlugin.generators.map(g => ({
          name: g.name,
          enabled: g.enabled,
          priority: g.priority
        }))
      };
    }

    return config;
  }

  /**
   * Reload all plugins
   */
  async reloadAllPlugins(): Promise<{ success: number; failed: number; errors: string[] }> {
    logger.info(' Reloading all plugins...');
    
    const pluginInstances = Array.from(this.plugins.values()).map(p => p.plugin);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    // Unload all plugins first
    for (const pluginName of this.plugins.keys()) {
      await this.unloadPlugin(pluginName);
    }

    // Reload all plugins
    for (const plugin of pluginInstances) {
      const result = await this.loadPlugin(plugin);
      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`${plugin.name}: ${result.error}`);
      }
    }

    logger.info(` Plugin reload complete: ${success} successful, ${failed} failed`);
    
    return { success, failed, errors };
  }

  /**
   * Clear all plugins
   */
  async clearAllPlugins(): Promise<void> {
    logger.info(' Clearing all plugins...');
    
    const pluginNames = Array.from(this.plugins.keys());
    for (const pluginName of pluginNames) {
      await this.unloadPlugin(pluginName);
    }
    
    logger.info(' All plugins cleared');
  }

  /**
   * Update plugin context (useful when configuration changes)
   */
  updateContext(newConfiguration: any): void {
    this.pluginContext.configuration = newConfiguration;
    logger.info(' Plugin context updated with new configuration');
  }
}
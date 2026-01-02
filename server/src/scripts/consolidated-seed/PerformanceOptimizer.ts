import { logger } from '@/utils/logger';
import { SeedConfiguration } from './types';

/**
 * Performance optimization configuration
 */
export interface OptimizationConfig {
  enableBatchOptimization: boolean;
  enableMemoryOptimization: boolean;
  enableParallelProcessing: boolean;
  enableDatabaseOptimization: boolean;
  customBatchSizes?: {
    users: number;
    projects: number;
    proposals: number;
    contracts: number;
    reviews: number;
  };
  memoryThresholds?: {
    maxHeapUsage: number; // MB
    gcTriggerThreshold: number; // MB
  };
  parallelismConfig?: {
    maxConcurrentOperations: number;
    useWorkerThreads: boolean;
  };
}

/**
 * Optimizes seeding performance through various strategies
 * Implements recommendations from PerformanceValidator
 */
export class PerformanceOptimizer {
  private config: OptimizationConfig;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableBatchOptimization: true,
      enableMemoryOptimization: true,
      enableParallelProcessing: true,
      enableDatabaseOptimization: true,
      customBatchSizes: {
        users: 500,
        projects: 300,
        proposals: 1000,
        contracts: 500,
        reviews: 1000
      },
      memoryThresholds: {
        maxHeapUsage: 400, // 400MB
        gcTriggerThreshold: 300 // 300MB
      },
      parallelismConfig: {
        maxConcurrentOperations: 4,
        useWorkerThreads: false // Keep false for now to avoid complexity
      },
      ...config
    };
  }

  /**
   * Optimize seed configuration for better performance
   */
  optimizeSeedConfiguration(baseConfig: SeedConfiguration): SeedConfiguration {
    logger.info(' Applying performance optimizations to seed configuration...');

    const optimizedConfig = { ...baseConfig };

    // Batch size optimization
    if (this.config.enableBatchOptimization) {
      optimizedConfig.batchSize = this.calculateOptimalBatchSize(baseConfig);
      logger.info(` Optimized batch size: ${optimizedConfig.batchSize}`);
    }

    return optimizedConfig;
  }

  /**
   * Calculate optimal batch size based on data volume and available memory
   */
  private calculateOptimalBatchSize(config: SeedConfiguration): number {
    const totalUsers = config.userCounts.admins + config.userCounts.clients + config.userCounts.freelancers;
    const totalProjects = Object.values(config.projectCounts).reduce((sum, count) => sum + count, 0);
    const totalEntities = totalUsers + totalProjects;

    // Base batch size on total entities and available memory
    let optimalBatchSize = config.batchSize;

    if (totalEntities < 100) {
      optimalBatchSize = Math.max(50, config.batchSize);
    } else if (totalEntities < 500) {
      optimalBatchSize = Math.max(200, config.batchSize);
    } else if (totalEntities < 1000) {
      optimalBatchSize = Math.max(500, config.batchSize);
    } else {
      optimalBatchSize = Math.max(1000, config.batchSize);
    }

    // Ensure batch size doesn't exceed memory limits
    const estimatedMemoryPerItem = 0.5; // MB per item (rough estimate)
    const maxBatchSizeForMemory = Math.floor(
      (this.config.memoryThresholds?.maxHeapUsage || 400) / estimatedMemoryPerItem
    );

    return Math.min(optimalBatchSize, maxBatchSizeForMemory);
  }

  /**
   * Get entity-specific batch sizes
   */
  getEntityBatchSizes(): { [key: string]: number } {
    if (this.config.enableBatchOptimization && this.config.customBatchSizes) {
      return this.config.customBatchSizes;
    }

    // Default batch sizes
    return {
      users: 100,
      projects: 100,
      proposals: 100,
      contracts: 100,
      reviews: 100
    };
  }

  /**
   * Monitor and manage memory usage during seeding
   */
  async monitorMemoryUsage(): Promise<void> {
    if (!this.config.enableMemoryOptimization) {
      return;
    }

    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / (1024 * 1024);
    const heapTotalMB = memoryUsage.heapTotal / (1024 * 1024);

    logger.debug(` Memory usage: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB`);

    // Trigger garbage collection if memory usage is high
    const gcThreshold = this.config.memoryThresholds?.gcTriggerThreshold || 300;
    if (heapUsedMB > gcThreshold && global.gc) {
      logger.info(`  Triggering garbage collection (${heapUsedMB.toFixed(1)}MB used)`);
      global.gc();
      
      // Log memory after GC
      const afterGC = process.memoryUsage();
      const afterGCMB = afterGC.heapUsed / (1024 * 1024);
      logger.info(` Memory after GC: ${afterGCMB.toFixed(1)}MB (freed ${(heapUsedMB - afterGCMB).toFixed(1)}MB)`);
    }

    // Warn if memory usage is too high
    const maxHeapUsage = this.config.memoryThresholds?.maxHeapUsage || 400;
    if (heapUsedMB > maxHeapUsage) {
      logger.warn(`  High memory usage: ${heapUsedMB.toFixed(1)}MB (limit: ${maxHeapUsage}MB)`);
    }
  }

  /**
   * Execute operations in parallel where possible
   */
  async executeInParallel<T>(
    operations: (() => Promise<T>)[],
    operationName: string = 'operations'
  ): Promise<T[]> {
    if (!this.config.enableParallelProcessing) {
      // Execute sequentially
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation());
      }
      return results;
    }

    const maxConcurrent = this.config.parallelismConfig?.maxConcurrentOperations || 4;
    const batches: (() => Promise<T>)[][] = [];
    
    // Split operations into batches
    for (let i = 0; i < operations.length; i += maxConcurrent) {
      batches.push(operations.slice(i, i + maxConcurrent));
    }

    logger.info(` Executing ${operations.length} ${operationName} in ${batches.length} parallel batches (max ${maxConcurrent} concurrent)`);

    const results: T[] = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
      
      // Monitor memory after each batch
      await this.monitorMemoryUsage();
    }

    return results;
  }

  /**
   * Optimize database operations
   */
  getDatabaseOptimizations(): {
    disableIndexes: boolean;
    useBulkOperations: boolean;
    optimizeConnections: boolean;
    batchTransactions: boolean;
  } {
    if (!this.config.enableDatabaseOptimization) {
      return {
        disableIndexes: false,
        useBulkOperations: false,
        optimizeConnections: false,
        batchTransactions: false
      };
    }

    return {
      disableIndexes: true, // Temporarily disable non-essential indexes
      useBulkOperations: true, // Use bulk insert operations
      optimizeConnections: true, // Optimize connection pooling
      batchTransactions: true // Group operations in transactions
    };
  }

  /**
   * Create optimized data generation strategy
   */
  createGenerationStrategy(entityType: string, totalCount: number): {
    batchSize: number;
    useStreaming: boolean;
    enableCaching: boolean;
    parallelBatches: number;
  } {
    const entityBatchSizes = this.getEntityBatchSizes();
    const batchSize = entityBatchSizes[entityType] || 100;

    return {
      batchSize,
      useStreaming: totalCount > 1000, // Use streaming for large datasets
      enableCaching: totalCount > 500, // Enable caching for medium+ datasets
      parallelBatches: this.config.enableParallelProcessing ? 
        Math.min(4, Math.ceil(totalCount / batchSize)) : 1
    };
  }

  /**
   * Get performance monitoring configuration
   */
  getMonitoringConfig(): {
    enableRealTimeMonitoring: boolean;
    memoryCheckInterval: number;
    progressReportInterval: number;
  } {
    return {
      enableRealTimeMonitoring: true,
      memoryCheckInterval: 5000, // Check memory every 5 seconds
      progressReportInterval: 10000 // Report progress every 10 seconds
    };
  }

  /**
   * Apply runtime optimizations during seeding
   */
  async applyRuntimeOptimizations(): Promise<void> {
    logger.info(' Applying runtime performance optimizations...');

    // Set Node.js performance flags if not already set
    if (!process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
      logger.info(' Consider setting NODE_OPTIONS="--max-old-space-size=2048" for better memory management');
    }

    // Enable garbage collection if available
    if (global.gc) {
      logger.info('  Garbage collection available for memory optimization');
    } else {
      logger.info(' Consider running with --expose-gc flag for better memory management');
    }

    // Set process priority (if supported)
    try {
      if (process.platform !== 'win32') {
        // Use os.setPriority instead of process.setpriority
        const os = require('os');
        if (os.setPriority) {
          os.setPriority(process.pid, -10); // Higher priority
          logger.info(' Process priority increased for better performance');
        }
      }
    } catch (error) {
      // Ignore priority setting errors
    }
  }

  /**
   * Generate performance optimization report
   */
  generateOptimizationReport(): string {
    const report = `# Performance Optimization Configuration

## Enabled Optimizations

- **Batch Optimization**: ${this.config.enableBatchOptimization ? ' Enabled' : ' Disabled'}
- **Memory Optimization**: ${this.config.enableMemoryOptimization ? ' Enabled' : ' Disabled'}
- **Parallel Processing**: ${this.config.enableParallelProcessing ? ' Enabled' : ' Disabled'}
- **Database Optimization**: ${this.config.enableDatabaseOptimization ? ' Enabled' : ' Disabled'}

## Batch Sizes

${Object.entries(this.getEntityBatchSizes()).map(([entity, size]) => 
  `- **${entity}**: ${size} items per batch`
).join('\n')}

## Memory Thresholds

- **Max Heap Usage**: ${this.config.memoryThresholds?.maxHeapUsage || 400}MB
- **GC Trigger**: ${this.config.memoryThresholds?.gcTriggerThreshold || 300}MB

## Parallelism Configuration

- **Max Concurrent Operations**: ${this.config.parallelismConfig?.maxConcurrentOperations || 4}
- **Worker Threads**: ${this.config.parallelismConfig?.useWorkerThreads ? 'Enabled' : 'Disabled'}

## Database Optimizations

${Object.entries(this.getDatabaseOptimizations()).map(([key, enabled]) => 
  `- **${key.replace(/([A-Z])/g, ' $1').toLowerCase()}**: ${enabled ? 'Enabled' : 'Disabled'}`
).join('\n')}
`;

    return report;
  }
}
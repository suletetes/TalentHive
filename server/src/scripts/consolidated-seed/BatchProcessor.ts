import { logger } from '@/utils/logger';
import { SeedProgress } from './types';

/**
 * Batch operation result interface
 */
export interface BatchResult<T> {
  success: boolean;
  processedCount: number;
  totalCount: number;
  results: T[];
  errors: BatchError[];
  duration: number;
}

export interface BatchError {
  batchIndex: number;
  itemIndex: number;
  error: Error;
  item?: any;
}

/**
 * Batch processor configuration
 */
export interface BatchProcessorConfig {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
  progressCallback?: (progress: SeedProgress) => void;
}

/**
 * Efficient batch processor for database operations
 * Implements batch insertion, parallel processing, and error handling
 */
export class BatchProcessor {
  private config: BatchProcessorConfig;
  private defaultConfig: BatchProcessorConfig = {
    batchSize: 100,
    maxConcurrency: 3,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  constructor(config?: Partial<BatchProcessorConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Process items in batches with parallel execution
   */
  async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    operationName: string = 'batch operation'
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const totalCount = items.length;
    let processedCount = 0;
    const results: R[] = [];
    const errors: BatchError[] = [];

    if (totalCount === 0) {
      return {
        success: true,
        processedCount: 0,
        totalCount: 0,
        results: [],
        errors: [],
        duration: 0
      };
    }

    logger.info(` Starting ${operationName} for ${totalCount} items (batch size: ${this.config.batchSize})`);

    // Split items into batches
    const batches = this.createBatches(items, this.config.batchSize);
    const totalBatches = batches.length;

    // Process batches with controlled concurrency
    const batchPromises: Promise<void>[] = [];
    let activeBatches = 0;
    let batchIndex = 0;

    const processBatchWithRetry = async (batch: T[], index: number): Promise<void> => {
      let attempts = 0;
      let lastError: Error | null = null;

      while (attempts <= this.config.retryAttempts) {
        try {
          const batchResults = await processor(batch);
          results.push(...batchResults);
          processedCount += batch.length;

          // Report progress
          this.reportProgress(processedCount, totalCount, operationName);
          
          return; // Success, exit retry loop
        } catch (error) {
          attempts++;
          lastError = error as Error;
          
          if (attempts <= this.config.retryAttempts) {
            logger.warn(`Batch ${index + 1} failed (attempt ${attempts}), retrying in ${this.config.retryDelay}ms...`);
            await this.delay(this.config.retryDelay);
          }
        }
      }

      // All retry attempts failed
      logger.error(`Batch ${index + 1} failed after ${this.config.retryAttempts} attempts`);
      
      // Record errors for each item in the failed batch
      batch.forEach((item, itemIndex) => {
        errors.push({
          batchIndex: index,
          itemIndex,
          error: lastError || new Error('Unknown batch processing error'),
          item
        });
      });
    };

    // Process batches with concurrency control
    while (batchIndex < totalBatches || activeBatches > 0) {
      // Start new batches up to max concurrency
      while (activeBatches < this.config.maxConcurrency && batchIndex < totalBatches) {
        const batch = batches[batchIndex];
        const currentIndex = batchIndex;
        
        const batchPromise = processBatchWithRetry(batch, currentIndex)
          .finally(() => {
            activeBatches--;
          });
        
        batchPromises.push(batchPromise);
        activeBatches++;
        batchIndex++;
      }

      // Wait for at least one batch to complete
      if (activeBatches > 0) {
        await Promise.race(batchPromises.filter(p => p !== undefined));
      }
    }

    // Wait for all remaining batches to complete
    await Promise.all(batchPromises);

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    logger.info(` ${operationName} completed: ${processedCount}/${totalCount} items processed in ${duration}ms`);
    
    if (errors.length > 0) {
      logger.error(` ${errors.length} items failed during ${operationName}`);
    }

    return {
      success,
      processedCount,
      totalCount,
      results,
      errors,
      duration
    };
  }

  /**
   * Process items in parallel without batching (for independent operations)
   */
  async processParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    operationName: string = 'parallel operation'
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const totalCount = items.length;
    const results: R[] = [];
    const errors: BatchError[] = [];

    if (totalCount === 0) {
      return {
        success: true,
        processedCount: 0,
        totalCount: 0,
        results: [],
        errors: [],
        duration: 0
      };
    }

    logger.info(` Starting ${operationName} for ${totalCount} items (max concurrency: ${this.config.maxConcurrency})`);

    // Process items with controlled concurrency
    const semaphore = new Semaphore(this.config.maxConcurrency);
    let processedCount = 0;

    const processItemWithRetry = async (item: T, index: number): Promise<void> => {
      await semaphore.acquire();
      
      try {
        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts <= this.config.retryAttempts) {
          try {
            const result = await processor(item);
            results[index] = result; // Maintain order
            processedCount++;
            
            // Report progress
            this.reportProgress(processedCount, totalCount, operationName);
            
            return; // Success
          } catch (error) {
            attempts++;
            lastError = error as Error;
            
            if (attempts <= this.config.retryAttempts) {
              await this.delay(this.config.retryDelay);
            }
          }
        }

        // All attempts failed
        errors.push({
          batchIndex: 0,
          itemIndex: index,
          error: lastError || new Error('Unknown processing error'),
          item
        });
      } finally {
        semaphore.release();
      }
    };

    // Start all item processing
    const itemPromises = items.map((item, index) => processItemWithRetry(item, index));
    
    // Wait for all items to complete
    await Promise.all(itemPromises);

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    logger.info(` ${operationName} completed: ${processedCount}/${totalCount} items processed in ${duration}ms`);
    
    if (errors.length > 0) {
      logger.error(` ${errors.length} items failed during ${operationName}`);
    }

    return {
      success,
      processedCount,
      totalCount,
      results: results.filter(r => r !== undefined), // Remove undefined results from failed items
      errors,
      duration
    };
  }

  /**
   * Get optimal batch size based on entity type and system resources
   */
  getOptimalBatchSize(entityType: string): number {
    const batchSizes: Record<string, number> = {
      users: 50,        // Users have complex profiles
      projects: 75,     // Projects have moderate complexity
      proposals: 100,   // Proposals are relatively simple
      contracts: 50,    // Contracts have complex relationships
      reviews: 150,     // Reviews are simple text data
      organizations: 25, // Organizations have complex structures
      categories: 200,  // Categories are very simple
      skills: 300,      // Skills are very simple
      default: 100
    };

    return batchSizes[entityType] || batchSizes.default;
  }

  /**
   * Estimate processing time based on item count and complexity
   */
  estimateProcessingTime(itemCount: number, entityType: string): number {
    // Base processing time per item in milliseconds
    const baseTimePerItem: Record<string, number> = {
      users: 50,        // Complex user generation
      projects: 30,     // Moderate project generation
      proposals: 20,    // Simple proposal generation
      contracts: 40,    // Complex contract relationships
      reviews: 15,      // Simple review generation
      organizations: 60, // Complex organization setup
      categories: 5,    // Very simple
      skills: 3,        // Very simple
      default: 25
    };

    const timePerItem = baseTimePerItem[entityType] || baseTimePerItem.default;
    const batchSize = this.getOptimalBatchSize(entityType);
    const batchCount = Math.ceil(itemCount / batchSize);
    
    // Account for batch overhead and concurrency
    const batchOverhead = 100; // ms per batch
    const concurrencyFactor = Math.min(this.config.maxConcurrency, batchCount);
    
    return Math.ceil(
      (itemCount * timePerItem + batchCount * batchOverhead) / concurrencyFactor
    );
  }

  /**
   * Create batches from array of items
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Report processing progress
   */
  private reportProgress(processed: number, total: number, operationName: string): void {
    const percentage = Math.round((processed / total) * 100);
    
    if (this.config.progressCallback) {
      this.config.progressCallback({
        currentStep: operationName,
        completedSteps: processed,
        totalSteps: total,
        percentage,
        entitiesProcessed: processed
      });
    }

    // Log progress at 25% intervals
    if (percentage % 25 === 0 && processed > 0) {
      logger.info(` ${operationName}: ${processed}/${total} (${percentage}%) completed`);
    }
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update batch processor configuration
   */
  updateConfig(config: Partial<BatchProcessorConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info(' Batch processor configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): BatchProcessorConfig {
    return { ...this.config };
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

/**
 * Database-specific batch operations
 */
export class DatabaseBatchProcessor extends BatchProcessor {
  
  /**
   * Batch insert with transaction support
   */
  async batchInsert<T>(
    collection: string,
    documents: T[],
    insertFunction: (docs: T[]) => Promise<any[]>
  ): Promise<BatchResult<any>> {
    return this.processBatch(
      documents,
      async (batch) => {
        try {
          return await insertFunction(batch);
        } catch (error) {
          logger.error(`Batch insert failed for ${collection}:`, error);
          throw error;
        }
      },
      `${collection} batch insert`
    );
  }

  /**
   * Batch update operations
   */
  async batchUpdate<T>(
    collection: string,
    updates: Array<{ filter: any; update: any }>,
    updateFunction: (updates: Array<{ filter: any; update: any }>) => Promise<any[]>
  ): Promise<BatchResult<any>> {
    return this.processBatch(
      updates,
      async (batch) => {
        try {
          return await updateFunction(batch);
        } catch (error) {
          logger.error(`Batch update failed for ${collection}:`, error);
          throw error;
        }
      },
      `${collection} batch update`
    );
  }

  /**
   * Batch delete operations
   */
  async batchDelete(
    collection: string,
    filters: any[],
    deleteFunction: (filters: any[]) => Promise<any[]>
  ): Promise<BatchResult<any>> {
    return this.processBatch(
      filters,
      async (batch) => {
        try {
          return await deleteFunction(batch);
        } catch (error) {
          logger.error(`Batch delete failed for ${collection}:`, error);
          throw error;
        }
      },
      `${collection} batch delete`
    );
  }
}
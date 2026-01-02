import { logger } from '@/utils/logger';
import { SeedProgress } from './types';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  itemsProcessed: number;
  itemsPerSecond?: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThresholds {
  maxSeedingTime: number; // Maximum total seeding time in milliseconds
  maxMemoryUsage: number; // Maximum memory usage in MB
  minItemsPerSecond: number; // Minimum processing rate
  maxBatchTime: number; // Maximum time per batch in milliseconds
}

/**
 * Performance validation result
 */
export interface PerformanceValidationResult {
  isValid: boolean;
  violations: PerformanceViolation[];
  recommendations: string[];
  summary: PerformanceSummary;
}

export interface PerformanceViolation {
  metric: string;
  expected: number;
  actual: number;
  severity: 'warning' | 'error';
  description: string;
}

export interface PerformanceSummary {
  totalDuration: number;
  totalItemsProcessed: number;
  averageItemsPerSecond: number;
  peakMemoryUsage: number;
  operationCount: number;
}

/**
 * Monitors and validates seeding performance
 * Ensures seeding completes within acceptable time limits
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private thresholds: PerformanceThresholds;
  private progressCallbacks: ((progress: SeedProgress) => void)[] = [];
  private startTime: number = 0;
  private totalItemsProcessed: number = 0;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxSeedingTime: 120000, // 2 minutes default
      maxMemoryUsage: 512, // 512 MB default
      minItemsPerSecond: 10, // Minimum 10 items per second
      maxBatchTime: 30000, // 30 seconds per batch
      ...thresholds
    };
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operationName: string, expectedItems: number = 0): void {
    const startTime = Date.now();
    
    if (operationName === 'seeding') {
      this.startTime = startTime;
      this.totalItemsProcessed = 0;
    }

    const metrics: PerformanceMetrics = {
      operationName,
      startTime,
      itemsProcessed: 0,
      memoryUsage: this.getMemoryUsage()
    };

    this.metrics.set(operationName, metrics);
    
    logger.info(`  Started monitoring: ${operationName}${expectedItems > 0 ? ` (${expectedItems} items expected)` : ''}`);
  }

  /**
   * Update operation progress
   */
  updateProgress(operationName: string, itemsProcessed: number): void {
    const metrics = this.metrics.get(operationName);
    if (!metrics) {
      logger.warn(`No metrics found for operation: ${operationName}`);
      return;
    }

    metrics.itemsProcessed = itemsProcessed;
    this.totalItemsProcessed += itemsProcessed;

    // Calculate current performance
    const currentTime = Date.now();
    const duration = currentTime - metrics.startTime;
    const itemsPerSecond = duration > 0 ? (itemsProcessed / duration) * 1000 : 0;

    // Update memory usage
    metrics.memoryUsage = this.getMemoryUsage();

    // Report progress to callbacks
    this.reportProgress(operationName, itemsProcessed, duration, itemsPerSecond);

    // Check for performance violations during operation
    this.checkRealTimeViolations(operationName, metrics);
  }

  /**
   * End monitoring an operation
   */
  endOperation(operationName: string): PerformanceMetrics {
    const metrics = this.metrics.get(operationName);
    if (!metrics) {
      throw new Error(`No metrics found for operation: ${operationName}`);
    }

    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    const itemsPerSecond = duration > 0 ? (metrics.itemsProcessed / duration) * 1000 : 0;

    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.itemsPerSecond = itemsPerSecond;
    metrics.cpuUsage = this.getCpuUsage();
    metrics.memoryUsage = this.getMemoryUsage();

    logger.info(` Completed monitoring: ${operationName} (${duration}ms, ${metrics.itemsProcessed} items, ${itemsPerSecond.toFixed(2)} items/sec)`);

    return metrics;
  }

  /**
   * Validate overall performance against thresholds
   */
  validatePerformance(): PerformanceValidationResult {
    const violations: PerformanceViolation[] = [];
    const recommendations: string[] = [];
    
    const totalDuration = this.getTotalDuration();
    const summary = this.getPerformanceSummary();

    // Check total seeding time
    if (totalDuration > this.thresholds.maxSeedingTime) {
      violations.push({
        metric: 'Total Seeding Time',
        expected: this.thresholds.maxSeedingTime,
        actual: totalDuration,
        severity: 'error',
        description: `Seeding took ${totalDuration}ms, exceeding limit of ${this.thresholds.maxSeedingTime}ms`
      });
      recommendations.push('Consider increasing batch sizes or reducing data volume');
    }

    // Check memory usage
    if (summary.peakMemoryUsage > this.thresholds.maxMemoryUsage) {
      violations.push({
        metric: 'Peak Memory Usage',
        expected: this.thresholds.maxMemoryUsage,
        actual: summary.peakMemoryUsage,
        severity: 'warning',
        description: `Peak memory usage ${summary.peakMemoryUsage}MB exceeded limit of ${this.thresholds.maxMemoryUsage}MB`
      });
      recommendations.push('Consider reducing batch sizes or implementing streaming generation');
    }

    // Check processing rate
    if (summary.averageItemsPerSecond < this.thresholds.minItemsPerSecond) {
      violations.push({
        metric: 'Processing Rate',
        expected: this.thresholds.minItemsPerSecond,
        actual: summary.averageItemsPerSecond,
        severity: 'warning',
        description: `Average processing rate ${summary.averageItemsPerSecond.toFixed(2)} items/sec below minimum of ${this.thresholds.minItemsPerSecond} items/sec`
      });
      recommendations.push('Consider optimizing data generation logic or increasing parallelism');
    }

    // Check individual operation performance
    for (const [operationName, metrics] of this.metrics) {
      if (metrics.duration && metrics.duration > this.thresholds.maxBatchTime) {
        violations.push({
          metric: `${operationName} Duration`,
          expected: this.thresholds.maxBatchTime,
          actual: metrics.duration,
          severity: 'warning',
          description: `Operation ${operationName} took ${metrics.duration}ms, exceeding batch limit of ${this.thresholds.maxBatchTime}ms`
        });
      }
    }

    const isValid = violations.filter(v => v.severity === 'error').length === 0;

    return {
      isValid,
      violations,
      recommendations,
      summary
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const totalDuration = this.getTotalDuration();
    let peakMemoryUsage = 0;
    let totalItems = 0;

    for (const metrics of this.metrics.values()) {
      totalItems += metrics.itemsProcessed;
      const memoryMB = metrics.memoryUsage.heapUsed / (1024 * 1024);
      if (memoryMB > peakMemoryUsage) {
        peakMemoryUsage = memoryMB;
      }
    }

    const averageItemsPerSecond = totalDuration > 0 ? (totalItems / totalDuration) * 1000 : 0;

    return {
      totalDuration,
      totalItemsProcessed: totalItems,
      averageItemsPerSecond,
      peakMemoryUsage,
      operationCount: this.metrics.size
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const validation = this.validatePerformance();
    
    let report = `
# Database Seeding Performance Report

## Summary
- **Total Duration**: ${summary.totalDuration}ms (${(summary.totalDuration / 1000).toFixed(2)}s)
- **Items Processed**: ${summary.totalItemsProcessed}
- **Average Rate**: ${summary.averageItemsPerSecond.toFixed(2)} items/sec
- **Peak Memory**: ${summary.peakMemoryUsage.toFixed(2)} MB
- **Operations**: ${summary.operationCount}

## Performance Status: ${validation.isValid ? ' PASSED' : ' FAILED'}

`;

    // Add operation details
    report += `## Operation Details\n\n`;
    for (const [name, metrics] of this.metrics) {
      const duration = metrics.duration || 0;
      const rate = metrics.itemsPerSecond || 0;
      const memoryMB = metrics.memoryUsage.heapUsed / (1024 * 1024);
      
      report += `### ${name}\n`;
      report += `- Duration: ${duration}ms\n`;
      report += `- Items: ${metrics.itemsProcessed}\n`;
      report += `- Rate: ${rate.toFixed(2)} items/sec\n`;
      report += `- Memory: ${memoryMB.toFixed(2)} MB\n\n`;
    }

    // Add violations
    if (validation.violations.length > 0) {
      report += `## Performance Violations\n\n`;
      for (const violation of validation.violations) {
        const icon = violation.severity === 'error' ? '' : '';
        report += `${icon} **${violation.metric}**: ${violation.description}\n`;
        report += `   Expected: ${violation.expected}, Actual: ${violation.actual}\n\n`;
      }
    }

    // Add recommendations
    if (validation.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      for (const recommendation of validation.recommendations) {
        report += `- ${recommendation}\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Add progress callback
   */
  addProgressCallback(callback: (progress: SeedProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(callback: (progress: SeedProgress) => void): void {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.startTime = 0;
    this.totalItemsProcessed = 0;
    logger.info(' Performance monitor reset');
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }

  /**
   * Get CPU usage (simplified)
   */
  private getCpuUsage(): PerformanceMetrics['cpuUsage'] {
    const usage = process.cpuUsage();
    return {
      user: usage.user,
      system: usage.system
    };
  }

  /**
   * Get total duration from start to now
   */
  private getTotalDuration(): number {
    if (this.startTime === 0) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Report progress to callbacks
   */
  private reportProgress(operationName: string, itemsProcessed: number, duration: number, itemsPerSecond: number): void {
    const progress: SeedProgress = {
      currentStep: operationName,
      completedSteps: itemsProcessed,
      totalSteps: itemsProcessed, // Will be updated by caller with actual total
      percentage: 0, // Will be calculated by caller
      entitiesProcessed: this.totalItemsProcessed,
      estimatedTimeRemaining: itemsPerSecond > 0 ? undefined : undefined
    };

    for (const callback of this.progressCallbacks) {
      try {
        callback(progress);
      } catch (error) {
        logger.warn('Progress callback error:', error);
      }
    }
  }

  /**
   * Check for real-time performance violations
   */
  private checkRealTimeViolations(operationName: string, metrics: PerformanceMetrics): void {
    const currentTime = Date.now();
    const duration = currentTime - metrics.startTime;
    const memoryMB = metrics.memoryUsage.heapUsed / (1024 * 1024);

    // Check if operation is taking too long
    if (duration > this.thresholds.maxBatchTime) {
      logger.warn(`  Operation ${operationName} has been running for ${duration}ms (limit: ${this.thresholds.maxBatchTime}ms)`);
    }

    // Check memory usage
    if (memoryMB > this.thresholds.maxMemoryUsage) {
      logger.warn(`  Memory usage ${memoryMB.toFixed(2)}MB exceeds limit of ${this.thresholds.maxMemoryUsage}MB`);
    }

    // Check processing rate
    if (duration > 5000 && metrics.itemsProcessed > 0) { // Only check after 5 seconds
      const currentRate = (metrics.itemsProcessed / duration) * 1000;
      if (currentRate < this.thresholds.minItemsPerSecond) {
        logger.warn(`  Processing rate ${currentRate.toFixed(2)} items/sec below minimum of ${this.thresholds.minItemsPerSecond} items/sec`);
      }
    }
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logger.info(' Performance thresholds updated');
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}
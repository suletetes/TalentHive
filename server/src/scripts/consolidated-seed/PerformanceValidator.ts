import { logger } from '@/utils/logger';
import { SeedManager } from './SeedManager';
import { ConfigurationManager } from './ConfigurationManager';
import { PerformanceMonitor, PerformanceValidationResult, PerformanceThresholds } from './PerformanceMonitor';
import { SeedConfiguration, Environment } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Performance test configuration
 */
export interface PerformanceTestConfig {
  testName: string;
  environment: Environment;
  userCounts: {
    admins: number;
    clients: number;
    freelancers: number;
  };
  projectCounts: {
    draft: number;
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  expectedDuration: number; // Maximum expected duration in milliseconds
  expectedMemoryUsage: number; // Maximum expected memory usage in MB
}

/**
 * Performance test result
 */
export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  actualDuration: number;
  actualMemoryUsage: number;
  itemsProcessed: number;
  itemsPerSecond: number;
  violations: string[];
  recommendations: string[];
  detailedMetrics: any;
}

/**
 * Performance optimization report
 */
export interface OptimizationReport {
  currentPerformance: PerformanceTestResult;
  optimizations: OptimizationRecommendation[];
  estimatedImprovement: {
    timeReduction: number; // Percentage
    memoryReduction: number; // Percentage
  };
  implementationPriority: 'high' | 'medium' | 'low';
}

export interface OptimizationRecommendation {
  category: 'batch_size' | 'memory' | 'database' | 'parallelism' | 'data_generation';
  description: string;
  expectedImprovement: string;
  implementationEffort: 'low' | 'medium' | 'high';
  codeChanges: string[];
}

/**
 * Validates and optimizes seeding performance
 * Ensures seeding meets the 2-minute requirement from Requirements 6.4
 */
export class PerformanceValidator {
  private performanceMonitor: PerformanceMonitor;
  private seedManager: SeedManager;
  private configManager: ConfigurationManager;

  constructor() {
    // Set performance thresholds based on requirements
    const thresholds: PerformanceThresholds = {
      maxSeedingTime: 120000, // 2 minutes (Requirement 6.4)
      maxMemoryUsage: 512, // 512 MB reasonable limit
      minItemsPerSecond: 10, // Minimum processing rate
      maxBatchTime: 30000 // 30 seconds per batch operation
    };

    this.performanceMonitor = new PerformanceMonitor(thresholds);
    this.seedManager = new SeedManager();
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Run comprehensive performance validation tests
   */
  async runPerformanceValidation(): Promise<PerformanceTestResult[]> {
    logger.info(' Starting comprehensive performance validation...');

    const testConfigs: PerformanceTestConfig[] = [
      {
        testName: 'Small Dataset Test',
        environment: 'testing',
        userCounts: { admins: 1, clients: 10, freelancers: 20 },
        projectCounts: { draft: 2, open: 5, inProgress: 3, completed: 8, cancelled: 1 },
        expectedDuration: 30000, // 30 seconds
        expectedMemoryUsage: 128 // 128 MB
      },
      {
        testName: 'Medium Dataset Test',
        environment: 'development',
        userCounts: { admins: 3, clients: 25, freelancers: 50 },
        projectCounts: { draft: 5, open: 15, inProgress: 10, completed: 20, cancelled: 3 },
        expectedDuration: 60000, // 1 minute
        expectedMemoryUsage: 256 // 256 MB
      },
      {
        testName: 'Large Dataset Test (Requirement 6.4)',
        environment: 'development',
        userCounts: { admins: 5, clients: 50, freelancers: 100 },
        projectCounts: { draft: 10, open: 30, inProgress: 20, completed: 40, cancelled: 5 },
        expectedDuration: 120000, // 2 minutes (requirement threshold)
        expectedMemoryUsage: 512 // 512 MB
      }
    ];

    const results: PerformanceTestResult[] = [];

    for (const testConfig of testConfigs) {
      logger.info(` Running performance test: ${testConfig.testName}`);
      const result = await this.runSinglePerformanceTest(testConfig);
      results.push(result);

      // Log immediate results
      if (result.passed) {
        logger.info(` ${testConfig.testName} PASSED (${result.actualDuration}ms, ${result.actualMemoryUsage.toFixed(2)}MB)`);
      } else {
        logger.warn(` ${testConfig.testName} FAILED (${result.actualDuration}ms, ${result.actualMemoryUsage.toFixed(2)}MB)`);
        result.violations.forEach(violation => logger.warn(`   - ${violation}`));
      }
    }

    return results;
  }

  /**
   * Run a single performance test
   */
  private async runSinglePerformanceTest(testConfig: PerformanceTestConfig): Promise<PerformanceTestResult> {
    // Create test configuration
    const seedConfig: SeedConfiguration = {
      environment: testConfig.environment,
      userCounts: testConfig.userCounts,
      projectCounts: testConfig.projectCounts,
      enableModules: ['foundation', 'users', 'projects', 'interactions'],
      batchSize: 100,
      skipExisting: false
    };

    // Reset performance monitor
    this.performanceMonitor.reset();

    // Update thresholds for this specific test
    this.performanceMonitor.updateThresholds({
      maxSeedingTime: testConfig.expectedDuration,
      maxMemoryUsage: testConfig.expectedMemoryUsage
    });

    const startTime = Date.now();
    let seedResult;
    let error: Error | null = null;

    try {
      // Start monitoring
      this.performanceMonitor.startOperation('seeding');

      // Execute seeding
      seedResult = await this.seedManager.execute(seedConfig);

      // End monitoring
      this.performanceMonitor.endOperation('seeding');
    } catch (err) {
      error = err as Error;
      logger.error(`Performance test failed: ${error.message}`);
    }

    const actualDuration = Date.now() - startTime;

    // Get performance validation
    const validation = this.performanceMonitor.validatePerformance();
    const summary = this.performanceMonitor.getPerformanceSummary();

    // Calculate total items processed
    const totalItems = seedResult ? 
      seedResult.summary.users + seedResult.summary.projects + 
      seedResult.summary.proposals + seedResult.summary.contracts + 
      seedResult.summary.reviews : 0;

    const itemsPerSecond = actualDuration > 0 ? (totalItems / actualDuration) * 1000 : 0;

    // Determine if test passed
    const passed = validation.isValid && !error && seedResult?.success === true;

    // Collect violations
    const violations: string[] = [];
    if (error) {
      violations.push(`Execution error: ${error.message}`);
    }
    if (!seedResult?.success) {
      violations.push('Seeding process failed');
    }
    validation.violations.forEach(v => {
      violations.push(`${v.metric}: ${v.description}`);
    });

    return {
      testName: testConfig.testName,
      passed,
      actualDuration,
      actualMemoryUsage: summary.peakMemoryUsage,
      itemsProcessed: totalItems,
      itemsPerSecond,
      violations,
      recommendations: validation.recommendations,
      detailedMetrics: {
        validation,
        summary,
        seedResult
      }
    };
  }

  /**
   * Analyze performance bottlenecks and generate optimization recommendations
   */
  async analyzePerformanceBottlenecks(testResults: PerformanceTestResult[]): Promise<OptimizationReport> {
    logger.info(' Analyzing performance bottlenecks...');

    // Use the largest dataset test for analysis
    const largeDatasetTest = testResults.find(r => r.testName.includes('Large Dataset')) || testResults[testResults.length - 1];

    const optimizations: OptimizationRecommendation[] = [];

    // Analyze duration performance
    if (largeDatasetTest.actualDuration > 90000) { // More than 1.5 minutes
      optimizations.push({
        category: 'batch_size',
        description: 'Increase batch size for database operations to reduce transaction overhead',
        expectedImprovement: '15-25% faster execution',
        implementationEffort: 'low',
        codeChanges: [
          'Increase default batch size from 100 to 500 in SeedConfiguration',
          'Implement dynamic batch sizing based on available memory',
          'Add batch size optimization for different entity types'
        ]
      });
    }

    // Analyze memory usage
    if (largeDatasetTest.actualMemoryUsage > 400) { // More than 400MB
      optimizations.push({
        category: 'memory',
        description: 'Implement streaming data generation to reduce memory footprint',
        expectedImprovement: '30-40% memory reduction',
        implementationEffort: 'medium',
        codeChanges: [
          'Implement streaming generators that process data in chunks',
          'Add explicit garbage collection after each major operation',
          'Use WeakMap for temporary data storage'
        ]
      });
    }

    // Analyze processing rate
    if (largeDatasetTest.itemsPerSecond < 15) {
      optimizations.push({
        category: 'parallelism',
        description: 'Implement parallel data generation for independent entities',
        expectedImprovement: '20-35% faster processing',
        implementationEffort: 'medium',
        codeChanges: [
          'Use Promise.all for parallel user and project generation',
          'Implement worker threads for CPU-intensive data generation',
          'Add parallel batch processing for database operations'
        ]
      });
    }

    // Database optimization recommendations
    if (largeDatasetTest.violations.some(v => v.includes('batch') || v.includes('database'))) {
      optimizations.push({
        category: 'database',
        description: 'Optimize database operations and indexing strategy',
        expectedImprovement: '10-20% faster database operations',
        implementationEffort: 'low',
        codeChanges: [
          'Temporarily disable non-essential indexes during bulk inserts',
          'Use bulk insert operations instead of individual inserts',
          'Implement connection pooling optimization'
        ]
      });
    }

    // Data generation optimization
    if (largeDatasetTest.itemsPerSecond < 20) {
      optimizations.push({
        category: 'data_generation',
        description: 'Optimize data generation algorithms and reduce complexity',
        expectedImprovement: '15-25% faster data generation',
        implementationEffort: 'medium',
        codeChanges: [
          'Cache frequently used data patterns and templates',
          'Pre-generate common data combinations',
          'Optimize slug generation with better conflict resolution'
        ]
      });
    }

    // Calculate estimated improvements
    const timeReduction = optimizations.reduce((acc, opt) => {
      const improvement = parseFloat(opt.expectedImprovement.match(/(\d+)/)?.[1] || '0');
      return acc + improvement;
    }, 0) / optimizations.length;

    const memoryReduction = optimizations
      .filter(opt => opt.category === 'memory')
      .reduce((acc, opt) => {
        const improvement = parseFloat(opt.expectedImprovement.match(/(\d+)/)?.[1] || '0');
        return acc + improvement;
      }, 0);

    // Determine implementation priority
    let implementationPriority: 'high' | 'medium' | 'low' = 'low';
    if (largeDatasetTest.actualDuration > 120000) { // Exceeds requirement
      implementationPriority = 'high';
    } else if (largeDatasetTest.actualDuration > 90000) { // Close to requirement
      implementationPriority = 'medium';
    }

    return {
      currentPerformance: largeDatasetTest,
      optimizations,
      estimatedImprovement: {
        timeReduction: Math.min(timeReduction, 50), // Cap at 50%
        memoryReduction: Math.min(memoryReduction, 50)
      },
      implementationPriority
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(testResults: PerformanceTestResult[], optimizationReport: OptimizationReport): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `# Database Seeding Performance Validation Report

Generated: ${timestamp}

## Executive Summary

This report validates the database seeding system performance against Requirements 6.4:
"THE Seeding_System SHALL complete full database seeding in under 2 minutes"

`;

    // Test Results Summary
    report += `## Test Results Summary

| Test Name | Status | Duration | Memory | Items/sec | Items |
|-----------|--------|----------|--------|-----------|-------|
`;

    for (const result of testResults) {
      const status = result.passed ? ' PASS' : ' FAIL';
      const duration = `${(result.actualDuration / 1000).toFixed(1)}s`;
      const memory = `${result.actualMemoryUsage.toFixed(1)}MB`;
      const rate = result.itemsPerSecond.toFixed(1);
      
      report += `| ${result.testName} | ${status} | ${duration} | ${memory} | ${rate} | ${result.itemsProcessed} |\n`;
    }

    // Requirement Compliance
    const largeDatasetTest = testResults.find(r => r.testName.includes('Large Dataset'));
    const requirementMet = largeDatasetTest ? largeDatasetTest.actualDuration <= 120000 : false;

    report += `\n## Requirement 6.4 Compliance

**Status**: ${requirementMet ? ' COMPLIANT' : ' NON-COMPLIANT'}

`;

    if (largeDatasetTest) {
      report += `- **Actual Duration**: ${(largeDatasetTest.actualDuration / 1000).toFixed(1)} seconds
- **Requirement Limit**: 120 seconds
- **Margin**: ${requirementMet ? 
        `${((120000 - largeDatasetTest.actualDuration) / 1000).toFixed(1)} seconds under limit` :
        `${((largeDatasetTest.actualDuration - 120000) / 1000).toFixed(1)} seconds over limit`}

`;
    }

    // Performance Issues
    const failedTests = testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      report += `## Performance Issues

`;
      for (const test of failedTests) {
        report += `### ${test.testName}

**Violations:**
`;
        for (const violation of test.violations) {
          report += `- ${violation}\n`;
        }

        if (test.recommendations.length > 0) {
          report += `\n**Recommendations:**
`;
          for (const rec of test.recommendations) {
            report += `- ${rec}\n`;
          }
        }
        report += '\n';
      }
    }

    // Optimization Recommendations
    if (optimizationReport.optimizations.length > 0) {
      report += `## Optimization Recommendations

**Implementation Priority**: ${optimizationReport.implementationPriority.toUpperCase()}

**Estimated Improvements:**
- Time Reduction: ${optimizationReport.estimatedImprovement.timeReduction.toFixed(1)}%
- Memory Reduction: ${optimizationReport.estimatedImprovement.memoryReduction.toFixed(1)}%

`;

      for (const opt of optimizationReport.optimizations) {
        report += `### ${opt.category.replace('_', ' ').toUpperCase()} Optimization

**Description**: ${opt.description}
**Expected Improvement**: ${opt.expectedImprovement}
**Implementation Effort**: ${opt.implementationEffort.toUpperCase()}

**Code Changes:**
`;
        for (const change of opt.codeChanges) {
          report += `- ${change}\n`;
        }
        report += '\n';
      }
    }

    // Detailed Metrics
    report += `## Detailed Performance Metrics

`;
    for (const result of testResults) {
      report += `### ${result.testName}

- **Duration**: ${result.actualDuration}ms
- **Memory Usage**: ${result.actualMemoryUsage.toFixed(2)}MB
- **Items Processed**: ${result.itemsProcessed}
- **Processing Rate**: ${result.itemsPerSecond.toFixed(2)} items/second
- **Status**: ${result.passed ? 'PASSED' : 'FAILED'}

`;
    }

    return report;
  }

  /**
   * Export performance report to file
   */
  async exportPerformanceReport(report: string, outputPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputPath || `performance-report-${timestamp}.md`;
    const fullPath = path.resolve(filename);

    await fs.writeFile(fullPath, report, 'utf8');
    logger.info(` Performance report exported to: ${fullPath}`);

    return fullPath;
  }

  /**
   * Run performance validation and generate report
   */
  async validateAndOptimize(exportReport: boolean = true): Promise<{
    testResults: PerformanceTestResult[];
    optimizationReport: OptimizationReport;
    reportPath?: string;
  }> {
    logger.info(' Starting comprehensive performance validation and optimization analysis...');

    // Run performance tests
    const testResults = await this.runPerformanceValidation();

    // Analyze bottlenecks
    const optimizationReport = await this.analyzePerformanceBottlenecks(testResults);

    // Generate report
    const report = await this.generatePerformanceReport(testResults, optimizationReport);

    let reportPath: string | undefined;
    if (exportReport) {
      reportPath = await this.exportPerformanceReport(report);
    }

    // Log summary
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const requirementMet = testResults.some(r => 
      r.testName.includes('Large Dataset') && r.actualDuration <= 120000
    );

    logger.info(` Performance Validation Summary:`);
    logger.info(`   Tests Passed: ${passedTests}/${totalTests}`);
    logger.info(`   Requirement 6.4: ${requirementMet ? ' MET' : ' NOT MET'}`);
    logger.info(`   Optimizations Available: ${optimizationReport.optimizations.length}`);
    logger.info(`   Priority: ${optimizationReport.implementationPriority.toUpperCase()}`);

    return {
      testResults,
      optimizationReport,
      reportPath
    };
  }
}
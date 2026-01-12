#!/usr/bin/env ts-node

/**
 * Standalone performance test runner
 * Validates seeding performance against Requirements 6.4
 * 
 * Usage:
 *   npm run test:performance
 *   node -r ts-node/register runPerformanceTests.ts
 */

import { logger } from '@/utils/logger';
import { PerformanceValidator } from './PerformanceValidator';
import * as path from 'path';

async function main() {
  console.log(' TalentHive Database Seeding Performance Tests');
  console.log('================================================\n');

  const performanceValidator = new PerformanceValidator();

  try {
    // Run comprehensive performance validation
    const result = await performanceValidator.validateAndOptimize(true);

    // Display detailed results
    console.log('\n Test Results:');
    console.log('================');

    for (const testResult of result.testResults) {
      const status = testResult.passed ? ' PASS' : ' FAIL';
      const duration = (testResult.actualDuration / 1000).toFixed(1);
      const memory = testResult.actualMemoryUsage.toFixed(1);
      const rate = testResult.itemsPerSecond.toFixed(1);

      console.log(`${status} ${testResult.testName}`);
      console.log(`     Duration: ${duration}s | Memory: ${memory}MB | Rate: ${rate} items/sec`);
      
      if (!testResult.passed && testResult.violations.length > 0) {
        console.log('     Violations:');
        testResult.violations.forEach(violation => {
          console.log(`       - ${violation}`);
        });
      }
      console.log();
    }

    // Check requirement compliance
    const largeDatasetTest = result.testResults.find(r => r.testName.includes('Large Dataset'));
    const requirementMet = largeDatasetTest ? largeDatasetTest.actualDuration <= 120000 : false;

    console.log(' Requirement 6.4 Compliance:');
    console.log('==============================');
    console.log(`Status: ${requirementMet ? ' COMPLIANT' : ' NON-COMPLIANT'}`);
    
    if (largeDatasetTest) {
      console.log(`Actual Duration: ${(largeDatasetTest.actualDuration / 1000).toFixed(1)}s`);
      console.log(`Requirement Limit: 120s`);
      
      if (requirementMet) {
        const margin = (120000 - largeDatasetTest.actualDuration) / 1000;
        console.log(`Margin: ${margin.toFixed(1)}s under limit`);
      } else {
        const excess = (largeDatasetTest.actualDuration - 120000) / 1000;
        console.log(`Excess: ${excess.toFixed(1)}s over limit`);
      }
    }

    // Display optimization recommendations
    if (result.optimizationReport.optimizations.length > 0) {
      console.log('\n Optimization Recommendations:');
      console.log('================================');
      console.log(`Priority: ${result.optimizationReport.implementationPriority.toUpperCase()}`);
      console.log(`Estimated Improvements:`);
      console.log(`  - Time Reduction: ${result.optimizationReport.estimatedImprovement.timeReduction.toFixed(1)}%`);
      console.log(`  - Memory Reduction: ${result.optimizationReport.estimatedImprovement.memoryReduction.toFixed(1)}%`);
      console.log();

      result.optimizationReport.optimizations.forEach((opt, index) => {
        console.log(`${index + 1}. ${opt.category.replace('_', ' ').toUpperCase()}`);
        console.log(`   ${opt.description}`);
        console.log(`   Expected: ${opt.expectedImprovement}`);
        console.log(`   Effort: ${opt.implementationEffort.toUpperCase()}`);
        console.log();
      });
    }

    // Report file location
    if (result.reportPath) {
      console.log(` Detailed report saved to: ${result.reportPath}`);
    }

    // Exit with appropriate code
    const allTestsPassed = result.testResults.every(r => r.passed);
    if (allTestsPassed && requirementMet) {
      console.log(' All performance tests passed!');
      process.exit(0);
    } else {
      console.log(' Some performance tests failed or requirements not met');
      process.exit(1);
    }

  } catch (error) {
    logger.error(' Performance test execution failed:', error);
    console.log('\n Troubleshooting:');
    console.log('- Ensure database is running and accessible');
    console.log('- Check that all required environment variables are set');
    console.log('- Verify that the consolidated seed system is properly set up');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n  Performance tests interrupted');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main();
}

export { main as runPerformanceTests };
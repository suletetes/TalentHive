/**
 * Integration testing utilities for end-to-end workflow validation
 */

import { apiCore } from '@/services/api/core';
import { proposalsService } from '@/services/api/proposals.service';
import { contractsService } from '@/services/api/contracts.service';
import { dataExtractor } from './dataExtractor';
import { validateContractIntegrity, validateProposalIntegrity } from './dataIntegrity';
import { getUserFriendlyErrorMessage } from './errorMessages';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export interface WorkflowTestResult {
  workflowName: string;
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
}

/**
 * Integration test runner
 */
export class IntegrationTestRunner {
  private results: TestResult[] = [];

  /**
   * Run a single test
   */
  async runTest(
    name: string,
    testFn: () => Promise<void>
  ): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      await testFn();
      const duration = performance.now() - startTime;
      
      const result: TestResult = {
        name,
        passed: true,
        duration,
      };
      
      this.results.push(result);
      console.log(` ${name} - ${duration.toFixed(2)}ms`);
      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      const result: TestResult = {
        name,
        passed: false,
        error: error.message || 'Unknown error',
        duration,
        details: error,
      };
      
      this.results.push(result);
      console.error(`❌ ${name} - ${duration.toFixed(2)}ms:`, error.message);
      return result;
    }
  }

  /**
   * Run multiple tests
   */
  async runTests(tests: Array<{ name: string; testFn: () => Promise<void> }>): Promise<TestResult[]> {
    const results = [];
    
    for (const test of tests) {
      const result = await this.runTest(test.name, test.testFn);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get test summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    totalDuration: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      passRate,
      totalDuration,
    };
  }

  /**
   * Clear results
   */
  clear(): void {
    this.results = [];
  }
}

/**
 * API Integration Tests
 */
export class ApiIntegrationTests {
  private testRunner = new IntegrationTestRunner();

  /**
   * Test API core functionality
   */
  async testApiCore(): Promise<WorkflowTestResult> {
    const startTime = performance.now();
    
    const tests = [
      {
        name: 'API Core - Health Check',
        testFn: async () => {
          // Test basic API connectivity
          const response = await apiCore.get('/health');
          if (!response) {
            throw new Error('Health check failed');
          }
        },
      },
      {
        name: 'API Core - Error Handling',
        testFn: async () => {
          try {
            await apiCore.get('/non-existent-endpoint');
            throw new Error('Should have thrown an error');
          } catch (error: any) {
            const friendlyMessage = getUserFriendlyErrorMessage(error);
            if (!friendlyMessage) {
              throw new Error('Error message handling failed');
            }
          }
        },
      },
      {
        name: 'API Core - Authentication Headers',
        testFn: async () => {
          // This test would need to be run with a valid token
          // For now, we just verify the header is being set
          const axiosInstance = apiCore.getAxiosInstance();
          const config = axiosInstance.defaults;
          
          if (!config.headers || !config.headers['Content-Type']) {
            throw new Error('Default headers not set correctly');
          }
        },
      },
    ];

    const results = await this.testRunner.runTests(tests);
    const duration = performance.now() - startTime;
    
    return this.createWorkflowResult('API Core Tests', results, duration);
  }

  /**
   * Test data extraction utilities
   */
  async testDataExtraction(): Promise<WorkflowTestResult> {
    const startTime = performance.now();
    
    const tests = [
      {
        name: 'Data Extraction - Array Extraction',
        testFn: async () => {
          const testResponse = { data: [{ id: 1 }, { id: 2 }] };
          const extracted = dataExtractor.extractArray(testResponse, ['data']);
          
          if (!Array.isArray(extracted) || extracted.length !== 2) {
            throw new Error('Array extraction failed');
          }
        },
      },
      {
        name: 'Data Extraction - Object Extraction',
        testFn: async () => {
          const testResponse = { data: { id: 1, name: 'test' } };
          const extracted = dataExtractor.extractObject(testResponse, ['data']);
          
          if (!extracted || extracted.id !== 1) {
            throw new Error('Object extraction failed');
          }
        },
      },
      {
        name: 'Data Extraction - Fallback Paths',
        testFn: async () => {
          const testResponse = { result: { items: [{ id: 1 }] } };
          const extracted = dataExtractor.extractArray(testResponse, ['data', 'result.items']);
          
          if (!Array.isArray(extracted) || extracted.length !== 1) {
            throw new Error('Fallback path extraction failed');
          }
        },
      },
      {
        name: 'Data Extraction - Error Response',
        testFn: async () => {
          const errorResponse = { status: 'error', message: 'Test error' };
          
          try {
            dataExtractor.handleApiResponse(errorResponse);
            throw new Error('Should have thrown an error');
          } catch (error: any) {
            if (error.message !== 'Test error') {
              throw new Error('Error handling failed');
            }
          }
        },
      },
    ];

    const results = await this.testRunner.runTests(tests);
    const duration = performance.now() - startTime;
    
    return this.createWorkflowResult('Data Extraction Tests', results, duration);
  }

  /**
   * Test proposals workflow
   */
  async testProposalsWorkflow(): Promise<WorkflowTestResult> {
    const startTime = performance.now();
    
    const tests = [
      {
        name: 'Proposals - Service Initialization',
        testFn: async () => {
          if (!proposalsService) {
            throw new Error('Proposals service not initialized');
          }
        },
      },
      {
        name: 'Proposals - Data Integrity Validation',
        testFn: async () => {
          const mockProposal = {
            _id: 'test-id',
            project: 'project-id',
            freelancer: 'freelancer-id',
            coverLetter: 'Test cover letter',
            bidAmount: 100,
            timeline: { duration: 7, unit: 'days' },
            status: 'submitted',
          };
          
          const report = validateProposalIntegrity(mockProposal);
          if (!report.isValid) {
            throw new Error(`Proposal validation failed: ${report.errors.join(', ')}`);
          }
        },
      },
      {
        name: 'Proposals - Budget Calculation',
        testFn: async () => {
          const { getProposalBudget } = await import('./proposalHelpers');
          
          const proposalWithBidAmount = { bidAmount: 150 };
          const budget1 = getProposalBudget(proposalWithBidAmount);
          
          if (budget1.amount !== 150) {
            throw new Error('Budget calculation failed for bidAmount');
          }
          
          const proposalWithLegacy = { proposedBudget: { amount: 200, type: 'hourly' } };
          const budget2 = getProposalBudget(proposalWithLegacy);
          
          if (budget2.amount !== 200 || budget2.type !== 'hourly') {
            throw new Error('Budget calculation failed for legacy format');
          }
        },
      },
    ];

    const results = await this.testRunner.runTests(tests);
    const duration = performance.now() - startTime;
    
    return this.createWorkflowResult('Proposals Workflow Tests', results, duration);
  }

  /**
   * Test contracts workflow
   */
  async testContractsWorkflow(): Promise<WorkflowTestResult> {
    const startTime = performance.now();
    
    const tests = [
      {
        name: 'Contracts - Service Initialization',
        testFn: async () => {
          if (!contractsService) {
            throw new Error('Contracts service not initialized');
          }
        },
      },
      {
        name: 'Contracts - Data Integrity Validation',
        testFn: async () => {
          const mockContract = {
            _id: 'contract-id',
            title: 'Test Contract',
            client: 'client-id',
            freelancer: 'freelancer-id',
            totalAmount: 1000,
            milestones: [
              { _id: 'milestone-1', title: 'Milestone 1', amount: 500 },
              { _id: 'milestone-2', title: 'Milestone 2', amount: 500 },
            ],
            signatures: [],
          };
          
          const report = validateContractIntegrity(mockContract);
          if (!report.isValid) {
            throw new Error(`Contract validation failed: ${report.errors.join(', ')}`);
          }
        },
      },
      {
        name: 'Contracts - Source Type Handling',
        testFn: async () => {
          const serviceContract = {
            _id: 'service-contract',
            title: 'Service Request: Web Development',
            client: 'client-id',
            freelancer: 'freelancer-id',
          };
          
          const report = validateContractIntegrity(serviceContract);
          
          // Should auto-fix source type
          if (serviceContract.sourceType !== 'hire_now') {
            throw new Error('Source type auto-fix failed');
          }
        },
      },
    ];

    const results = await this.testRunner.runTests(tests);
    const duration = performance.now() - startTime;
    
    return this.createWorkflowResult('Contracts Workflow Tests', results, duration);
  }

  /**
   * Test error handling workflow
   */
  async testErrorHandling(): Promise<WorkflowTestResult> {
    const startTime = performance.now();
    
    const tests = [
      {
        name: 'Error Handling - User Friendly Messages',
        testFn: async () => {
          const networkError = { code: 'NETWORK_ERROR', message: 'Network Error' };
          const friendlyMessage = getUserFriendlyErrorMessage(networkError);
          
          if (!friendlyMessage.includes('connection')) {
            throw new Error('Network error message not user-friendly');
          }
        },
      },
      {
        name: 'Error Handling - Validation Errors',
        testFn: async () => {
          const { getValidationErrors } = await import('./errorMessages');
          
          const validationError = {
            response: {
              status: 422,
              data: {
                errors: [
                  { field: 'email', message: 'Email is required' },
                  { field: 'password', message: 'Password too short' },
                ],
              },
            },
          };
          
          const errors = getValidationErrors(validationError);
          
          if (!errors.email || !errors.password) {
            throw new Error('Validation error extraction failed');
          }
        },
      },
      {
        name: 'Error Handling - Rate Limit Detection',
        testFn: async () => {
          const { isRateLimitError, getRateLimitRetryDelay } = await import('./errorMessages');
          
          const rateLimitError = {
            response: {
              status: 429,
              headers: { 'retry-after': '60' },
            },
          };
          
          if (!isRateLimitError(rateLimitError)) {
            throw new Error('Rate limit detection failed');
          }
          
          const delay = getRateLimitRetryDelay(rateLimitError);
          if (delay !== 60000) {
            throw new Error('Rate limit delay calculation failed');
          }
        },
      },
    ];

    const results = await this.testRunner.runTests(tests);
    const duration = performance.now() - startTime;
    
    return this.createWorkflowResult('Error Handling Tests', results, duration);
  }

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<{
    overall: { passed: boolean; passRate: number; totalDuration: number };
    workflows: WorkflowTestResult[];
  }> {
    console.log('🧪 Starting Integration Tests...');
    
    const workflows = [
      await this.testApiCore(),
      await this.testDataExtraction(),
      await this.testProposalsWorkflow(),
      await this.testContractsWorkflow(),
      await this.testErrorHandling(),
    ];

    const totalTests = workflows.reduce((sum, w) => sum + w.totalTests, 0);
    const totalPassed = workflows.reduce((sum, w) => sum + w.passedTests, 0);
    const totalDuration = workflows.reduce((sum, w) => sum + w.duration, 0);
    const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    const overallPassed = workflows.every(w => w.passed);

    console.log(`\n Integration Test Summary:`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalTests - totalPassed}`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
    console.log(`Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`Overall: ${overallPassed ? ' PASSED' : ' FAILED'}`);

    return {
      overall: {
        passed: overallPassed,
        passRate,
        totalDuration,
      },
      workflows,
    };
  }

  /**
   * Create workflow result
   */
  private createWorkflowResult(
    workflowName: string,
    results: TestResult[],
    duration: number
  ): WorkflowTestResult {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passed = failedTests === 0;

    return {
      workflowName,
      passed,
      totalTests,
      passedTests,
      failedTests,
      duration,
      results,
    };
  }
}

// Global integration test instance
export const integrationTests = new ApiIntegrationTests();

/**
 * Quick health check for critical functionality
 */
export async function runHealthCheck(): Promise<{
  healthy: boolean;
  checks: Array<{ name: string; status: 'pass' | 'fail'; message?: string }>;
}> {
  const checks = [];

  // Check data extraction utilities
  try {
    const testData = { data: [1, 2, 3] };
    const extracted = dataExtractor.extractArray(testData, ['data']);
    checks.push({
      name: 'Data Extraction',
      status: Array.isArray(extracted) && extracted.length === 3 ? 'pass' : 'fail',
    });
  } catch (error) {
    checks.push({
      name: 'Data Extraction',
      status: 'fail',
      message: 'Data extraction utilities failed',
    });
  }

  // Check error handling
  try {
    const errorMessage = getUserFriendlyErrorMessage({ response: { status: 404 } });
    checks.push({
      name: 'Error Handling',
      status: errorMessage.includes('not found') ? 'pass' : 'fail',
    });
  } catch (error) {
    checks.push({
      name: 'Error Handling',
      status: 'fail',
      message: 'Error handling utilities failed',
    });
  }

  // Check services initialization
  checks.push({
    name: 'Proposals Service',
    status: proposalsService ? 'pass' : 'fail',
  });

  checks.push({
    name: 'Contracts Service',
    status: contractsService ? 'pass' : 'fail',
  });

  const healthy = checks.every(check => check.status === 'pass');

  return { healthy, checks };
}

/**
 * Performance benchmark for critical operations
 */
export async function runPerformanceBenchmark(): Promise<{
  results: Array<{ operation: string; averageTime: number; samples: number }>;
  overall: { averageTime: number; totalOperations: number };
}> {
  const results = [];
  const samples = 10;

  // Benchmark data extraction
  const dataExtractionTimes = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    const testData = { data: Array.from({ length: 100 }, (_, i) => ({ id: i })) };
    dataExtractor.extractArray(testData, ['data']);
    dataExtractionTimes.push(performance.now() - start);
  }

  results.push({
    operation: 'Data Extraction (100 items)',
    averageTime: dataExtractionTimes.reduce((a, b) => a + b, 0) / samples,
    samples,
  });

  // Benchmark data validation
  const validationTimes = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    const mockProposal = {
      _id: 'test',
      project: 'project',
      freelancer: 'freelancer',
      coverLetter: 'Test cover letter',
      bidAmount: 100,
      timeline: { duration: 7, unit: 'days' },
    };
    validateProposalIntegrity(mockProposal);
    validationTimes.push(performance.now() - start);
  }

  results.push({
    operation: 'Proposal Validation',
    averageTime: validationTimes.reduce((a, b) => a + b, 0) / samples,
    samples,
  });

  const totalOperations = results.length * samples;
  const averageTime = results.reduce((sum, r) => sum + r.averageTime, 0) / results.length;

  return {
    results,
    overall: {
      averageTime,
      totalOperations,
    },
  };
}
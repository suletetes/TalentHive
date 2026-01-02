import { logger } from '@/utils/logger';
import { SeedProgress } from './types';

/**
 * Tracks progress of seeding operations with time estimation
 * Provides real-time progress updates and performance metrics
 */
export class ProgressTracker {
  private totalSteps: number = 0;
  private completedSteps: number = 0;
  private currentStep: string = '';
  private startTime: number = 0;
  private stepStartTime: number = 0;
  private entitiesProcessed: number = 0;
  private stepTimes: number[] = [];

  /**
   * Initialize progress tracking
   */
  initialize(totalSteps: number): void {
    this.totalSteps = totalSteps;
    this.completedSteps = 0;
    this.currentStep = 'Initializing...';
    this.startTime = Date.now();
    this.stepStartTime = Date.now();
    this.entitiesProcessed = 0;
    this.stepTimes = [];

    logger.info(` Progress tracking initialized for ${totalSteps} steps`);
  }

  /**
   * Mark current step as complete and move to next
   */
  completeStep(stepName: string, entitiesCount: number = 0): void {
    const stepDuration = Date.now() - this.stepStartTime;
    this.stepTimes.push(stepDuration);
    
    this.completedSteps++;
    this.entitiesProcessed += entitiesCount;
    this.currentStep = stepName;
    this.stepStartTime = Date.now();

    const progress = this.getProgress();
    logger.info(` Step ${this.completedSteps}/${this.totalSteps}: ${stepName} (${entitiesCount} entities, ${stepDuration}ms) - ${progress.percentage.toFixed(1)}%`);

    // Log estimated time remaining for longer operations
    if (progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 30000) {
      const minutes = Math.ceil(progress.estimatedTimeRemaining / 60000);
      logger.info(`  Estimated time remaining: ${minutes} minutes`);
    }
  }

  /**
   * Update current step without completing it
   */
  updateCurrentStep(stepName: string): void {
    this.currentStep = stepName;
  }

  /**
   * Add entities to the processed count
   */
  addProcessedEntities(count: number): void {
    this.entitiesProcessed += count;
  }

  /**
   * Get current progress information
   */
  getProgress(): SeedProgress {
    const percentage = this.totalSteps > 0 ? (this.completedSteps / this.totalSteps) * 100 : 0;
    const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining();

    return {
      currentStep: this.currentStep,
      completedSteps: this.completedSteps,
      totalSteps: this.totalSteps,
      percentage,
      entitiesProcessed: this.entitiesProcessed,
      estimatedTimeRemaining,
    };
  }

  /**
   * Reset progress tracking
   */
  reset(): void {
    this.totalSteps = 0;
    this.completedSteps = 0;
    this.currentStep = '';
    this.startTime = 0;
    this.stepStartTime = 0;
    this.entitiesProcessed = 0;
    this.stepTimes = [];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalDuration: number;
    averageStepTime: number;
    entitiesPerSecond: number;
    slowestStep: number;
    fastestStep: number;
  } {
    const totalDuration = Date.now() - this.startTime;
    const averageStepTime = this.stepTimes.length > 0 
      ? this.stepTimes.reduce((sum, time) => sum + time, 0) / this.stepTimes.length 
      : 0;
    const entitiesPerSecond = totalDuration > 0 
      ? (this.entitiesProcessed / totalDuration) * 1000 
      : 0;
    const slowestStep = this.stepTimes.length > 0 ? Math.max(...this.stepTimes) : 0;
    const fastestStep = this.stepTimes.length > 0 ? Math.min(...this.stepTimes) : 0;

    return {
      totalDuration,
      averageStepTime,
      entitiesPerSecond,
      slowestStep,
      fastestStep,
    };
  }

  /**
   * Log final performance summary
   */
  logPerformanceSummary(): void {
    const metrics = this.getPerformanceMetrics();
    const totalMinutes = Math.round(metrics.totalDuration / 60000 * 100) / 100;
    const avgStepSeconds = Math.round(metrics.averageStepTime / 1000 * 100) / 100;

    logger.info(` Seeding Performance Summary:`);
    logger.info(`   Total Duration: ${totalMinutes} minutes`);
    logger.info(`   Steps Completed: ${this.completedSteps}/${this.totalSteps}`);
    logger.info(`   Entities Processed: ${this.entitiesProcessed}`);
    logger.info(`   Average Step Time: ${avgStepSeconds} seconds`);
    logger.info(`   Processing Rate: ${Math.round(metrics.entitiesPerSecond)} entities/second`);
    
    if (this.stepTimes.length > 0) {
      const slowestSeconds = Math.round(metrics.slowestStep / 1000 * 100) / 100;
      const fastestSeconds = Math.round(metrics.fastestStep / 1000 * 100) / 100;
      logger.info(`   Slowest Step: ${slowestSeconds}s, Fastest Step: ${fastestSeconds}s`);
    }
  }

  /**
   * Calculate estimated time remaining based on average step time
   */
  private calculateEstimatedTimeRemaining(): number | undefined {
    if (this.stepTimes.length === 0 || this.completedSteps === 0) {
      return undefined;
    }

    const averageStepTime = this.stepTimes.reduce((sum, time) => sum + time, 0) / this.stepTimes.length;
    const remainingSteps = this.totalSteps - this.completedSteps;
    
    return remainingSteps * averageStepTime;
  }

  /**
   * Create a progress bar string for console output
   */
  createProgressBar(width: number = 40): string {
    const progress = this.getProgress();
    const filledWidth = Math.round((progress.percentage / 100) * width);
    const emptyWidth = width - filledWidth;
    
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    
    return `[${filled}${empty}] ${progress.percentage.toFixed(1)}%`;
  }

  /**
   * Log progress with visual progress bar
   */
  logProgressBar(): void {
    const progress = this.getProgress();
    const progressBar = this.createProgressBar();
    
    logger.info(`${progressBar} ${progress.currentStep} (${progress.entitiesProcessed} entities)`);
  }
}
import { logger } from '@/utils/logger';
import { SeedError } from './types';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for better classification
 */
export type ErrorCategory = 
  | 'validation' 
  | 'database' 
  | 'network' 
  | 'configuration' 
  | 'data_generation' 
  | 'dependency' 
  | 'system' 
  | 'unknown';

/**
 * Enhanced error information
 */
export interface EnhancedError extends SeedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  context: Record<string, any>;
  stackTrace?: string;
  suggestedAction?: string;
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: (error: EnhancedError, context: any) => Promise<boolean>;
  maxAttempts: number;
  delayMs: number;
}

/**
 * Cleanup operation interface
 */
export interface CleanupOperation {
  name: string;
  description: string;
  execute: (context: any) => Promise<void>;
  priority: number; // Higher priority runs first
}

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableAutoRecovery: boolean;
  enableCleanupOnFailure: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Comprehensive error handling system with context, recovery, and cleanup
 */
export class ErrorHandler {
  private errors: Map<string, EnhancedError> = new Map();
  private recoveryStrategies: Map<ErrorCategory, RecoveryStrategy[]> = new Map();
  private cleanupOperations: CleanupOperation[] = [];
  private config: ErrorHandlerConfig;
  private errorCount: number = 0;

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableAutoRecovery: true,
      enableCleanupOnFailure: true,
      logLevel: 'error',
      ...config
    };

    this.initializeDefaultRecoveryStrategies();
  }

  /**
   * Handle an error with context and recovery attempts
   */
  async handleError(
    error: Error | string,
    step: string,
    context: Record<string, any> = {},
    category: ErrorCategory = 'unknown'
  ): Promise<EnhancedError> {
    const enhancedError = this.createEnhancedError(error, step, context, category);
    
    this.errors.set(enhancedError.id, enhancedError);
    this.logError(enhancedError);

    // Attempt recovery if enabled and error is retryable
    if (this.config.enableAutoRecovery && enhancedError.retryable) {
      const recovered = await this.attemptRecovery(enhancedError, context);
      if (recovered) {
        logger.info(` Successfully recovered from error: ${enhancedError.id}`);
        enhancedError.message += ' (Recovered)';
      }
    }

    return enhancedError;
  }

  /**
   * Handle database-specific errors with detailed context
   */
  async handleDatabaseError(
    error: Error,
    operation: string,
    collection: string,
    data?: any
  ): Promise<EnhancedError> {
    const context = {
      operation,
      collection,
      dataType: data ? typeof data : 'unknown',
      dataCount: Array.isArray(data) ? data.length : data ? 1 : 0
    };

    let category: ErrorCategory = 'database';
    let suggestedAction = 'Check database connection and retry';

    // Classify database errors
    if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
      category = 'validation';
      suggestedAction = 'Check for duplicate data or adjust unique constraints';
    } else if (error.message.includes('validation failed')) {
      category = 'validation';
      suggestedAction = 'Validate data format and required fields';
    } else if (error.message.includes('connection') || error.message.includes('timeout')) {
      category = 'network';
      suggestedAction = 'Check database connection and network stability';
    }

    const enhancedError = await this.handleError(error, `Database ${operation}`, context, category);
    enhancedError.suggestedAction = suggestedAction;

    return enhancedError;
  }

  /**
   * Handle validation errors with field-specific context
   */
  async handleValidationError(
    error: Error | string,
    entityType: string,
    entityData: any,
    validationResults?: any
  ): Promise<EnhancedError> {
    const context = {
      entityType,
      entityId: entityData?.id || entityData?._id || 'unknown',
      validationResults,
      fieldCount: entityData ? Object.keys(entityData).length : 0
    };

    const enhancedError = await this.handleError(
      error,
      `Validation for ${entityType}`,
      context,
      'validation'
    );

    enhancedError.suggestedAction = 'Review data format and validation rules';
    return enhancedError;
  }

  /**
   * Handle configuration errors
   */
  async handleConfigurationError(
    error: Error | string,
    configSection: string,
    configValue?: any
  ): Promise<EnhancedError> {
    const context = {
      configSection,
      configValue: configValue ? JSON.stringify(configValue) : 'undefined',
      environment: process.env.NODE_ENV || 'unknown'
    };

    const enhancedError = await this.handleError(
      error,
      `Configuration: ${configSection}`,
      context,
      'configuration'
    );

    enhancedError.suggestedAction = 'Check configuration values and environment variables';
    return enhancedError;
  }

  /**
   * Register a cleanup operation
   */
  registerCleanupOperation(operation: CleanupOperation): void {
    this.cleanupOperations.push(operation);
    this.cleanupOperations.sort((a, b) => b.priority - a.priority);
    logger.debug(`Registered cleanup operation: ${operation.name}`);
  }

  /**
   * Execute cleanup operations
   */
  async executeCleanup(context: any = {}): Promise<void> {
    if (!this.config.enableCleanupOnFailure) {
      logger.info('Cleanup disabled, skipping cleanup operations');
      return;
    }

    logger.info(` Executing ${this.cleanupOperations.length} cleanup operations...`);

    for (const operation of this.cleanupOperations) {
      try {
        logger.info(`Executing cleanup: ${operation.name}`);
        await operation.execute(context);
        logger.info(` Cleanup completed: ${operation.name}`);
      } catch (cleanupError) {
        logger.error(` Cleanup failed: ${operation.name}`, cleanupError);
        // Continue with other cleanup operations even if one fails
      }
    }

    logger.info(' Cleanup operations completed');
  }

  /**
   * Register a recovery strategy for a specific error category
   */
  registerRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    if (!this.recoveryStrategies.has(category)) {
      this.recoveryStrategies.set(category, []);
    }
    this.recoveryStrategies.get(category)!.push(strategy);
    logger.debug(`Registered recovery strategy for ${category}: ${strategy.name}`);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    retryableErrors: number;
    recoveredErrors: number;
  } {
    const errors = Array.from(this.errors.values());
    
    const errorsByCategory: Record<ErrorCategory, number> = {
      validation: 0,
      database: 0,
      network: 0,
      configuration: 0,
      data_generation: 0,
      dependency: 0,
      system: 0,
      unknown: 0
    };

    const errorsBySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    let retryableErrors = 0;
    let recoveredErrors = 0;

    for (const error of errors) {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
      
      if (error.retryable) retryableErrors++;
      if (error.message.includes('(Recovered)')) recoveredErrors++;
    }

    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      retryableErrors,
      recoveredErrors
    };
  }

  /**
   * Generate error report
   */
  generateErrorReport(): string {
    const stats = this.getErrorStatistics();
    const errors = Array.from(this.errors.values());

    let report = '\n Error Report\n';
    report += '='.repeat(50) + '\n\n';

    // Summary
    report += `Summary:\n`;
    report += `  Total Errors: ${stats.totalErrors}\n`;
    report += `  Retryable Errors: ${stats.retryableErrors}\n`;
    report += `  Recovered Errors: ${stats.recoveredErrors}\n`;
    report += `  Recovery Rate: ${stats.retryableErrors > 0 ? ((stats.recoveredErrors / stats.retryableErrors) * 100).toFixed(1) : 0}%\n\n`;

    // By Category
    report += `Errors by Category:\n`;
    for (const [category, count] of Object.entries(stats.errorsByCategory)) {
      if (count > 0) {
        report += `  ${category}: ${count}\n`;
      }
    }

    // By Severity
    report += `\nErrors by Severity:\n`;
    for (const [severity, count] of Object.entries(stats.errorsBySeverity)) {
      if (count > 0) {
        report += `  ${severity}: ${count}\n`;
      }
    }

    // Critical and High Severity Errors
    const criticalErrors = errors.filter(e => e.severity === 'critical' || e.severity === 'high');
    if (criticalErrors.length > 0) {
      report += `\nCritical/High Severity Errors:\n`;
      for (const error of criticalErrors) {
        report += `  ${error.id}: ${error.message}\n`;
        if (error.suggestedAction) {
          report += `    Suggested Action: ${error.suggestedAction}\n`;
        }
      }
    }

    return report;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.clear();
    this.errorCount = 0;
    logger.info(' Error history cleared');
  }

  /**
   * Get all errors
   */
  getAllErrors(): EnhancedError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): EnhancedError[] {
    return Array.from(this.errors.values()).filter(e => e.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): EnhancedError[] {
    return Array.from(this.errors.values()).filter(e => e.severity === severity);
  }

  /**
   * Create enhanced error from basic error
   */
  private createEnhancedError(
    error: Error | string,
    step: string,
    context: Record<string, any>,
    category: ErrorCategory
  ): EnhancedError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'object' ? error.stack : undefined;
    
    this.errorCount++;
    
    return {
      id: `error_${Date.now()}_${this.errorCount}`,
      step,
      message: errorMessage,
      details: context,
      timestamp: new Date(),
      category,
      severity: this.determineSeverity(errorMessage, category),
      retryable: this.isRetryable(errorMessage, category),
      context,
      stackTrace,
    };
  }

  /**
   * Determine error severity based on message and category
   */
  private determineSeverity(message: string, category: ErrorCategory): ErrorSeverity {
    const lowerMessage = message.toLowerCase();

    // Critical errors
    if (lowerMessage.includes('out of memory') || 
        lowerMessage.includes('system error') ||
        lowerMessage.includes('fatal') ||
        category === 'system') {
      return 'critical';
    }

    // High severity errors
    if (lowerMessage.includes('database') && lowerMessage.includes('connection') ||
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('permission denied') ||
        category === 'configuration') {
      return 'high';
    }

    // Medium severity errors
    if (category === 'validation' || 
        category === 'data_generation' ||
        lowerMessage.includes('timeout')) {
      return 'medium';
    }

    // Low severity errors (default)
    return 'low';
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(message: string, category: ErrorCategory): boolean {
    const lowerMessage = message.toLowerCase();

    // Non-retryable errors
    if (lowerMessage.includes('permission denied') ||
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('invalid configuration') ||
        category === 'configuration') {
      return false;
    }

    // Retryable errors
    if (lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('network') ||
        category === 'network' ||
        category === 'database') {
      return true;
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: EnhancedError, context: any): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(error.category) || [];
    
    for (const strategy of strategies) {
      logger.info(`Attempting recovery strategy: ${strategy.name}`);
      
      let attempts = 0;
      while (attempts < strategy.maxAttempts) {
        try {
          const success = await strategy.execute(error, context);
          if (success) {
            logger.info(` Recovery successful with strategy: ${strategy.name}`);
            return true;
          }
        } catch (recoveryError) {
          logger.warn(`Recovery attempt failed: ${strategy.name}`, recoveryError);
        }
        
        attempts++;
        if (attempts < strategy.maxAttempts) {
          await this.delay(strategy.delayMs);
        }
      }
    }

    logger.warn(` All recovery strategies failed for error: ${error.id}`);
    return false;
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultRecoveryStrategies(): void {
    // Database connection recovery
    this.registerRecoveryStrategy('database', {
      name: 'database_reconnect',
      description: 'Attempt to reconnect to database',
      execute: async (error, context) => {
        // In real implementation, this would attempt database reconnection
        logger.info('Attempting database reconnection...');
        await this.delay(2000);
        return Math.random() > 0.3; // 70% success rate for simulation
      },
      maxAttempts: 3,
      delayMs: 2000
    });

    // Network retry strategy
    this.registerRecoveryStrategy('network', {
      name: 'network_retry',
      description: 'Retry network operation with exponential backoff',
      execute: async (error, context) => {
        logger.info('Retrying network operation...');
        await this.delay(1000);
        return Math.random() > 0.4; // 60% success rate for simulation
      },
      maxAttempts: 5,
      delayMs: 1000
    });

    // Data generation retry
    this.registerRecoveryStrategy('data_generation', {
      name: 'regenerate_data',
      description: 'Regenerate failed data with different parameters',
      execute: async (error, context) => {
        logger.info('Regenerating data with adjusted parameters...');
        await this.delay(500);
        return Math.random() > 0.2; // 80% success rate for simulation
      },
      maxAttempts: 2,
      delayMs: 500
    });
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: EnhancedError): void {
    const logMessage = `[${error.category.toUpperCase()}] ${error.step}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        logger.error(` CRITICAL: ${logMessage}`, error.context);
        break;
      case 'high':
        logger.error(` HIGH: ${logMessage}`, error.context);
        break;
      case 'medium':
        logger.warn(`  MEDIUM: ${logMessage}`, error.context);
        break;
      case 'low':
        if (this.config.logLevel === 'info' || this.config.logLevel === 'debug') {
          logger.info(`  LOW: ${logMessage}`, error.context);
        }
        break;
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
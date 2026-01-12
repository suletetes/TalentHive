import { ErrorHandler, ApiError } from './errorHandler';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: ApiError, attempt: number) => boolean;
  onRetry?: (error: ApiError, attempt: number, delay: number) => void;
  timeout?: number;
}

export interface RetryState {
  attempt: number;
  totalAttempts: number;
  lastError?: ApiError;
  isRetrying: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: ApiError) => {
    // Retry on network errors and server errors (5xx)
    return ErrorHandler.isNetworkError(error) || ErrorHandler.isServerError(error);
  },
  timeout: 60000,
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: ApiError;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Add timeout to the function call
      const result = await withTimeout(fn(), opts.timeout);
      return result;
    } catch (error) {
      lastError = ErrorHandler.handle(error);

      // Check if we should retry
      const shouldRetry = opts.shouldRetry(lastError, attempt);
      const isLastAttempt = attempt === opts.maxAttempts;

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;

      // Call onRetry callback if provided
      options.onRetry?.(lastError, attempt, finalDelay);

      // Wait before retrying
      await sleep(finalDelay);
    }
  }

  throw lastError!;
}

/**
 * Retry with custom retry logic
 */
export class RetryManager<T> {
  private state: RetryState = {
    attempt: 0,
    totalAttempts: 0,
    isRetrying: false,
  };

  constructor(
    private fn: () => Promise<T>,
    private options: RetryOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async execute(): Promise<T> {
    this.state.totalAttempts = this.options.maxAttempts || DEFAULT_OPTIONS.maxAttempts;
    return withRetry(this.fn, this.options);
  }

  getState(): Readonly<RetryState> {
    return { ...this.state };
  }

  reset() {
    this.state = {
      attempt: 0,
      totalAttempts: 0,
      isRetrying: false,
    };
  }
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker<T> {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private fn: () => Promise<T>,
    private options: {
      failureThreshold?: number;
      successThreshold?: number;
      timeout?: number;
      resetTimeout?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      resetTimeout: 60000,
      ...options,
    };
  }

  async execute(): Promise<T> {
    if (this.state === 'open') {
      // Check if we should try half-open
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceLastFailure >= this.options.resetTimeout!) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await withTimeout(this.fn(), this.options.timeout!);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold!) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Batch retry for multiple operations
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions & {
    concurrency?: number;
    stopOnFirstError?: boolean;
  } = {}
): Promise<Array<T | Error>> {
  const { concurrency = 3, stopOnFirstError = false, ...retryOptions } = options;
  const results: Array<T | Error> = [];
  const queue = [...operations];

  const executeNext = async (): Promise<void> => {
    if (queue.length === 0) return;

    const operation = queue.shift()!;
    try {
      const result = await withRetry(operation, retryOptions);
      results.push(result);
    } catch (error) {
      results.push(error as Error);
      if (stopOnFirstError) {
        queue.length = 0; // Clear the queue
      }
    }

    if (queue.length > 0) {
      await executeNext();
    }
  };

  // Start concurrent executions
  const workers = Array.from({ length: Math.min(concurrency, operations.length) }, () =>
    executeNext()
  );

  await Promise.all(workers);
  return results;
}

/**
 * Retry with polling
 */
export async function retryUntil<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: RetryOptions & {
    pollInterval?: number;
    maxDuration?: number;
  } = {}
): Promise<T> {
  const { pollInterval = 1000, maxDuration = 60000, ...retryOptions } = options;
  const startTime = Date.now();

  while (true) {
    try {
      const result = await withRetry(fn, retryOptions);
      
      if (condition(result)) {
        return result;
      }

      // Check if we've exceeded max duration
      if (Date.now() - startTime >= maxDuration) {
        throw new Error('Polling timeout: condition not met within max duration');
      }

      // Wait before next poll
      await sleep(pollInterval);
    } catch (error) {
      // Check if we've exceeded max duration
      if (Date.now() - startTime >= maxDuration) {
        throw error;
      }

      // Wait before retrying
      await sleep(pollInterval);
    }
  }
}

/**
 * Helper function to add timeout to a promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decorators for retry functionality
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Hook-friendly retry wrapper
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: any[]) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

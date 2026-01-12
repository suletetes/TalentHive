// Request timeout handling utility

export interface TimeoutConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
}

export class RequestTimeoutHandler {
  private static defaultConfig: TimeoutConfig = {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  };

  /**
   * Create a timeout promise that rejects after specified time
   */
  static createTimeoutPromise(timeout: number, message = 'Request timeout'): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message));
      }, timeout);
    });
  }

  /**
   * Wrap a promise with timeout functionality
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeout: number = this.defaultConfig.timeout,
    message = 'Request timeout'
  ): Promise<T> {
    return Promise.race([
      promise,
      this.createTimeoutPromise(timeout, message),
    ]);
  }

  /**
   * Retry a failed request with exponential backoff
   */
  static async withRetry<T>(
    requestFn: () => Promise<T>,
    config: Partial<TimeoutConfig> = {}
  ): Promise<T> {
    const { retries, retryDelay, timeout } = { ...this.defaultConfig, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const promise = requestFn();
        return await this.withTimeout(promise, timeout);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await this.delay(delay);
        
        console.log(`[RequestTimeout] Retrying request (attempt ${attempt + 2}/${retries + 1}) after ${delay}ms`);
      }
    }

    throw lastError!;
  }

  /**
   * Check if error should not be retried
   */
  private static shouldNotRetry(error: any): boolean {
    // Don't retry on 4xx errors (except 408, 429)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return ![408, 429].includes(error.response.status);
    }

    // Don't retry on authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return true;
    }

    return false;
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly timeout message
   */
  static getTimeoutMessage(timeout: number): string {
    const seconds = Math.round(timeout / 1000);
    return `Request timed out after ${seconds} seconds. Please check your connection and try again.`;
  }

  /**
   * Check if error is a timeout error
   */
  static isTimeoutError(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Request timeout')
    );
  }
}
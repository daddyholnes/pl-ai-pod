/**
 * Retry utility for handling transient errors when making API calls
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 500, // Start with a 500ms delay
  maxDelay: 10000,   // Maximum delay of 10 seconds
  backoffFactor: 2,  // Exponential backoff 
  // Default retryable error messages
  retryableErrors: [
    'rate limit', 
    'timeout', 
    'network', 
    'connection', 
    '429', 
    '500', 
    '503',
    'temporary',
    'quota'
  ]
};

/**
 * Executes a function with exponential backoff retry logic
 * @param fn The function to execute (should return a Promise)
 * @param options Retry configuration options
 * @returns Promise with the result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  // If a custom shouldRetry function is not provided, create one based on retryableErrors
  const shouldRetry = config.shouldRetry || ((error: any) => {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    return config.retryableErrors?.some(msg => 
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    ) || false;
  });

  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Attempt to execute the function
      return await fn();
    } catch (error) {
      lastError = error;
      
      // On the last attempt, don't retry, just throw
      if (attempt >= config.maxRetries) {
        throw error;
      }
      
      // Check if this error is retryable
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      );
      
      // Add some jitter to avoid all clients retrying at the same time
      const jitteredDelay = delay * (0.8 + Math.random() * 0.4);
      
      // Notify about the retry if callback provided
      if (config.onRetry) {
        config.onRetry(error, attempt + 1, jitteredDelay);
      }
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript requires it
  throw lastError;
}

/**
 * Retry decorator function that can be applied to any class method that returns a Promise
 */
export function retryDecorator(options: Partial<RetryOptions> = {}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}
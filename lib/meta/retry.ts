/**
 * Retry utility for API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Retries a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 300,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: any;
  let delay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if we've exhausted retries or if error is not retryable
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Rate limit errors are retryable
  if (error.code === 613 || error.error?.code === 613) return true;

  // Network errors are retryable
  if (error.message?.includes("fetch") || error.message?.includes("network")) {
    return true;
  }

  // 5xx errors are retryable
  if (error.status >= 500 && error.status < 600) return true;

  // Token expiration is NOT retryable
  if (error.code === 190 || error.error?.code === 190) return false;

  // 4xx errors (except rate limits) are NOT retryable
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }

  return false;
}


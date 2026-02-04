/**
 * Prisma Retry Wrapper
 * Automatically retries database operations on connection errors
 */

/**
 * Retry a Prisma operation with exponential backoff
 * @param {Function} operation - Async function that performs Prisma query
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in ms between retries
 */
export async function retryPrismaOperation(operation, maxRetries = 3, baseDelay = 500) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable (connection errors)
      const isRetryable = 
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('Can\'t reach database server');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        // Not retryable or last attempt - throw the error
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying database operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

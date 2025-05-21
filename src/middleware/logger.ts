import type { Context, Next } from 'hono';

import logger from '../utils/logger.js';
import { asyncLocalStorage, generateRequestId } from '../utils/requestContext.js';

/**
 * Custom request logger middleware that uses Winston and adds request ID
 * Logs detailed information about each request including method, path, status code, response time, and request ID
 */
export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const { method, url } = c.req;
  const path = new URL(url).pathname;
  
  // Generate a unique request ID for this request
  const requestId = generateRequestId();
  
  // Store the request ID in the context for use by other middleware and handlers
  c.set('requestId', requestId);
  
  // Run the rest of the request inside the AsyncLocalStorage context
  return asyncLocalStorage.run({ requestId }, async () => {
    // Log the incoming request with request ID
    logger.http(`[${requestId}] Request: ${method} ${path}`);
    
    try {
      await next();
    } finally {
      // Calculate response time
      const responseTime = Date.now() - start;
      const status = c.res.status;
      
      // Log the response with status code, response time, and request ID
      logger.http(`[${requestId}] Response: ${method} ${path} ${status} - ${responseTime}ms`);
    }
  });
};

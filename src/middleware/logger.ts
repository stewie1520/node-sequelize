import type { Context, Next } from 'hono';

import logger from '../utils/logger.js';

/**
 * Custom request logger middleware that uses Winston
 * Logs detailed information about each request including method, path, status code, and response time
 */
export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const { method, url } = c.req;
  const path = new URL(url).pathname;
  
  // Log the incoming request
  logger.http(`Request: ${method} ${path}`);
  
  await next();
  
  // Calculate response time
  const responseTime = Date.now() - start;
  const status = c.res.status;
  
  // Log the response with status code and response time
  logger.http(`Response: ${method} ${path} ${status} - ${responseTime}ms`);
};

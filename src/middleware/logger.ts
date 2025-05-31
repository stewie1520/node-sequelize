import type { Context, Next } from "hono";

import logger from "../utils/logger.js";

/**
 * Custom request logger middleware that uses Winston and adds request ID
 * Logs detailed information about each request including method, path, status code, response time, and request ID
 */
export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const { method, url } = c.req;
  const path = new URL(url).pathname;
  const requestId = c.get("requestId");

  logger.http(`[${requestId}] Request: ${method} ${path}`);

  try {
    await next();
  } finally {
    // Calculate response time
    const responseTime = Date.now() - start;
    const status = c.res.status;

    // Log the response with status code, response time, and request ID
    logger.http(
      `[${requestId}] Response: ${method} ${path} ${status} - ${responseTime}ms`,
    );
  }
};

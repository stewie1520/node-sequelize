import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

import { getRequestId } from './requestContext.js';
import logger from './logger.js';

/**
 * Helper function to handle Zod validation errors consistently
 * @param c Hono Context
 * @param error The error object
 * @param statusCode Optional status code (defaults to 400)
 * @returns JSON response with validation error details
 */
const handleZodError = (
  c: Context,
  error: ZodError,
  statusCode: ContentfulStatusCode = 400,
) => {
  const formattedErrors = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  const requestId = getRequestId() || 'unknown';
  
  return c.json(
    {
      success: false,
      message: 'Validation error',
      errors: formattedErrors,
      requestId,
    },
    statusCode,
  );
};

/**
 * Helper function to handle all types of errors in controllers
 * @param c Hono Context
 * @param error The error object
 * @returns Appropriate JSON response based on error type
 */
export const handleControllerError = (c: Context, error: unknown) => {
  if (error instanceof ZodError) {
    return handleZodError(c, error);
  }

  // Handle custom app errors
  if (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as { statusCode: number }).statusCode === 'number'
  ) {
    const requestId = getRequestId() || 'unknown';
    
    return c.json(
      {
        success: false,
        message: error.message,
        requestId,
      },
      (error as { statusCode: ContentfulStatusCode }).statusCode,
    );
  }

  // Get the request ID from the current context
  const requestId = getRequestId() || 'unknown';
  
  // Handle unexpected errors
  logger.error(`[${requestId}] Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  if (error instanceof Error && error.stack) {
    logger.debug(`[${requestId}] Error stack: ${error.stack}`);
  }
  
  return c.json(
    {
      success: false,
      message: 'Server error',
      requestId,
    },
    500,
  );
};

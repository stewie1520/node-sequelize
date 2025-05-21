import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

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

  return c.json(
    {
      success: false,
      message: 'Validation error',
      errors: formattedErrors,
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
    return c.json(
      {
        success: false,
        message: error.message,
      },
      (error as { statusCode: ContentfulStatusCode }).statusCode,
    );
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return c.json(
    {
      success: false,
      message: 'Server error',
    },
    500,
  );
};

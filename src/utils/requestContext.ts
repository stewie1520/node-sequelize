import { AsyncLocalStorage } from "async_hooks";
import { v7 as uuidv7 } from "uuid";

// Define the type for our request context
export interface RequestContext {
  requestId: string;
  [key: string]: string | number | boolean | object | undefined; // Allow for additional context properties in the future
}

// Create AsyncLocalStorage instance
export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Generate a new request ID
 * @returns A unique request ID
 */
export const generateRequestId = (): string => {
  return uuidv7();
};

/**
 * Get the current request context
 * @returns The current request context or undefined if not in a request context
 */
export const getRequestContext = (): RequestContext | undefined => {
  return asyncLocalStorage.getStore();
};

/**
 * Get the current request ID
 * @returns The current request ID or undefined if not in a request context
 */
export const getRequestId = (): string | undefined => {
  const context = getRequestContext();
  return context?.requestId;
};

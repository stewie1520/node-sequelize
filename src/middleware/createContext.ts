import { createMiddleware } from "hono/factory";
import {
  asyncLocalStorage,
  generateRequestId,
} from "../utils/requestContext.js";

export const createContext = createMiddleware<{
  Variables: {
    readonly requestId: string;
  };
}>(async (c, next) => {
  const requestId = generateRequestId();

  // Store the request ID in the context for use by other middleware and handlers
  c.set("requestId", requestId);

  return asyncLocalStorage.run({ requestId }, async () => {
    await next();
  });
});

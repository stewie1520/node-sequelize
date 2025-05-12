import { createMiddleware } from 'hono/factory';
import { UnauthorizedError } from "../utils/errors.js";
import { verifyToken, type TokenPayload } from "../utils/jwt.js";

export const authenticate = createMiddleware<{
  Variables: {
    user: TokenPayload
  }
}>(async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Add user info to the context for use in controllers
    c.set("user", decoded);
    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return c.json({ message: error.message }, 401);
    }
    return c.json({ message: "Authentication failed" }, 401);
  }
});

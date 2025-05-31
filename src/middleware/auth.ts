import { createMiddleware } from "hono/factory";

import { ERole, UserRole } from "../models/UserRole.js";
import JwtService, {
  type TokenPayload,
} from "../services/platform/JwtService.js";
import { UnauthorizedError } from "../utils/errors.js";

export const authenticate = createMiddleware<{
  Variables: {
    user: TokenPayload;
  };
}>(async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = await JwtService.verifyToken(token);

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

export const optionalAuth = createMiddleware<{
  Variables: {
    user?: TokenPayload;
  };
}>(async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = await JwtService.verifyToken(token);

      if (decoded) {
        c.set("user", decoded);
      }
    }

    await next();
  } catch {
    // For optional auth, we don't throw errors, just continue without user
    await next();
  }
});

export const mustBeAdmin = createMiddleware<{
  Variables: {
    admin: TokenPayload;
    user?: TokenPayload;
  };
}>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (
    (await UserRole.count({
      where: {
        userId: user.id,
        role: ERole.ADMIN,
      },
    })) === 0
  ) {
    throw new UnauthorizedError("Admin access required");
  }

  await next();
});

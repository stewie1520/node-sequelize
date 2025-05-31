import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authenticate } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "../schemas/user.js";
import UserService from "../services/business/UserService.js";
import { getConnInfo } from "@hono/node-server/conninfo";
import JwtService from "../services/platform/JwtService.js";

const authRouter = new Hono();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const user = await UserService.register(c.req.valid("json"));

  return c.json(
    {
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    201,
  );
});

/**
 * @route POST /auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const userAgent = c.req.header("User-Agent");
  const ipAddress = getConnInfo(c).remote.address;

  const { user, token } = await UserService.login(c.req.valid("json"), {
    userAgent,
    ipAddress,
  });

  return c.json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
});

/**
 * @route GET /auth/profile
 * @desc Get current user profile
 * @access Private
 */
authRouter.get("/profile", authenticate, async (c) => {
  const userId = c.get("user").id;
  const user = await UserService.getUserById(userId);

  return c.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

/**
 * @route POST /auth/logout
 * @desc Logout user and revoke current token
 * @access Private
 */
authRouter.post("/logout", authenticate, async (c) => {
  const { jti } = c.get("user");

  const revoked = await JwtService.revokeToken(jti, "User logout");

  if (revoked) {
    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } else {
    return c.json(
      {
        success: false,
        message: "Failed to logout",
      },
      500,
    );
  }
});

/**
 * @route POST /auth/logout-all
 * @desc Logout user from all devices by revoking all tokens
 * @access Private
 */
authRouter.post("/logout-all", authenticate, async (c) => {
  const { id: userId } = c.get("user");

  const revokedCount = await JwtService.revokeAllUserTokens(
    userId,
    "User logout from all devices",
  );

  return c.json({
    success: true,
    message: `Logged out from ${revokedCount} devices successfully`,
    data: { revokedCount },
  });
});

/**
 * @route GET /auth/sessions
 * @desc Get all active sessions/tokens for current user
 * @access Private
 */
authRouter.get("/sessions", authenticate, async (c) => {
  const { id: userId } = c.get("user");

  const activeSessions = await JwtService.getUserActiveTokens(userId);

  return c.json({
    success: true,
    data: {
      activeSessions: activeSessions.map((session) => ({
        issuedAt: new Date(session.issuedAt * 1000).toISOString(),
        expiresAt: new Date(session.expiresAt * 1000).toISOString(),
        userAgent: session.userAgent || "Unknown",
        ipAddress: session.ipAddress || "Unknown",
      })),
      totalSessions: activeSessions.length,
    },
  });
});

/**
 * @route POST /auth/revoke-token
 * @desc Revoke a specific token by JTI (for admin use)
 * @access Private
 */
authRouter.post(
  "/revoke-token",
  authenticate,
  zValidator(
    "json",
    z.object({
      jti: z.string().uuid(),
      reason: z.string().optional(),
    }),
  ),
  async (c) => {
    const { jti, reason } = c.req.valid("json");

    const revoked = await JwtService.revokeToken(
      jti,
      reason || "Manual revocation",
    );

    if (revoked) {
      return c.json({
        success: true,
        message: "Token revoked successfully",
      });
    } else {
      return c.json(
        {
          success: false,
          message: "Failed to revoke token or token not found",
        },
        404,
      );
    }
  },
);

export default authRouter;

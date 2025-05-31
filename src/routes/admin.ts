import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authenticate, mustBeAdmin } from "../middleware/auth.js";
import JwtService from "../services/platform/JwtService.js";

const adminRouter = new Hono();

adminRouter.use(authenticate, mustBeAdmin);

/**
 * @route GET /admin/users/:userId/tokens
 * @desc Get all active tokens for a specific user
 * @access Private (Admin)
 */
adminRouter.get("/users/:userId/tokens", async (c) => {
  const userId = c.req.param("userId");

  if (!userId) {
    return c.json(
      {
        success: false,
        message: "User ID is required",
      },
      400,
    );
  }

  const activeSessions = await JwtService.getUserActiveTokens(userId);

  return c.json({
    success: true,
    data: {
      userId,
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
 * @route DELETE /admin/users/:userId/tokens
 * @desc Revoke all tokens for a specific user
 * @access Private (Admin)
 */
adminRouter.delete(
  "/users/:userId/tokens",
  zValidator(
    "json",
    z.object({
      reason: z.string().optional(),
    }),
  ),
  async (c) => {
    const userId = c.req.param("userId");
    const { reason } = c.req.valid("json");

    if (!userId) {
      return c.json(
        {
          success: false,
          message: "User ID is required",
        },
        400,
      );
    }

    const revokedCount = await JwtService.revokeAllUserTokens(
      userId,
      reason || "Admin revocation",
    );

    return c.json({
      success: true,
      message: `Revoked ${revokedCount} tokens for user ${userId}`,
      data: { userId, revokedCount },
    });
  },
);

/**
 * @route DELETE /admin/tokens/:jti
 * @desc Revoke a specific token by JTI
 * @access Private (Admin)
 */
adminRouter.delete(
  "/tokens/:jti",
  zValidator(
    "json",
    z.object({
      reason: z.string().optional(),
    }),
  ),
  async (c) => {
    const jti = c.req.param("jti");
    const { reason } = c.req.valid("json");

    if (!jti) {
      return c.json(
        {
          success: false,
          message: "Token JTI is required",
        },
        400,
      );
    }

    const revoked = await JwtService.revokeToken(
      jti,
      reason || "Admin revocation",
    );

    if (revoked) {
      return c.json({
        success: true,
        message: "Token revoked successfully",
        data: { jti },
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

export default adminRouter;

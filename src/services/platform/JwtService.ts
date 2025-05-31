import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import ms, { type StringValue } from "ms";

import { config } from "../../config/jwt.js";
import { RedisService } from "../../redis/RedisService.js";
import logger from "../../utils/logger.js";

export interface TokenPayload {
  id: string;
  email: string;
  jti: string; // JWT ID for tracking individual tokens
  iat: number;
}

export interface StoredTokenData {
  userId: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
  userAgent?: string;
  ipAddress?: string;
}

class JwtService {
  private redisService: RedisService;
  private readonly TOKEN_PREFIX = "jwt:token:";
  private readonly USER_TOKENS_PREFIX = "jwt:user:";
  private readonly REVOKED_PREFIX = "jwt:revoked:";

  constructor() {
    this.redisService = RedisService.getInstance();
  }

  /**
   * Generate a new JWT token and store it in Redis
   */
  async generateToken(
    payload: { id: string; email: string },
    options?: {
      userAgent?: string;
      ipAddress?: string;
      expiresIn?: StringValue;
    },
  ): Promise<string> {
    const jti = uuidv4(); // Unique token identifier
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = (options?.expiresIn || config.expiresIn) as StringValue;
    const expirationTime = now + Math.floor(ms(expiresIn) / 1000);

    const tokenPayload: TokenPayload = {
      id: payload.id,
      email: payload.email,
      jti,
      iat: now,
    };

    // Generate JWT token
    const token = jwt.sign(tokenPayload, config.secret, {
      expiresIn,
    });

    // Store token data in Redis
    const tokenData: StoredTokenData = {
      userId: payload.id,
      email: payload.email,
      issuedAt: now,
      expiresAt: expirationTime,
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
    };

    try {
      const pipeline = this.redisService.pipeline();

      pipeline.setex(
        `${this.TOKEN_PREFIX}${jti}`,
        Math.ceil(ms(expiresIn) / 1000),
        JSON.stringify(tokenData),
      );

      pipeline.sadd(`${this.USER_TOKENS_PREFIX}${payload.id}`, jti);
      pipeline.expire(
        `${this.USER_TOKENS_PREFIX}${payload.id}`,
        Math.ceil(ms(expiresIn) / 1000),
      );

      await pipeline.exec();

      logger.info({
        message: "JWT token generated and stored",
        userId: payload.id,
        jti,
        expiresAt: new Date(expirationTime * 1000).toISOString(),
      });

      return token;
    } catch (error) {
      logger.error({
        message: "Failed to store JWT token in Redis",
        error,
        userId: payload.id,
        jti,
      });
      throw new Error("Failed to generate token");
    }
  }

  /**
   * Verify and validate a JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      // First verify the JWT signature and structure
      const decoded = jwt.verify(token, config.secret) as TokenPayload;

      if (!decoded.jti) {
        logger.warn({
          message: "Token missing JTI",
          userId: decoded.id,
        });
        return null;
      }

      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(decoded.jti);
      if (isRevoked) {
        logger.info({
          message: "Attempted use of revoked token",
          userId: decoded.id,
          jti: decoded.jti,
        });
        return null;
      }

      // Check if token exists in Redis
      const tokenData = await this.getTokenData(decoded.jti);
      if (!tokenData) {
        logger.warn({
          message: "Token not found in Redis store",
          userId: decoded.id,
          jti: decoded.jti,
        });
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.info({
          message: "Invalid JWT token",
          error: error.message,
        });
      } else {
        logger.error({
          message: "Token verification failed",
          error,
        });
      }
      return null;
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(jti: string, reason?: string): Promise<boolean> {
    try {
      const tokenData = await this.getTokenData(jti);
      if (!tokenData) {
        logger.warn({
          message: "Attempted to revoke non-existent token",
          jti,
        });
        return false;
      }

      const pipeline = this.redisService.pipeline();

      // Add to revoked tokens set with expiration
      const ttl = tokenData.expiresAt - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        pipeline.setex(
          `${this.REVOKED_PREFIX}${jti}`,
          ttl,
          JSON.stringify({
            revokedAt: Math.floor(Date.now() / 1000),
            reason: reason || "Manual revocation",
            userId: tokenData.userId,
          }),
        );
      }

      // Remove from active tokens
      pipeline.del(`${this.TOKEN_PREFIX}${jti}`);
      pipeline.srem(`${this.USER_TOKENS_PREFIX}${tokenData.userId}`, jti);

      await pipeline.exec();

      logger.info({
        message: "Token revoked successfully",
        jti,
        userId: tokenData.userId,
        reason,
      });

      return true;
    } catch (error) {
      logger.error({
        message: "Failed to revoke token",
        error,
        jti,
      });
      return false;
    }
  }

  /**
   * Revoke all tokens for a specific user
   */
  async revokeAllUserTokens(userId: string, reason?: string): Promise<number> {
    try {
      const activeTokens = await this.redisService
        .getClient()
        .smembers(`${this.USER_TOKENS_PREFIX}${userId}`);

      if (activeTokens.length === 0) {
        return 0;
      }

      let revokedCount = 0;
      for (const jti of activeTokens) {
        const success = await this.revokeToken(
          jti,
          reason || "Revoke all user tokens",
        );
        if (success) revokedCount++;
      }

      logger.info({
        message: "Revoked all user tokens",
        userId,
        revokedCount,
        totalTokens: activeTokens.length,
        reason,
      });

      return revokedCount;
    } catch (error) {
      logger.error({
        message: "Failed to revoke all user tokens",
        error,
        userId,
      });
      return 0;
    }
  }

  /**
   * Get all active tokens for a user
   */
  async getUserActiveTokens(userId: string): Promise<StoredTokenData[]> {
    try {
      const tokenIds = await this.redisService
        .getClient()
        .smembers(`${this.USER_TOKENS_PREFIX}${userId}`);

      const tokens: StoredTokenData[] = [];
      for (const jti of tokenIds) {
        const tokenData = await this.getTokenData(jti);
        if (tokenData) {
          tokens.push(tokenData);
        }
      }

      return tokens;
    } catch (error) {
      logger.error({
        message: "Failed to get user active tokens",
        error,
        userId,
      });
      return [];
    }
  }

  /**
   * Clean up expired tokens from Redis
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const pattern = `${this.TOKEN_PREFIX}*`;
      const keys = await this.redisService.getClient().keys(pattern);

      let cleanedCount = 0;
      for (const key of keys) {
        const ttl = await this.redisService.getClient().ttl(key);
        if (ttl <= 0) {
          await this.redisService.getClient().del(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info({
          message: "Cleaned up expired tokens",
          cleanedCount,
        });
      }
    } catch (error) {
      logger.error({
        message: "Failed to cleanup expired tokens",
        error,
      });
    }
  }

  /**
   * Check if a token is revoked
   */
  private async isTokenRevoked(jti: string): Promise<boolean> {
    try {
      const revoked = await this.redisService
        .getClient()
        .get(`${this.REVOKED_PREFIX}${jti}`);
      return revoked !== null;
    } catch (error) {
      logger.error({
        message: "Failed to check token revocation status",
        error,
        jti,
      });
      return false;
    }
  }

  /**
   * Get token data from Redis
   */
  private async getTokenData(jti: string): Promise<StoredTokenData | null> {
    try {
      const data = await this.redisService
        .getClient()
        .get(`${this.TOKEN_PREFIX}${jti}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error({
        message: "Failed to get token data",
        error,
        jti,
      });
      return null;
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(): Promise<{
    totalActiveTokens: number;
    totalRevokedTokens: number;
    tokensByUser: Record<string, number>;
  }> {
    try {
      const activeKeys = await this.redisService
        .getClient()
        .keys(`${this.TOKEN_PREFIX}*`);
      const revokedKeys = await this.redisService
        .getClient()
        .keys(`${this.REVOKED_PREFIX}*`);
      const userKeys = await this.redisService
        .getClient()
        .keys(`${this.USER_TOKENS_PREFIX}*`);

      const tokensByUser: Record<string, number> = {};
      for (const userKey of userKeys) {
        const userId = userKey.replace(this.USER_TOKENS_PREFIX, "");
        const tokenCount = await this.redisService.getClient().scard(userKey);
        tokensByUser[userId] = tokenCount;
      }

      return {
        totalActiveTokens: activeKeys.length,
        totalRevokedTokens: revokedKeys.length,
        tokensByUser,
      };
    } catch (error) {
      logger.error({
        message: "Failed to get token statistics",
        error,
      });
      return {
        totalActiveTokens: 0,
        totalRevokedTokens: 0,
        tokensByUser: {},
      };
    }
  }
}

export default new JwtService();

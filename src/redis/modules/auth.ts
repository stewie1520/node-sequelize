import { RedisService } from '../RedisService.js';
import type { SessionData } from '../types.js';
import { logInfo, logError } from '../logger.js';

interface TokenOptions {
  ttl?: number; // seconds
}

export class AuthModule {
  private client = RedisService.getInstance().getClient();

  /** Store JWT token with TTL */
  async storeToken(token: string, userId: string, options?: TokenOptions): Promise<void> {
    try {
      const key = `jwt:${token}`;

      if (options?.ttl) {
        await this.client.setex(key, options.ttl, userId)
      } else {
        await this.client.set(key, userId)
      }

      logInfo(`JWT stored for user ${userId}`);
    } catch (err) {
      logError('JWT store failed', err);
      throw err;
    }
  }

  /** Validate JWT token */
  async validateToken(token: string): Promise<string | null> {
    try {
      const userId = await this.client.get(`jwt:${token}`);
      logInfo(`JWT validated for token`);
      return userId;
    } catch (err) {
      logError('JWT validate failed', err);
      throw err;
    }
  }

  /** Delete JWT token (logout/invalidate) */
  async deleteToken(token: string): Promise<void> {
    try {
      await this.client.del(`jwt:${token}`);
      logInfo(`JWT deleted`);
    } catch (err) {
      logError('JWT delete failed', err);
      throw err;
    }
  }

  /** Store session data with TTL */
  async storeSession(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    try {
      await this.client.set(`session:${sessionId}`, JSON.stringify(data), 'EX', ttl);
      logInfo(`Session stored: ${sessionId}`);
    } catch (err) {
      logError('Session store failed', err);
      throw err;
    }
  }

  /** Get session data */
  async getSession<T = SessionData>(sessionId: string): Promise<T | null> {
    try {
      const data = await this.client.get(`session:${sessionId}`);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logError('Session get failed', err);
      throw err;
    }
  }

  /** Delete session */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.client.del(`session:${sessionId}`);
      logInfo(`Session deleted: ${sessionId}`);
    } catch (err) {
      logError('Session delete failed', err);
      throw err;
    }
  }

  /** Refresh token rotation mechanism */
  async rotateRefreshToken(oldToken: string, newToken: string, userId: string, ttl: number): Promise<void> {
    const pipeline = this.client.pipeline();
    pipeline.del(`refresh:${oldToken}`);
    pipeline.set(`refresh:${newToken}`, userId, 'EX', ttl);
    try {
      await pipeline.exec();
      logInfo('Refresh token rotated');
    } catch (err) {
      logError('Refresh token rotation failed', err);
      throw err;
    }
  }

  /** Validate refresh token */
  async validateRefreshToken(token: string): Promise<string | null> {
    try {
      return await this.client.get(`refresh:${token}`);
    } catch (err) {
      logError('Refresh token validate failed', err);
      throw err;
    }
  }

  /** Cleanup expired tokens (handled by Redis, but method for manual cleanup if needed) */
  async cleanupTokens(pattern = 'jwt:*'): Promise<number> {
    let cursor = '0';
    let deleted = 0;
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    logInfo(`Manual token cleanup done for pattern ${pattern}`);
    return deleted;
  }
}

export const authModule = new AuthModule();

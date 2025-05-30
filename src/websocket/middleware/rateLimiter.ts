import type { Socket } from 'socket.io';
import { RateLimiterModule } from '../../redis/modules/rateLimiter.js';
import logger from '../../utils/logger.js';

interface SocketRateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
}

export class SocketRateLimiter {
  private rateLimiter: RateLimiterModule;
  private windowMs: number;
  private maxRequests: number;

  constructor(options: SocketRateLimiterOptions = {}) {
    this.rateLimiter = new RateLimiterModule();
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 30; // 30 requests per minute
  }

  public createMiddleware() {
    return async (socket: Socket, next: (err?: Error) => void) => {
      try {
        // Rate limiting will be applied per-event in event handlers
        // This middleware just sets up the rate limiter on the socket
        (socket as Socket & { rateLimiter?: SocketRateLimiter }).rateLimiter = this;
        next();
      } catch (error) {
        logger.error('Socket rate limiter setup error:', error);
        next();
      }
    };
  }

  public async checkEventLimit(socket: Socket, event: string): Promise<boolean> {
    try {
      const userId = (socket as Socket & { userId?: string }).userId;
      if (!userId) return true; // Allow if no user ID

      const key = `${userId}:${event}`;
      const result = await this.rateLimiter.fixedWindow(key, {
        window: this.windowMs,
        max: this.maxRequests,
        keyPrefix: 'socket'
      });
      
      if (!result.allowed) {
        logger.warn(`Rate limit exceeded for user ${userId} on event ${event}`);
        socket.emit('rate_limit_exceeded', {
          event,
          retryAfter: this.windowMs / 1000,
          limit: this.maxRequests,
          remaining: result.remaining
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Rate limit check error:', error);
      return true; // Allow on error
    }
  }

  public async checkLimit(userId: string, event: string): Promise<boolean> {
    try {
      const key = `${userId}:${event}`;
      const result = await this.rateLimiter.fixedWindow(key, {
        window: this.windowMs,
        max: this.maxRequests,
        keyPrefix: 'socket'
      });
      return result.allowed;
    } catch (error) {
      logger.error('Rate limit check error:', error);
      return true; // Allow on error
    }
  }
}

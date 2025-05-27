import { Redis as RedisClient, type ChainableCommander } from 'ioredis';
import config from './config.js';
import { RedisConnectionError } from './errors.js';
import { logError, logInfo } from './logger.js';

export class RedisService {
  private static instance: RedisService;
  public client: RedisClient;

  private constructor() {
    try {
      this.client = new RedisClient({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
        tls: config.tls ? {} : undefined,
        enableOfflineQueue: config.enableOfflineQueue,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
      });
      this.client.on('connect', () => logInfo('Redis connected'));
      this.client.on('error', (err) => logError('Redis error', err));
      this.client.on('close', () => logInfo('Redis connection closed'));
    } catch (err) {
      logError('Redis connection failed', err);
      throw new RedisConnectionError('Failed to initialize Redis');
    }
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public getClient(): RedisClient {
    return this.client;
  }

  public pipeline(): ChainableCommander {
    return this.client.pipeline();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (err) {
      logError('Redis health check failed', err);
      return false;
    }
  }
}

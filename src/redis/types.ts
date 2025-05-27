import { Redis } from 'ioredis';

export type RedisClient = Redis;

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export interface RateLimitOptions {
  window: number;
  max: number;
  strategy?: 'fixed' | 'sliding' | 'token-bucket';
  keyPrefix?: string;
}

export interface SessionData {
  userId: string;
  expiresAt: number;
  [key: string]: unknown;
}

export interface LockOptions {
  ttl: number;
}

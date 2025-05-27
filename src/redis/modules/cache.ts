import { RedisService } from '../RedisService.js';
import type { CacheOptions } from '../types.js';
import { logInfo, logError } from '../logger.js';

export class CacheModule {
  private client = RedisService.getInstance().getClient();

  /**
   * Set cache value
   */
  async set(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    try {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (options?.ttl) {
        await this.client.set(key, strValue, 'EX', options.ttl);
      } else {
        await this.client.set(key, strValue);
      }
      if (options?.tags) {
        for (const tag of options.tags) {
          await this.client.sadd(`tag:${tag}`, key);
        }
      }
      logInfo(`Cache set for key: ${key}`);
    } catch (err) {
      logError('Cache set failed', err);
      throw err;
    }
  }

  /**
   * Get cache value
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (err) {
      logError('Cache get failed', err);
      throw err;
    }
  }

  /**
   * Delete cache by key
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      logInfo(`Cache deleted for key: ${key}`);
    } catch (err) {
      logError('Cache del failed', err);
      throw err;
    }
  }

  /**
   * Delete by pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    logInfo(`Cache deleted by pattern: ${pattern}`);
    return deleted;
  }

  /**
   * Delete by tag
   */
  async delByTag(tag: string): Promise<number> {
    const keys = await this.client.smembers(`tag:${tag}`);
    if (keys.length) {
      await this.client.del(...keys);
      await this.client.del(`tag:${tag}`);
    }
    logInfo(`Cache deleted by tag: ${tag}`);
    return keys.length;
  }

  /**
   * Memoize function result
   */
  memoize<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    keyGen: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGen(...args);
      const cached = await this.get(key);
      if (cached !== null) return cached;
      const result = await fn(...args);
      await this.set(key, result, options);
      return result;
    }) as T;
  }

  /**
   * Cache warming (preload keys)
   */
  async warm(keys: string[], fetcher: (key: string) => Promise<unknown>, options?: CacheOptions): Promise<void> {
    for (const key of keys) {
      const exists = await this.client.exists(key);
      if (!exists) {
        const value = await fetcher(key);
        await this.set(key, value, options);
      }
    }
    logInfo('Cache warming completed');
  }
}

export const cacheModule = new CacheModule();

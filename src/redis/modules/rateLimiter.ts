import { RedisService } from '../RedisService.js';
import type { RateLimitOptions } from '../types.js';
import { logInfo, logError } from '../logger.js';

export class RateLimiterModule {
  private client = RedisService.getInstance().getClient();

  /**
   * Fixed window rate limiting
   */
  async fixedWindow(key: string, options: RateLimitOptions): Promise<{ allowed: boolean; remaining: number }> {
    const windowKey = `${options.keyPrefix || 'fw'}:${key}:${Math.floor(Date.now() / options.window)}`;
    try {
      const count = await this.client.incr(windowKey);
      if (count === 1) {
        await this.client.expire(windowKey, Math.ceil(options.window / 1000));
      }
      logInfo(`Fixed window rate limit check for ${key}: ${count}/${options.max}`);
      return { allowed: count <= options.max, remaining: Math.max(0, options.max - count) };
    } catch (err) {
      logError('Fixed window rate limiting failed', err);
      return { allowed: true, remaining: options.max };
    }
  }

  /**
   * Sliding window rate limiting
   */
  async slidingWindow(key: string, options: RateLimitOptions): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - options.window;
    const listKey = `${options.keyPrefix || 'sw'}:${key}`;
    try {
      await this.client.zremrangebyscore(listKey, 0, windowStart);
      await this.client.zadd(listKey, now, `${now}`);
      await this.client.expire(listKey, Math.ceil(options.window / 1000));
      const count = await this.client.zcount(listKey, windowStart, now);
      logInfo(`Sliding window rate limit check for ${key}: ${count}/${options.max}`);
      return { allowed: count <= options.max, remaining: Math.max(0, options.max - count) };
    } catch (err) {
      logError('Sliding window rate limiting failed', err);
      return { allowed: true, remaining: options.max };
    }
  }

  /**
   * Token bucket rate limiting
   */
  async tokenBucket(key: string, options: RateLimitOptions): Promise<{ allowed: boolean; tokens: number }> {
    const bucketKey = `${options.keyPrefix || 'tb'}:${key}`;
    const maxTokens = options.max;
    const refillRate = maxTokens / (options.window / 1000); // tokens per second
    try {
      const lua = `
        local tokens = redis.call('get', KEYS[1])
        if tokens == false then tokens = tonumber(ARGV[1]) else tokens = tonumber(tokens) end
        local last = redis.call('get', KEYS[2])
        if last == false then last = tonumber(ARGV[2]) else last = tonumber(last) end
        local now = tonumber(ARGV[3])
        local rate = tonumber(ARGV[4])
        local delta = math.max(0, now - last)
        tokens = math.min(tokens + delta * rate, tonumber(ARGV[1]))
        if tokens < 1 then
          redis.call('set', KEYS[1], tokens)
          redis.call('set', KEYS[2], now)
          return {0, tokens}
        else
          tokens = tokens - 1
          redis.call('set', KEYS[1], tokens)
          redis.call('set', KEYS[2], now)
          return {1, tokens}
        end
      `;
      const tokensKey = bucketKey;
      const lastKey = `${bucketKey}:last`;
      const now = Math.floor(Date.now() / 1000);
      const res = await this.client.eval(lua, 2, tokensKey, lastKey, maxTokens, now, now, refillRate) as [number, number];
      logInfo(`Token bucket rate limit check for ${key}: allowed=${!!res[0]}, tokens=${res[1]}`);
      return { allowed: !!res[0], tokens: res[1] };
    } catch (err) {
      logError('Token bucket rate limiting failed', err);
      return { allowed: true, tokens: options.max };
    }
  }
}

export const rateLimiterModule = new RateLimiterModule();

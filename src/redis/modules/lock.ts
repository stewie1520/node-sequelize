import { RedisService } from '../RedisService.js';
import type { LockOptions } from '../types.js';
import { logInfo, logError } from '../logger.js';

export class LockModule {
  private client = RedisService.getInstance().getClient();

  /**
   * Acquire a distributed lock
   */
  async acquireLock(key: string, options: LockOptions): Promise<boolean> {
    try {
      const res = await this.client.set(key, 'locked', 'PX', options.ttl, 'NX');
      logInfo(`Lock acquire attempt for ${key}: ${!!res}`);
      return !!res;
    } catch (err) {
      logError('Lock acquire failed', err);
      throw err;
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(key);
      logInfo(`Lock released for ${key}`);
    } catch (err) {
      logError('Lock release failed', err);
      throw err;
    }
  }
}

export const lockModule = new LockModule();

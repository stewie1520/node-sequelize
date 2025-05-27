import { RedisService } from '../RedisService.js';
import { logInfo, logError } from '../logger.js';

export class QueueModule {
  private client = RedisService.getInstance().getClient();

  /**
   * Enqueue a job
   */
  async enqueue(queue: string, job: object | string): Promise<void> {
    try {
      const value = typeof job === 'string' ? job : JSON.stringify(job);
      await this.client.rpush(queue, value);
      logInfo(`Job enqueued to ${queue}`);
    } catch (err) {
      logError('Enqueue failed', err);
      throw err;
    }
  }

  /**
   * Dequeue a job
   */
  async dequeue<T = unknown>(queue: string): Promise<T | null> {
    try {
      const data = await this.client.lpop(queue);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (err) {
      logError('Dequeue failed', err);
      throw err;
    }
  }

  /**
   * Queue length
   */
  async length(queue: string): Promise<number> {
    try {
      return await this.client.llen(queue);
    } catch (err) {
      logError('Queue length failed', err);
      throw err;
    }
  }
}

export const queueModule = new QueueModule();

import { RedisService } from '../RedisService.js';
import { logInfo, logError } from '../logger.js';
import Redis from 'ioredis';

export class PubSubModule {
  private pub: Redis.Redis;
  private sub: Redis.Redis;

  constructor() {
    // Use separate connections for pub/sub
    const service = RedisService.getInstance();
    this.pub = service.getClient().duplicate();
    this.sub = service.getClient().duplicate();
  }

  async publish(channel: string, message: string | object): Promise<number> {
    try {
      const msg = typeof message === 'string' ? message : JSON.stringify(message);
      const count = await this.pub.publish(channel, msg);
      logInfo(`Published to ${channel}`);
      return count;
    } catch (err) {
      logError('Publish failed', err);
      throw err;
    }
  }

  async subscribe(channel: string, handler: (msg: string) => void): Promise<void> {
    try {
      this.sub.on('message', (ch, msg) => {
        if (ch === channel) handler(msg);
      });
      await this.sub.subscribe(channel);
      logInfo(`Subscribed to ${channel}`);
    } catch (err) {
      logError('Subscribe failed', err);
      throw err;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.sub.unsubscribe(channel);
      logInfo(`Unsubscribed from ${channel}`);
    } catch (err) {
      logError('Unsubscribe failed', err);
      throw err;
    }
  }
}

export const pubSubModule = new PubSubModule();

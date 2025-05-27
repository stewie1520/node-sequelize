import { RedisService } from '../RedisService.js';
import { logInfo, logError } from '../logger.js';

export class MetricsModule {
  private client = RedisService.getInstance().getClient();

  /**
   * Increment a metric counter
   */
  async increment(metric: string, value: number = 1): Promise<void> {
    try {
      await this.client.incrby(`metrics:${metric}`, value);
      logInfo(`Metric incremented: ${metric} by ${value}`);
    } catch (err) {
      logError('Metric increment failed', err);
      throw err;
    }
  }

  /**
   * Get metric value
   */
  async get(metric: string): Promise<number> {
    try {
      const val = await this.client.get(`metrics:${metric}`);
      return Number(val) || 0;
    } catch (err) {
      logError('Metric get failed', err);
      throw err;
    }
  }
}

export const metricsModule = new MetricsModule();

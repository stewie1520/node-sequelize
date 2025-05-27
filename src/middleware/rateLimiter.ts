import { rateLimiterModule } from '../redis/index.js';
import type { Context, Next } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo'

// Rate limit options (customize as needed)
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100; // per window

export async function rateLimiter(ctx: Context, next: Next) {
  const info = getConnInfo(ctx);
  const ip = info.remote.address || 'unknown';

  const { allowed, remaining } = await rateLimiterModule.slidingWindow(ip, {
    window: WINDOW_MS,
    max: MAX_REQUESTS,
    keyPrefix: 'global',
  });
  ctx.res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  ctx.res.headers.set('X-RateLimit-Remaining', String(remaining));
  if (!allowed) {
    return ctx.json({ message: 'Too many requests, please try again later.' }, 429);
  }
  await next();
}

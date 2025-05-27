import { rateLimiterModule } from '../../../src/redis';

describe('RateLimiterModule', () => {
  const key = 'test:ratelimit';
  const options = { window: 1000, max: 2 };

  it('should allow up to max in fixed window', async () => {
    const r1 = await rateLimiterModule.fixedWindow(key, options);
    const r2 = await rateLimiterModule.fixedWindow(key, options);
    const r3 = await rateLimiterModule.fixedWindow(key, options);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
  });

  it('should allow up to max in sliding window', async () => {
    const r1 = await rateLimiterModule.slidingWindow(key, options);
    const r2 = await rateLimiterModule.slidingWindow(key, options);
    const r3 = await rateLimiterModule.slidingWindow(key, options);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
  });

  it('should allow up to max in token bucket', async () => {
    const r1 = await rateLimiterModule.tokenBucket(key, options);
    const r2 = await rateLimiterModule.tokenBucket(key, options);
    const r3 = await rateLimiterModule.tokenBucket(key, options);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
  });
});

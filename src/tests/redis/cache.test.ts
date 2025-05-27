import { cacheModule } from '../../../src/redis';

describe('CacheModule', () => {
  const key = 'test:key';
  const value = { foo: 'bar' };

  afterAll(async () => {
    await cacheModule.del(key);
  });

  it('should set and get a value', async () => {
    await cacheModule.set(key, value, { ttl: 10 });
    const result = await cacheModule.get(key);
    expect(result).toEqual(value);
  });

  it('should delete a value', async () => {
    await cacheModule.set(key, value, { ttl: 10 });
    await cacheModule.del(key);
    const result = await cacheModule.get(key);
    expect(result).toBeNull();
  });

  it('should memoize a function', async () => {
    let called = 0;
    const fn = async (id: string) => {
      called++;
      return { id };
    };
    const memoized = cacheModule.memoize(fn, (id) => `memo:${id}`, { ttl: 10 });
    await memoized('a');
    await memoized('a');
    expect(called).toBe(1);
  });
});

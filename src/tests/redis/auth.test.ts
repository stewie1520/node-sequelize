import { authModule } from '../../../src/redis';

const token = 'test.jwt.token';
const userId = 'user123';
const sessionId = 'sess123';
const sessionData = { userId, expiresAt: Date.now() + 10000 };


describe('AuthModule', () => {
  afterAll(async () => {
    await authModule.deleteToken(token);
    await authModule.deleteSession(sessionId);
  });

  it('should store and validate a JWT token', async () => {
    await authModule.storeToken(token, userId, { ttl: 5 });
    const res = await authModule.validateToken(token);
    expect(res).toBe(userId);
  });

  it('should delete a JWT token', async () => {
    await authModule.storeToken(token, userId, { ttl: 5 });
    await authModule.deleteToken(token);
    const res = await authModule.validateToken(token);
    expect(res).toBeNull();
  });

  it('should store and get a session', async () => {
    await authModule.storeSession(sessionId, sessionData, 5);
    const res = await authModule.getSession(sessionId);
    expect(res?.userId).toBe(userId);
  });

  it('should delete a session', async () => {
    await authModule.storeSession(sessionId, sessionData, 5);
    await authModule.deleteSession(sessionId);
    const res = await authModule.getSession(sessionId);
    expect(res).toBeNull();
  });

  it('should rotate and validate refresh token', async () => {
    const oldToken = 'old.refresh.token';
    const newToken = 'new.refresh.token';
    await authModule.rotateRefreshToken(oldToken, newToken, userId, 5);
    const oldRes = await authModule.validateRefreshToken(oldToken);
    const newRes = await authModule.validateRefreshToken(newToken);
    expect(oldRes).toBeNull();
    expect(newRes).toBe(userId);
  });
});

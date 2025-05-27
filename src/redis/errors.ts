export class RedisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisError';
  }
}

export class RedisConnectionError extends RedisError {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConnectionError';
  }
}

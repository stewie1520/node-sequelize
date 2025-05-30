import type { ServerOptions } from "socket.io";

export const socketConfig: Partial<ServerOptions> = {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowRequest: (req: unknown, callback: CallableFunction) => {
    // Additional security checks can be added here
    callback(null, true);
  },
};

export const redisAdapterConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
} as const;

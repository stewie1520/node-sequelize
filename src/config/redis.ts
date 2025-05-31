import dotenv from "dotenv";
dotenv.config();

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: boolean;
  enableOfflineQueue?: boolean;
}

export const config: RedisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
  tls: !!process.env.REDIS_TLS,
  enableOfflineQueue: process.env.REDIS_OFFLINE_QUEUE !== "false",
};

import type { ServerType } from "@hono/node-server";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { v7 as uuidv7 } from "uuid";
import { socketConfig } from "../config/socket.js";
import { RedisService } from "../redis/RedisService.js";
import logger from "../utils/logger.js";

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;
  private redisService: RedisService;

  private constructor() {
    this.redisService = RedisService.getInstance();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(httpServer: ServerType): Server {
    if (this.io) {
      return this.io;
    }

    try {
      this.io = new Server(httpServer, socketConfig);
      this.io.engine.generateId = () => uuidv7();
      this.setupRedisAdapter();

      logger.info("Socket.IO server initialized successfully");
      return this.io;
    } catch (error) {
      logger.error("Failed to initialize Socket.IO server:", error);
      throw error;
    }
  }

  private setupRedisAdapter(): void {
    if (!this.io) return;

    try {
      // Create dedicated Redis clients for pub/sub
      const pubClient = this.redisService.getClient().duplicate();
      const subClient = this.redisService.getClient().duplicate();

      this.io.adapter(createAdapter(pubClient, subClient));

      logger.info("Redis adapter configured for Socket.IO");
    } catch (error) {
      logger.error("Failed to setup Redis adapter:", error);
      throw error;
    }
  }

  public getConnectedUsers(): number {
    return this.io?.engine.clientsCount || 0;
  }
}

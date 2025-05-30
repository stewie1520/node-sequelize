import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '../redis/RedisService.js';
import { socketConfig } from '../config/socket.js';
import logger from '../utils/logger.js';
import type { Server } from 'node:http';

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
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

  public initialize(server: Server): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    try {
      // Create Socket.IO server
      this.io = new SocketIOServer(server, socketConfig);

      // Setup Redis adapter for horizontal scaling
      this.setupRedisAdapter();

      logger.info('Socket.IO server initialized successfully');
      return this.io;
    } catch (error) {
      logger.error('Failed to initialize Socket.IO server:', error);
      throw error;
    }
  }

  private setupRedisAdapter(): void {
    if (!this.io) return;

    try {
      // Create dedicated Redis clients for pub/sub
      const pubClient = this.redisService.getClient().duplicate();
      const subClient = this.redisService.getClient().duplicate();

      // Setup Redis adapter
      this.io.adapter(createAdapter(pubClient, subClient));

      logger.info('Redis adapter configured for Socket.IO');
    } catch (error) {
      logger.error('Failed to setup Redis adapter:', error);
      throw error;
    }
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }
    return this.io;
  }

  public async emitToUser(userId: string, event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      logger.debug(`Event '${event}' emitted to user ${userId}`);
    } catch (error) {
      logger.error(`Failed to emit event to user ${userId}:`, error);
    }
  }

  public async emitToWorkspace(workspaceId: string, event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    
    try {
      this.io.to(`workspace:${workspaceId}`).emit(event, data);
      logger.debug(`Event '${event}' emitted to workspace ${workspaceId}`);
    } catch (error) {
      logger.error(`Failed to emit event to workspace ${workspaceId}:`, error);
    }
  }

  public async broadcastToAll(event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    
    try {
      this.io.emit(event, data);
      logger.debug(`Event '${event}' broadcasted to all connected clients`);
    } catch (error) {
      logger.error('Failed to broadcast event:', error);
    }
  }

  public getConnectedUsers(): number {
    return this.io?.engine.clientsCount || 0;
  }

  public async disconnectUser(userId: string): Promise<void> {
    if (!this.io) return;

    try {
      const sockets = await this.io.in(`user:${userId}`).fetchSockets();
      sockets.forEach(socket => socket.disconnect(true));
      logger.info(`Disconnected user ${userId}`);
    } catch (error) {
      logger.error(`Failed to disconnect user ${userId}:`, error);
    }
  }
}

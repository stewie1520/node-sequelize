import type { Server } from 'socket.io';
import { SocketService } from './SocketService.js';
import { authenticateSocket } from './middleware/auth.js';
import type { AuthenticatedSocket } from './middleware/auth.js';
import { SocketRateLimiter } from './middleware/rateLimiter.js';
import { ConnectionHandler } from './handlers/connectionHandler.js';
import { WorkspaceHandler } from './handlers/workspaceHandler.js';
import { NotificationHandler } from './handlers/notificationHandler.js';
import logger from '../utils/logger.js';

export class WebSocketManager {
  private io: Server;
  private connectionHandler: ConnectionHandler;
  private workspaceHandler: WorkspaceHandler;
  private notificationHandler: NotificationHandler;
  private rateLimiter: SocketRateLimiter;

  constructor(io: Server) {
    this.io = io;
    this.connectionHandler = new ConnectionHandler(io);
    this.workspaceHandler = new WorkspaceHandler(io);
    this.notificationHandler = new NotificationHandler(io);
    this.rateLimiter = new SocketRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 30   // 30 events per minute per user
    });
  }

  public initialize(): void {
    // Apply authentication middleware
    this.io.use(authenticateSocket);

    // Apply rate limiting middleware
    this.io.use(this.rateLimiter.createMiddleware());

    // Handle connections
    this.io.on('connection', (socket) => {
      const authenticatedSocket = socket as AuthenticatedSocket;
      
      // Setup connection handling
      this.connectionHandler.handleConnection(authenticatedSocket);
      
      // Setup feature-specific handlers
      this.workspaceHandler.setupHandlers(authenticatedSocket);
      this.notificationHandler.setupHandlers(authenticatedSocket);
      
      logger.info(`Socket connected: ${socket.id} for user ${authenticatedSocket.userId}`);
    });

    // Setup error handling
    this.io.engine.on('connection_error', (err) => {
      logger.error('Socket connection error:', err);
    });

    logger.info('WebSocket manager initialized successfully');
  }

  public getNotificationHandler(): NotificationHandler {
    return this.notificationHandler;
  }

  public getSocketService(): SocketService {
    return SocketService.getInstance();
  }
}

import type { Server } from "socket.io";
import logger from "../utils/logger.js";
import { ConnectionHandler } from "./handlers/connectionHandler.js";
import { NotificationHandler } from "./handlers/notificationHandler.js";
import { WorkspaceHandler } from "./handlers/workspaceHandler.js";
import type { AuthenticatedSocket } from "./middleware/auth.js";
import { authenticateSocket } from "./middleware/auth.js";
import { SocketRateLimiter } from "./middleware/rateLimiter.js";

export class WebSocketManager {
  private io: Server;
  private connectionHandler: ConnectionHandler;
  private workspaceHandler: WorkspaceHandler;
  private notificationHandler: NotificationHandler;
  private rateLimiter: SocketRateLimiter;

  constructor(io: Server) {
    this.io = io;

    this.connectionHandler = new ConnectionHandler();
    this.workspaceHandler = new WorkspaceHandler(io);
    this.notificationHandler = new NotificationHandler(io);

    this.rateLimiter = new SocketRateLimiter({
      windowMs: 60000,
      maxRequests: 30,
    });
  }

  public initialize(): void {
    this.io.use(authenticateSocket);
    this.io.use(this.rateLimiter.createMiddleware());

    this.io.on("connection", (socket) => {
      const authenticatedSocket = socket as AuthenticatedSocket;

      this.connectionHandler.setupHandlers(authenticatedSocket);
      this.workspaceHandler.setupHandlers(authenticatedSocket);
      this.notificationHandler.setupPubSubListeners();

      logger.info(
        `Socket connected: ${socket.id} for user ${authenticatedSocket.userId}`,
      );
    });

    this.io.engine.on("connection_error", (err) => {
      logger.error("Socket connection error:", err);
    });

    logger.info("WebSocket manager initialized successfully");
  }
}

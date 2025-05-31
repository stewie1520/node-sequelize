import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "node:http";

import { app as appConfig } from "./config/app.js";
import { requestLogger } from "./middleware/logger.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { sequelize } from "./models/index.js";
import router from "./routes/index.js";
import logger from "./utils/logger.js";
import { handleControllerError } from "./utils/validation.js";
import { RedisService } from "./redis/RedisService.js";
import { SocketService, WebSocketManager } from "./websocket/index.js";
import { RealtimeService } from "./services/business/RealtimeService.js";
import { createContext } from "./middleware/createContext.js";

const init = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");
    await RedisService.getInstance().healthCheck();
    logger.info("Redis connection has been established successfully.");
  } catch (error) {
    logger.error(`Unable to connect to the database or redis: ${error}`);
    process.exit(1);
  }
};

const app = new Hono();

app.use("*", createContext);
app.use("*", requestLogger);
app.use("*", rateLimiter);
app.use("*", cors());

// Mount API routes
app.route("/api", router);

// Catch-all route for 404
app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  return handleControllerError(c, err);
});

// Initialize database before starting the server
init().then(() => {
  // Create HTTP server for Socket.IO
  const server = createServer();

  // Initialize WebSocket first
  const socketService = SocketService.getInstance();
  const io = socketService.initialize(server);
  const wsManager = new WebSocketManager(io);
  wsManager.initialize();

  // Setup real-time service
  const realtimeService = RealtimeService.getInstance();
  realtimeService.setNotificationHandler(wsManager.getNotificationHandler());

  // Start HTTP server for API using serve from @hono/node-server
  serve(
    {
      fetch: app.fetch,
      port: appConfig.port,
    },
    (info) => {
      logger.info(
        `HTTP API Server is running on http://localhost:${info.port}`,
      );
    },
  );

  // Start WebSocket server on a different port for clarity
  const wsPort = appConfig.port + 1;
  server.listen(wsPort, () => {
    logger.info(`WebSocket server is running on ws://localhost:${wsPort}`);
  });
});

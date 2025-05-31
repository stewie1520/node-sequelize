import { serve, type ServerType } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import cfonts from "cfonts";

import { app as appConfig } from "./config/app.js";
import { createContext } from "./middleware/createContext.js";
import { requestLogger } from "./middleware/logger.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { sequelize } from "./models/index.js";
import { RedisService } from "./redis/RedisService.js";
import router from "./routes/index.js";
import logger from "./utils/logger.js";
import { handleControllerError } from "./utils/validation.js";
import { SocketService, WebSocketManager } from "./websocket/index.js";

const initStorages = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    await RedisService.getInstance().healthCheck();
  } catch (error) {
    logger.error(`Unable to connect to the database or redis: ${error}`);
    process.exit(1);
  }
};

const initWebsocket = async (httpServer: ServerType) => {
  const socketService = SocketService.getInstance();
  const io = socketService.initialize(httpServer);
  const wsManager = new WebSocketManager(io);
  wsManager.initialize();
};

const initHttpServer = () =>
  new Promise<ServerType>((resolve) => {
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

    const httpServer = serve(
      {
        fetch: app.fetch,
        port: appConfig.port,
      },
      (info) => {
        logger.info(
          `HTTP API Server is running on http://localhost:${info.port}`,
        );

        resolve(httpServer);
      },
    );
  });

initStorages()
  .then(initHttpServer)
  .then(initWebsocket)
  .then(() => {
    cfonts.say("STARTED", {
      font: "block",
      align: "left",
      colors: ["system"],
      background: "transparent",
      letterSpacing: 1,
      lineHeight: 1,
      space: true,
      maxLength: "0",
      gradient: false,
      independentGradient: false,
      transitionGradient: false,
      rawMode: false,
      env: "node",
    });
  });

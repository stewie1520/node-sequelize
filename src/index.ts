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
      font: "block", // define the font face
      align: "left", // define text alignment
      colors: ["system"], // define all colors
      background: "transparent", // define the background color, you can also use `backgroundColor` here as key
      letterSpacing: 1, // define letter spacing
      lineHeight: 1, // define the line height
      space: true, // define if the output text should have empty lines on top and on the bottom
      maxLength: "0", // define how many character can be on one line
      gradient: false, // define your two gradient colors
      independentGradient: false, // define if you want to recalculate the gradient for each new line
      transitionGradient: false, // define if this is a transition between colors directly
      rawMode: false, // define if the line breaks should be CRLF (`\r\n`) over the default LF (`\n`)
      env: "node",
    });
  });

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { app as appConfig } from "./config/app.js";
import { requestLogger } from "./middleware/logger.js";
import { sequelize } from "./models/index.js";
import router from "./routes/index.js";
import logger from "./utils/logger.js";
import { handleControllerError } from "./utils/validation.js";

// Initialize Sequelize
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");
  } catch (error) {
    logger.error(`Unable to connect to the database: ${error}`);
  }
};

const app = new Hono();

app.use("*", requestLogger);
app.use("*", cors());

// Redirect root to auth page
app.get('/', (c) => c.redirect('/auth'));

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
initDatabase().then(() => {
  serve(
    {
      fetch: app.fetch,
      port: appConfig.port,
    },
    (info) => {
      logger.info(`Server is running on http://localhost:${info.port}`);
      logger.info(
        `API Documentation available at http://localhost:${info.port}/api`,
      );
    },
  );
});

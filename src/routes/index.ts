import { Hono } from "hono";

import adminRouter from "./admin.js";
import authRouter from "./auth.js";
import websocketRouter from "./websocket.js";
import workspaceRouter from "./workspace.js";

const router = new Hono();

// Root route for API health check
router.get("/", (c) => {
  return c.json({ message: "API is running" });
});

// Mount routes
router.route("/admin", adminRouter);
router.route("/auth", authRouter);
router.route("/workspace", workspaceRouter);
router.route("/websocket", websocketRouter);

export default router;

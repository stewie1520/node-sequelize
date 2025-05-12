import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { electric as electricConfig } from "../config/electric.js";
import { authenticate } from "../middleware/auth.js";
import { createWorkspaceSchema } from "../schemas/workspace.js";
import UserWorkspaceService from "../services/UserWorkspaceService.js";

const workspaceRouter = new Hono();

/**
 * @route POST /workspace
 * @desc Create new workspaceRouter
 * @access Private
 */
workspaceRouter.post("/", authenticate, zValidator('json', createWorkspaceSchema), async (c) => {
  const userId = c.get("user").id;

  const workspace = await UserWorkspaceService.createWorkspace(userId, c.req.valid('json'));

  return c.json({
    success: true,
    data: {
      id: workspace.id,
    },
  });
});

/**
 * @route GET /workspace/shape
 * @desc  Fetch shape
 * @access Private
 */
workspaceRouter.get("/shape", authenticate, async (c) => {
  const url = new URL(c.req.url);
  // Construct the upstream URL
  const originUrl = new URL(electricConfig.url);

  // Copy over the relevant query params that the Electric client adds
  // so that we return the right part of the Shape log.
  url.searchParams.forEach((value, key) => {
    if ([`live`, `handle`, `offset`, `cursor`].includes(key)) {
      originUrl.searchParams.set(key, value);
    }
  });

  originUrl.searchParams.set(`table`, `workspaces`);

  const userId = c.get("user").id;

  originUrl.searchParams.set(
    `where`,
    `"authorId" = '${encodeURIComponent(userId)}'`,
  );

  const response = await fetch(originUrl);

  // Fetch decompresses the body but doesn't remove the
  // content-encoding & content-length headers which would
  // break decoding in the browser.
  //
  // See https://github.com/whatwg/fetch/issues/1729
  const headers = new Headers(response.headers);
  headers.delete(`content-encoding`);
  headers.delete(`content-length`);

  c.res = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});

export default workspaceRouter;

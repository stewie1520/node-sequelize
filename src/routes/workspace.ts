import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { authenticate } from '../middleware/auth.js';
import { createWorkspaceSchema } from '../schemas/workspace.js';
import UserWorkspaceService from '../services/UserWorkspaceService.js';

const workspaceRouter = new Hono();

/**
 * @route POST /workspace
 * @desc Create new workspace
 * @access Private
 */
workspaceRouter.post('/', authenticate, zValidator('json', createWorkspaceSchema), async (c) => {
  const userId = c.get('user').id;

  const workspace = await UserWorkspaceService.createWorkspace(userId, c.req.valid('json'));

  return c.json({
    success: true,
    data: {
      id: workspace.id,
    },
  });
});

export default workspaceRouter;

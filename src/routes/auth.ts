import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { authenticate } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "../schemas/user.js";
import UserService from "../services/UserService.js";

const authRouter = new Hono();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post("/register", zValidator('json', registerSchema), async (c) => {
    const user = await UserService.register(c.req.valid('json'));

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      201,
    );
  });

/**
 * @route POST /auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
authRouter.post("/login", zValidator('json', loginSchema), async c => {
  const { user, token } = await UserService.login(c.req.valid('json'));
  
  return c.json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
});

/**
 * @route GET /auth/profile
 * @desc Get current user profile
 * @access Private
 */
authRouter.get("/profile", authenticate, async (c) => {
  const userId = c.get("user").id;
  const user = await UserService.getUserById(userId);

  return c.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});


export default authRouter;

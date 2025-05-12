import User from "../models/User.js";
import type { LoginInput, RegisterInput } from "../schemas/user.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
import { generateToken } from "../utils/jwt.js";

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

interface GoogleUserData {
  googleId: string;
  email: string;
  name: string;
}

class UserService {
  async register(userData: RegisterInput): Promise<User> {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: {
        email: userData.email,
      },
    });
    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    // Create new user
    return await User.create(userData);
  }

  async login(credentials: LoginInput): Promise<LoginResponse> {
    // Find user by email
    const user = await User.findOne({
      where: {
        email: credentials.email,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async findOrCreateGoogleUser(googleData: GoogleUserData): Promise<LoginResponse> {
    // Check if user already exists with this Google ID
    let user = await User.findOne({
      where: { googleId: googleData.googleId }
    });

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({
        where: { email: googleData.email }
      });

      if (user) {
        // Link Google ID to existing account
        user.googleId = googleData.googleId;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name: googleData.name,
          email: googleData.email,
          googleId: googleData.googleId
        });
      }
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }
}

export default new UserService();

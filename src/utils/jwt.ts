import jwt from "jsonwebtoken";
import { config } from "../config/jwt.js";

export interface TokenPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn,
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.secret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

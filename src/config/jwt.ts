import dotenv from 'dotenv';
import type { StringValue } from 'ms';

dotenv.config();

export const config = {
  secret: process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file',
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as StringValue,
};

import { z } from 'zod';

export const revokeTokenSchema = z.object({
  jti: z.string().uuid('Invalid token ID format'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long').optional(),
});

export const revokeUserTokensSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long').optional(),
});

export const tokenStatsQuerySchema = z.object({
  includeUserBreakdown: z.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userTokensQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  includeExpired: z.boolean().default(false),
  sortBy: z.enum(['issuedAt', 'expiresAt']).default('issuedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkRevokeTokensSchema = z.object({
  tokenIds: z.array(z.string().uuid()).min(1, 'At least one token ID is required').max(100, 'Too many tokens'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});

export const loginMetadataSchema = z.object({
  userAgent: z.string().max(1000).optional(),
  ipAddress: z.string().ip().optional(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet', 'unknown']).default('unknown'),
  location: z.object({
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
  }).optional(),
});

export type RevokeTokenInput = z.infer<typeof revokeTokenSchema>;
export type RevokeUserTokensInput = z.infer<typeof revokeUserTokensSchema>;
export type TokenStatsQuery = z.infer<typeof tokenStatsQuerySchema>;
export type UserTokensQuery = z.infer<typeof userTokensQuerySchema>;
export type BulkRevokeTokensInput = z.infer<typeof bulkRevokeTokensSchema>;
export type LoginMetadata = z.infer<typeof loginMetadataSchema>;
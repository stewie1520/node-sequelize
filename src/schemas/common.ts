import { z } from 'zod';

// Param validation for IDs
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Sorting schema
export const sortSchema = z.object({
  sort_by: z.string().default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SortParams = z.infer<typeof sortSchema>;
export type SearchParams = z.infer<typeof searchSchema>;

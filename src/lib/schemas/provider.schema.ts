import { z } from 'zod';

export const ProviderSearchSchema = z.object({
  city: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'zipCode must be 5 digits or ZIP+4 format')
    .optional(),
  state: z
    .string()
    .length(2, 'state must be a 2-letter code')
    .transform((s) => s.toUpperCase())
    .optional(),
  page: z.coerce.number().int().min(1, 'page must be at least 1').default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'pageSize must be at least 1')
    .max(100, 'pageSize may not exceed 100')
    .default(20),
  sortBy: z.enum(['lastName', 'firstName', 'organizationName', 'createdAt']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ProviderSearchParams = z.infer<typeof ProviderSearchSchema>;

export const ProviderIdSchema = z.string().min(1, 'id is required');

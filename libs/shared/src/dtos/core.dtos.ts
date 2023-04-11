import { z } from 'zod';

export const DefaultResponse = z.object({
  success: z.literal(true)
});
export type DefaultResponse = z.infer<typeof DefaultResponse>;

export const PaginatedRequestDto = z.object({
  page: z.coerce.number().min(1),
  itemsPerPage: z.coerce.number()
});
export type PaginatedRequestDto = z.infer<typeof PaginatedRequestDto>;

export const PaginatedResponse = z.object({
  meta: z.object({
    totalItems: z.number(),
    nextPage: z.number().optional(),
    previousPage: z.number().optional()
  })
});
export type PaginatedResponse = z.infer<typeof PaginatedResponse>;

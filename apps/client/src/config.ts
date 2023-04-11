import z from 'zod';

const configSchema = z.object({
  API_URL: z.string()
});

export const config = configSchema.parse({
  API_URL: import.meta.env.VITE_API_URL
});

import { z } from 'zod';

export const TagSchema = z.object({
  slug: z.string()
});

export type Tag = z.infer<typeof TagSchema>;

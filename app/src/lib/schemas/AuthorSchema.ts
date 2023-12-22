import { z } from 'zod';

export const AuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
  picture: z.string(),
  bio: z.string()
});

export type Author = z.infer<typeof AuthorSchema>;

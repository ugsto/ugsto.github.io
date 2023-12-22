import { z } from 'zod';

export const PostMetadataSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  contentUrl: z.string(),
  tags: z.array(z.string()),
  authorId: z.number()
});

export type PostMetadata = z.infer<typeof PostMetadataSchema>;

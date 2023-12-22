import { z } from 'zod';

export const HateoasSchema = z.object({
  links: z.array(
    z.object({
      type: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      rel: z.string(),
      href: z.string()
    })
  )
});

export type Hateoas = z.infer<typeof HateoasSchema>;

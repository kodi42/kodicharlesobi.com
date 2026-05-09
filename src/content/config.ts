import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/posts' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    date: z.string(),        // ISO
    created: z.string(),     // ISO
    driveId: z.string(),
    readTime: z.number(),
    excerpt: z.string(),
    html: z.string(),
  }),
});

export const collections = { posts };

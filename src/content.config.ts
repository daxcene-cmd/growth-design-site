import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const article = defineCollection({
  loader: glob({
    base: './src/content/article',
    pattern: ['index.yaml', 'sections/**/*.{md,mdx}'],
  }),
  schema: z.any(),
});

const data = defineCollection({
  loader: glob({
    base: './src/content/data',
    pattern: '**/*.{json,yaml,yml}',
  }),
  schema: z.any(),
});

export const collections = { article, data };

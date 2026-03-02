import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			category: z.enum(['ai-explained', 'future-of-work', 'how-ai-works', 'ai-news', 'comparisons', 'guides']).default('guides'),
			tags: z.array(z.string()).default([]),
			readingTime: z.string().optional(),
			faqs: z.array(z.object({
				question: z.string(),
				answer: z.string(),
			})).optional(),
		}),
});

export const collections = { blog };

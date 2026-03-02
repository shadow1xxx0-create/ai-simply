// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://getaibriefs.com',
	integrations: [mdx(), sitemap()],
	build: {
		inlineStylesheets: 'auto',
	},
	compressHTML: true,
});

// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://getaibriefs.com',
	integrations: [mdx(), sitemap({
		serialize(item) {
			item.lastmod = new Date();
			return item;
		},
	})],
	build: {
		inlineStylesheets: 'auto',
	},
	compressHTML: true,
});

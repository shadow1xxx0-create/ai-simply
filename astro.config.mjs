// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://getaibriefs.com';

/**
 * Build a {pathname → lastmod ISO string} map by reading each
 * blog/tools markdown file's frontmatter (updatedDate ?? pubDate).
 * This replaces the old hand-maintained dictionary, so every article
 * gets accurate lastmod automatically.
 */
async function loadLastmodMap() {
	const map = {};

	async function indexCollection(dir, urlPrefix) {
		let files;
		try {
			files = await readdir(dir);
		} catch {
			return;
		}
		for (const file of files) {
			if (!/\.(md|mdx)$/.test(file)) continue;
			const slug = file.replace(/\.(md|mdx)$/, '');
			const raw = await readFile(join(dir, file), 'utf8');
			const fm = raw.match(/^---\s*\n([\s\S]*?)\n---/);
			if (!fm) continue;
			const updated = fm[1].match(/^updatedDate:\s*['"]?([^'"\n]+)['"]?/m);
			const pub = fm[1].match(/^pubDate:\s*['"]?([^'"\n]+)['"]?/m);
			const date = (updated?.[1] ?? pub?.[1] ?? '').trim();
			if (!date) continue;
			const iso = new Date(date).toISOString();
			map[`${urlPrefix}${slug}/`] = iso;
		}
	}

	await indexCollection('./src/content/blog', '/blog/');
	await indexCollection('./src/content/tools', '/tools/');
	return map;
}

const lastmodMap = await loadLastmodMap();

export default defineConfig({
	site: SITE,
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => {
				const pathname = new URL(page).pathname;
				// Exclude noindex'd templated pages — they dilute crawl budget.
				if (pathname.startsWith('/tools/alternatives/')) return false;
				if (pathname.startsWith('/tools/vs/')) return false;
				if (pathname.startsWith('/tools/tag/')) return false;
				return true;
			},
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				const lastmod = lastmodMap[pathname];
				if (lastmod) item.lastmod = lastmod;
				return item;
			},
		}),
	],
	build: {
		inlineStylesheets: 'auto',
	},
	compressHTML: true,
});

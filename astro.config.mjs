// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// ⚠️ IMPORTANT: Every time you publish a new article, add its slug and pubDate here.
// Format: '/blog/[slug]/': 'YYYY-MM-DD'
const articleLastmod = {
	'/blog/chatgpt-vs-claude-for-beginners/': '2026-03-01',
	'/blog/how-ai-is-eroding-your-privacy/': '2026-03-02',
	'/blog/how-to-start-ai-side-hustles-that-make-money/': '2026-03-02',
	'/blog/how-to-use-ai-at-work/': '2026-02-17',
	'/blog/is-ai-making-us-dumber-deskilling-problem/': '2026-03-11',
	'/blog/predictive-ai-surveillance-stops-watching-starts-deciding/': '2026-03-02',
	'/blog/sovereign-ai-agentic-workflows-2026/': '2026-03-07',
	'/blog/what-are-ai-hallucinations-why-ai-lies-to-you/': '2026-03-11',
	'/blog/what-are-deepfakes-how-to-spot-one/': '2026-03-13',
	'/blog/what-is-an-ai-agent-explained-simply/': '2026-02-24',
	'/blog/what-is-generative-ai/': '2026-03-12',
	'/blog/what-is-machine-learning-explained/': '2026-02-20',
	'/blog/what-is-prompt-engineering-how-to-talk-to-ai/': '2026-03-09',
	'/blog/will-ai-replace-my-job/': '2026-02-27',
	'/blog/can-ai-read-your-emotions-emotion-ai-explained/': '2026-03-16',
	'/blog/what-is-a-large-language-model-llm-explained/': '2026-03-18',
	'/blog/what-is-an-ai-reasoning-model/': '2026-03-19',
	'/blog/what-is-vibe-coding/': '2026-03-21',
};

export default defineConfig({
	site: 'https://getaibriefs.com',
	integrations: [
		mdx(),
		sitemap({
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				const lastmod = articleLastmod[pathname];
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

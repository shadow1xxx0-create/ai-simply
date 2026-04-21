/**
 * @typedef {{ title: string, link: string, date: string, source: string }} NewsItem
 */

export const RSS_FEEDS = [
	{ url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat' },
	{ url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge' },
	{ url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
	{ url: 'https://arstechnica.com/ai/feed/', source: 'Ars Technica' },
	{ url: 'https://www.wired.com/feed/tag/ai/latest/rss', source: 'Wired' },
	{ url: 'https://www.technologyreview.com/feed/', source: 'MIT Tech Review' },
	{ url: 'https://huggingface.co/blog/feed.xml', source: 'Hugging Face' },
	{ url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', source: 'IEEE Spectrum' },
];

const STOPWORDS = new Set([
	'the','a','an','is','to','of','in','on','for','with','and','or','but','by','as','at','from',
	'it','its','this','that','has','have','are','was','be','been','will','new','how','why','what',
	'who','your','you','our','can','vs','not','more','now','their','they','them','about','over',
]);

/** @param {string} title */
export function keywords(title) {
	return new Set(
		title.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(w => w.length > 2 && !STOPWORDS.has(w))
	);
}

/** @param {string} a @param {string} b */
export function similar(a, b) {
	const A = keywords(a), B = keywords(b);
	if (A.size === 0 || B.size === 0) return false;
	const inter = [...A].filter(w => B.has(w)).length;
	const union = new Set([...A, ...B]).size;
	return inter / union >= 0.4;
}

/** @param {NewsItem[]} items */
export function dedupe(items) {
	/** @type {NewsItem[]} */
	const out = [];
	for (const item of items) {
		if (!out.some(d => similar(d.title, item.title))) out.push(item);
	}
	return out;
}

/**
 * Fetch AI news from all configured RSS/Atom feeds, dedupe, sort by date desc.
 * Returns the full deduped list — callers slice as needed.
 * @returns {Promise<NewsItem[]>}
 */
export async function fetchNews() {
	const fetched = await Promise.allSettled(
		RSS_FEEDS.map(f =>
			fetch(f.url, { signal: AbortSignal.timeout(6000) })
				.then(r => r.text())
				.then(xml => ({ xml, source: f.source }))
		)
	);

	/** @type {NewsItem[]} */
	const items = [];
	for (const r of fetched) {
		if (r.status !== 'fulfilled') continue;
		const { xml, source } = r.value;
		const matches = [...xml.matchAll(/<(item|entry)[\s\S]*?<\/\1>/g)];
		for (const m of matches.slice(0, 4)) {
			const title =
				m[0].match(/<title(?:[^>]*)?><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
				m[0].match(/<title(?:[^>]*)?>([\s\S]*?)<\/title>/)?.[1] ?? '';
			const link =
				m[0].match(/<link[^>]*href="([^"]+)"/)?.[1] ??
				m[0].match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '';
			const date =
				m[0].match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ??
				m[0].match(/<published>([\s\S]*?)<\/published>/)?.[1] ??
				m[0].match(/<updated>([\s\S]*?)<\/updated>/)?.[1] ?? '';
			if (title && link) items.push({ title: title.trim(), link: link.trim(), date, source });
		}
	}
	items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return dedupe(items);
}

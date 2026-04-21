#!/usr/bin/env node
// Fetch today's AI news snapshot and write it to src/data/news/YYYY-MM-DD.json.
// Idempotent: if today's file already exists, it is overwritten with the latest snapshot.
// Used by the daily-news GitHub Actions workflow.

import { fetchNews } from '../src/utils/news.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'news');

function todayUtc() {
	return new Date().toISOString().slice(0, 10);
}

async function main() {
	const items = await fetchNews();
	if (!items.length) {
		console.error('No items fetched — aborting without write.');
		process.exit(1);
	}
	await mkdir(OUT_DIR, { recursive: true });
	const date = todayUtc();
	const outPath = join(OUT_DIR, `${date}.json`);
	const payload = { date, fetchedAt: new Date().toISOString(), items };
	await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
	console.log(`Wrote ${outPath} with ${items.length} items.`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});

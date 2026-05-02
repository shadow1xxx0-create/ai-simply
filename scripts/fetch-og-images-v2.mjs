#!/usr/bin/env node
/**
 * Strict refresh: only re-fetches tools whose existing image is the
 * branded "favicon card" (i.e., the og:image fetch failed first time)
 * OR which never got an image at all.
 *
 * Strategy stack (per tool, stops at first success):
 *   1. Direct fetch with realistic browser headers
 *   2. Microlink API metadata pull (handles Cloudflare / JS-rendered)
 *   3. Live screenshot via Microlink API
 *
 * Microlink free tier: 50 req/day, no auth required.
 */

import { readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOOLS_DIR = join(ROOT, 'src', 'content', 'tools');
const OUT_DIR = join(ROOT, 'public', 'tools');

const args = process.argv.slice(2);
const onlySlugs = args.filter(a => !a.startsWith('--'));
const refreshFavicons = args.includes('--refresh-favicons');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
const TIMEOUT_MS = 25_000;

async function fileExists(p) { try { await stat(p); return true; } catch { return false; } }

function parseFrontmatter(raw) {
	const norm = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	const m = norm.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!m) return {};
	const out = {};
	for (const line of m[1].split('\n')) {
		// only top-level keys (not indented list items / nested)
		const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
		if (!kv) continue;
		const v = kv[2].trim().replace(/^['"]|['"]$/g, '').trim();
		if (v) out[kv[1]] = v;
	}
	return out;
}

async function fetchWithTimeout(url, init = {}) {
	const ac = new AbortController();
	const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
	try {
		return await fetch(url, { ...init, signal: ac.signal, redirect: 'follow' });
	} finally { clearTimeout(t); }
}

const BROWSER_HEADERS = {
	'user-agent': UA,
	accept: ACCEPT,
	'accept-language': 'en-US,en;q=0.9',
	'accept-encoding': 'gzip, deflate, br',
	'sec-ch-ua': '"Chromium";v="124", "Not-A.Brand";v="99"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Windows"',
	'sec-fetch-dest': 'document',
	'sec-fetch-mode': 'navigate',
	'sec-fetch-site': 'none',
	'sec-fetch-user': '?1',
	'upgrade-insecure-requests': '1',
};

function extractMeta(html, ...keys) {
	for (const key of keys) {
		const re = new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${key}["'][^>]+content\\s*=\\s*["']([^"']+)["']`, 'i');
		const alt = new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${key}["']`, 'i');
		const m = html.match(re) || html.match(alt);
		if (m) return m[1];
	}
	return null;
}

async function strategy_directFetch(siteUrl) {
	const res = await fetchWithTimeout(siteUrl, { headers: BROWSER_HEADERS });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const html = (await res.text()).slice(0, 250_000);
	let img = extractMeta(html, 'og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src');
	if (!img) throw new Error('no og:image');
	try { img = new URL(img, siteUrl).href; } catch { throw new Error('bad og:image url'); }
	return img;
}

async function strategy_microlinkMeta(siteUrl) {
	const api = `https://api.microlink.io/?url=${encodeURIComponent(siteUrl)}&meta=true`;
	const res = await fetchWithTimeout(api, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`microlink HTTP ${res.status}`);
	const json = await res.json();
	if (json.status !== 'success') throw new Error(`microlink ${json.status}`);
	const img = json.data?.image?.url || json.data?.logo?.url;
	if (!img) throw new Error('microlink no image');
	return img;
}

async function strategy_microlinkScreenshot(siteUrl, outPath) {
	const api = `https://api.microlink.io/?url=${encodeURIComponent(siteUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
	const res = await fetchWithTimeout(api, { headers: { 'user-agent': UA, accept: 'image/*' } });
	if (!res.ok) throw new Error(`microlink screenshot HTTP ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length < 1000) throw new Error('screenshot too small');
	await sharp(buf, { failOn: 'none' })
		.resize(1200, 630, { fit: 'cover', position: 'top' })
		.jpeg({ quality: 80, mozjpeg: true })
		.toFile(outPath);
}

async function downloadAndOptimize(imgUrl, outPath) {
	const res = await fetchWithTimeout(imgUrl, { headers: { 'user-agent': UA, accept: 'image/*' } });
	if (!res.ok) throw new Error(`image HTTP ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length < 500) throw new Error('image too small');
	await sharp(buf, { failOn: 'none' })
		.resize(1200, 630, { fit: 'cover', position: 'attention' })
		.jpeg({ quality: 80, mozjpeg: true })
		.toFile(outPath);
}

/** Heuristic: a previously-generated favicon-card has a recognizable size/aspect — re-fetch any tool whose image is missing. */
async function isFaviconCard(jpgPath) {
	try {
		const meta = await sharp(jpgPath).metadata();
		// Real OG images vary. Favicon cards we made are exactly 1200x630 with mostly dark pixels.
		// Cheap signal: size on disk under 30KB strongly correlates with the favicon-card output.
		const st = await stat(jpgPath);
		return st.size < 30_000;
	} catch { return false; }
}

async function processTool({ slug, url }) {
	const outPath = join(OUT_DIR, `${slug}.jpg`);
	const exists = await fileExists(outPath);

	if (exists && !refreshFavicons && !onlySlugs.includes(slug)) return { slug, status: 'skip' };
	if (exists && refreshFavicons && !onlySlugs.includes(slug)) {
		const isCard = await isFaviconCard(outPath);
		if (!isCard) return { slug, status: 'skip' };
	}

	const tries = [
		['direct',     async () => downloadAndOptimize(await strategy_directFetch(url), outPath)],
		['microlink',  async () => downloadAndOptimize(await strategy_microlinkMeta(url), outPath)],
		['screenshot', async () => strategy_microlinkScreenshot(url, outPath)],
	];

	const errors = [];
	for (const [name, fn] of tries) {
		try {
			await fn();
			return { slug, status: 'ok', via: name };
		} catch (e) {
			errors.push(`${name}: ${e.message}`);
		}
	}
	return { slug, status: 'fail', error: errors.join(' | ') };
}

async function main() {
	const files = (await readdir(TOOLS_DIR)).filter(f => /\.(md|mdx)$/.test(f));
	let tools = [];
	for (const file of files) {
		const slug = file.replace(/\.(md|mdx)$/, '');
		if (onlySlugs.length && !onlySlugs.includes(slug)) continue;
		const fm = parseFrontmatter(await readFile(join(TOOLS_DIR, file), 'utf8'));
		if (!fm.url) continue;
		tools.push({ slug, url: fm.url });
	}
	console.log(`Processing ${tools.length} tools (refresh-favicons=${refreshFavicons})...`);

	let ok = 0, skip = 0, fail = 0;
	const failures = [], oks = [];
	for (const tool of tools) {
		const r = await processTool(tool);
		if (r.status === 'ok')   { ok++;  oks.push(`${r.slug} (${r.via})`); process.stdout.write(r.via === 'direct' ? '.' : r.via === 'microlink' ? 'm' : 's'); }
		else if (r.status === 'skip') { skip++; process.stdout.write('-'); }
		else                          { fail++; failures.push(r); process.stdout.write('x'); }
	}

	console.log(`\n\nDone. ok=${ok} skip=${skip} fail=${fail}`);
	if (oks.length) {
		console.log('\nFreshly fetched:');
		for (const line of oks) console.log(`  ✓ ${line}`);
	}
	if (failures.length) {
		console.log('\nStill failing:');
		for (const f of failures) console.log(`  ✗ ${f.slug}: ${f.error}`);
	}
}

main().catch(e => { console.error(e); process.exit(1); });

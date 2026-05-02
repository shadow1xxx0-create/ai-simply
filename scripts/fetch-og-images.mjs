#!/usr/bin/env node
/**
 * Fetches the og:image (or twitter:image) for every tool listed in
 * src/content/tools/*.md and downloads it to public/tools/<slug>.jpg
 * (sharp-optimized to 1200x630, the standard OG canvas).
 *
 * Falls back to favicons via the Google s2 service if no OG image is found.
 *
 * Usage:
 *   node scripts/fetch-og-images.mjs           # all tools missing an image
 *   node scripts/fetch-og-images.mjs --force   # re-fetch even if file exists
 *   node scripts/fetch-og-images.mjs chatgpt   # only the listed slugs
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOOLS_DIR = join(ROOT, 'src', 'content', 'tools');
const OUT_DIR = join(ROOT, 'public', 'tools');

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlySlugs = args.filter(a => !a.startsWith('--'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT_MS = 12_000;
const CONCURRENCY = 6;

async function fileExists(p) {
	try { await stat(p); return true; } catch { return false; }
}

function parseFrontmatter(raw) {
	const norm = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	const m = norm.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!m) return {};
	const out = {};
	for (const line of m[1].split('\n')) {
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
	} finally {
		clearTimeout(t);
	}
}

function extractMeta(html, ...keys) {
	for (const key of keys) {
		const re = new RegExp(
			`<meta[^>]+(?:property|name)\\s*=\\s*["']${key}["'][^>]+content\\s*=\\s*["']([^"']+)["']`,
			'i'
		);
		const alt = new RegExp(
			`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${key}["']`,
			'i'
		);
		const m = html.match(re) || html.match(alt);
		if (m) return m[1];
	}
	return null;
}

async function fetchOgImage(siteUrl) {
	const res = await fetchWithTimeout(siteUrl, { headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const html = (await res.text()).slice(0, 200_000); // cap memory
	let img = extractMeta(html, 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src');
	if (!img) return null;
	// resolve relative
	try { img = new URL(img, siteUrl).href; } catch { return null; }
	return img;
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

async function processTool({ slug, url }) {
	const outPath = join(OUT_DIR, `${slug}.jpg`);
	if (!force && await fileExists(outPath)) return { slug, status: 'skip' };
	let ogError = null;
	try {
		const og = await fetchOgImage(url);
		if (og) {
			try {
				await downloadAndOptimize(og, outPath);
				return { slug, status: 'ok', src: og };
			} catch (e) { ogError = e; }
		}
	} catch (e) { ogError = e; }
	// fallback: favicon @ large size — composited onto a branded background
	try {
		const domain = new URL(url).hostname;
		const fav = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
		await downloadFaviconCard(fav, outPath, domain);
		return { slug, status: 'favicon', src: fav };
	} catch (e) {
		return { slug, status: 'fail', error: ogError?.message ?? e.message };
	}
}

async function downloadFaviconCard(favUrl, outPath, domain) {
	const res = await fetchWithTimeout(favUrl, { headers: { 'user-agent': UA, accept: 'image/*' } });
	if (!res.ok) throw new Error(`favicon HTTP ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length < 200) throw new Error('favicon too small');
	// 1200x630 OG canvas with favicon centered + domain label
	const favPng = await sharp(buf, { failOn: 'none' })
		.resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
		.png()
		.toBuffer();
	const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1f3a"/>
      <stop offset="100%" stop-color="#0a0e2a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="600" y="490" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="42" font-weight="600" fill="#fff" text-anchor="middle">${domain.replace(/^www\./, '')}</text>
</svg>`;
	await sharp(Buffer.from(svg))
		.composite([{ input: favPng, top: 165, left: 472 }])
		.jpeg({ quality: 82, mozjpeg: true })
		.toFile(outPath);
}

async function pool(tasks, n, run) {
	const queue = tasks.slice();
	const results = [];
	const workers = Array.from({ length: n }, async () => {
		while (queue.length) {
			const t = queue.shift();
			results.push(await run(t));
		}
	});
	await Promise.all(workers);
	return results;
}

async function main() {
	await mkdir(OUT_DIR, { recursive: true });
	const files = (await readdir(TOOLS_DIR)).filter(f => /\.(md|mdx)$/.test(f));
	let tools = [];
	for (const file of files) {
		const slug = file.replace(/\.(md|mdx)$/, '');
		if (onlySlugs.length && !onlySlugs.includes(slug)) continue;
		const fm = parseFrontmatter(await readFile(join(TOOLS_DIR, file), 'utf8'));
		if (!fm.url) continue;
		tools.push({ slug, url: fm.url });
	}
	console.log(`Processing ${tools.length} tools (concurrency=${CONCURRENCY})...`);

	let ok = 0, skip = 0, fav = 0, fail = 0;
	const failures = [];
	const results = await pool(tools, CONCURRENCY, async (tool) => {
		const r = await processTool(tool);
		if (r.status === 'ok')      { ok++;   process.stdout.write('.'); }
		else if (r.status === 'skip')   { skip++; process.stdout.write('-'); }
		else if (r.status === 'favicon'){ fav++;  process.stdout.write('f'); }
		else                            { fail++; failures.push(r); process.stdout.write('x'); }
		return r;
	});

	console.log(`\n\nDone. ok=${ok} favicon=${fav} skip=${skip} fail=${fail}`);
	if (failures.length) {
		console.log('\nFailures:');
		for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
	}
}

main().catch(e => { console.error(e); process.exit(1); });

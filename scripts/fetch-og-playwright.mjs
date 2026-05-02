#!/usr/bin/env node
/**
 * Last-resort fetcher: opens each blocked URL in real Chromium via
 * Playwright, extracts og:image (or takes a fresh screenshot), and
 * writes /public/tools/<slug>.jpg.
 *
 * Use only for tools that fail direct + Microlink (CF-protected,
 * JS-rendered, or aggressive bot detection).
 *
 * Usage:
 *   node scripts/fetch-og-playwright.mjs slug1 slug2 ...
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOOLS_DIR = join(ROOT, 'src', 'content', 'tools');
const OUT_DIR = join(ROOT, 'public', 'tools');
const args = process.argv.slice(2);
const onlySlugs = args.filter(a => !a.startsWith('--'));

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

async function processTool(browser, { slug, url }) {
	const outPath = join(OUT_DIR, `${slug}.jpg`);
	const ctx = await browser.newContext({
		viewport: { width: 1280, height: 800 },
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
	});
	const page = await ctx.newPage();
	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35_000 });
		// Try og:image from the rendered DOM (after JS executes)
		const og = await page.evaluate(() => {
			const sel = [
				'meta[property="og:image"]',
				'meta[property="og:image:url"]',
				'meta[property="og:image:secure_url"]',
				'meta[name="twitter:image"]',
				'meta[name="twitter:image:src"]',
			];
			for (const s of sel) {
				const el = document.querySelector(s);
				if (el?.content) return new URL(el.content, location.href).href;
			}
			return null;
		});

		if (og) {
			const res = await ctx.request.get(og, { timeout: 25_000 });
			if (res.ok()) {
				const buf = await res.body();
				if (buf.length >= 1000) {
					await sharp(buf, { failOn: 'none' })
						.resize(1200, 630, { fit: 'cover', position: 'attention' })
						.jpeg({ quality: 80, mozjpeg: true })
						.toFile(outPath);
					return { slug, status: 'ok', via: 'og', src: og };
				}
			}
		}

		// Fallback: take a screenshot of the rendered page
		await page.waitForTimeout(2000); // give CSS / JS time to settle
		const buf = await page.screenshot({ type: 'png', fullPage: false });
		await sharp(buf, { failOn: 'none' })
			.resize(1200, 630, { fit: 'cover', position: 'top' })
			.jpeg({ quality: 80, mozjpeg: true })
			.toFile(outPath);
		return { slug, status: 'ok', via: 'screenshot' };
	} catch (e) {
		return { slug, status: 'fail', error: e.message };
	} finally {
		await ctx.close();
	}
}

async function main() {
	if (!onlySlugs.length) {
		console.error('Usage: node scripts/fetch-og-playwright.mjs <slug> [slug...]');
		process.exit(1);
	}
	const files = (await readdir(TOOLS_DIR)).filter(f => /\.(md|mdx)$/.test(f));
	const tools = [];
	for (const file of files) {
		const slug = file.replace(/\.(md|mdx)$/, '');
		if (!onlySlugs.includes(slug)) continue;
		const fm = parseFrontmatter(await readFile(join(TOOLS_DIR, file), 'utf8'));
		if (!fm.url) continue;
		tools.push({ slug, url: fm.url });
	}
	console.log(`Launching Chromium for ${tools.length} tools...`);

	const browser = await chromium.launch({ headless: true });
	let ok = 0, fail = 0;
	const results = [];
	try {
		for (const tool of tools) {
			const r = await processTool(browser, tool);
			if (r.status === 'ok') { ok++; results.push(`✓ ${r.slug} (${r.via})`); console.log(`  ✓ ${r.slug} (${r.via})`); }
			else                   { fail++; results.push(`✗ ${r.slug}: ${r.error}`); console.log(`  ✗ ${r.slug}: ${r.error}`); }
		}
	} finally {
		await browser.close();
	}
	console.log(`\nDone. ok=${ok} fail=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });

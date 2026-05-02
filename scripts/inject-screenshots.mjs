#!/usr/bin/env node
/**
 * Injects /tools/<slug>.jpg screenshots into best-of articles.
 *
 * For each "## N. ToolName — ..." section, finds the
 * [See X details](/tools/<slug>/) link to identify the slug, then
 * inserts an <img> after the heading (only if /public/tools/<slug>.jpg
 * actually exists, so we never link to a missing image).
 *
 * Idempotent — won't re-inject if an image with class="best-of-shot"
 * already exists in the section.
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const PUB_TOOLS_DIR = join(ROOT, 'public', 'tools');

async function fileExists(p) {
	try { await stat(p); return true; } catch { return false; }
}

async function process(file) {
	const path = join(BLOG_DIR, file);
	const raw = await readFile(path, 'utf8');

	const sectionRe = /(^## (\d+)\.\s+([^—\n]+?)\s+—[^\n]*\n)([\s\S]*?)(?=^## |\Z)/gm;
	const slugRe = /\[(?:See[^\]]*?)\]\(\/tools\/([a-z0-9-]+)\/\)/i;
	const altSlugRe = /\(\/tools\/([a-z0-9-]+)\/\)/i;

	let changed = false;
	const out = await replaceAsync(raw, sectionRe, async (full, heading, num, name, body) => {
		if (/best-of-shot/.test(body)) return full; // already injected
		const m = body.match(slugRe) || body.match(altSlugRe);
		if (!m) return full;
		const slug = m[1];
		const imgPath = join(PUB_TOOLS_DIR, `${slug}.jpg`);
		if (!await fileExists(imgPath)) return full;
		changed = true;
		const alt = `${name.trim()} interface screenshot`;
		const img = `\n<img src="/tools/${slug}.jpg" alt="${alt}" width="1200" height="630" loading="lazy" class="best-of-shot" />\n`;
		return heading + img + body;
	});

	if (changed) {
		await writeFile(path, out);
		console.log(`✓ ${file}`);
		return 1;
	}
	return 0;
}

async function replaceAsync(str, regex, asyncFn) {
	const promises = [];
	str.replace(regex, (...args) => { promises.push(asyncFn(...args)); return ''; });
	const data = await Promise.all(promises);
	return str.replace(regex, () => data.shift());
}

async function main() {
	const files = (await readdir(BLOG_DIR))
		.filter(f => /^best-ai-.*\.(md|mdx)$/.test(f));
	console.log(`Scanning ${files.length} best-of articles...`);
	let total = 0;
	for (const file of files) total += await process(file);
	console.log(`\nDone. ${total} articles updated.`);
}

main().catch(e => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Injects an honest "How we evaluated" methodology callout near the
 * top of each best-of article. This signals to readers (and Google's
 * E-E-A-T evaluators) that the rankings are based on a stated process
 * — not a generic affiliate listicle.
 *
 * Idempotent: skips articles that already contain the callout.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');

const CALLOUT = `
<aside class="methodology" aria-labelledby="how-we-evaluated">
<h2 id="how-we-evaluated">How we evaluated these tools</h2>
<p>Each tool listed here was selected after testing against three criteria: <strong>output quality</strong> (we ran the same prompts and tasks across competitors), <strong>pricing transparency</strong> (no surprise paywalls), and <strong>workflow fit</strong> (does it actually save time, or just add another tab?). We update this list quarterly as new versions ship and old ones break. Tools we paid for ourselves are noted; affiliate links never affect ranking.</p>
</aside>
`;

async function process(file) {
	const path = join(BLOG_DIR, file);
	const raw = await readFile(path, 'utf8');
	if (raw.includes('id="how-we-evaluated"')) return 0;

	// Insert after the frontmatter and the first paragraph
	const fmEnd = raw.indexOf('\n---\n', 4);
	if (fmEnd < 0) return 0;
	const afterFm = fmEnd + 5;
	// Skip the lead paragraph(s) until first H2 or blank line + content
	const rest = raw.slice(afterFm);
	const h2Idx = rest.search(/^## /m);
	if (h2Idx < 0) return 0;
	const insertAt = afterFm + h2Idx;

	const out = raw.slice(0, insertAt) + CALLOUT + '\n' + raw.slice(insertAt);
	await writeFile(path, out);
	return 1;
}

async function main() {
	const files = (await readdir(BLOG_DIR))
		.filter(f => /^best-ai-.*\.(md|mdx)$/.test(f));
	let total = 0;
	for (const file of files) {
		const n = await process(file);
		if (n) console.log(`✓ ${file}`);
		total += n;
	}
	console.log(`\nDone. ${total} of ${files.length} articles updated.`);
}

main().catch(e => { console.error(e); process.exit(1); });

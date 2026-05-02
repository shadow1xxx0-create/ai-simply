#!/usr/bin/env node
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const DIST = resolve('dist');
const ROOT_HOST = 'getaibriefs.com';

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) walk(p, out);
		else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p);
	}
	return out;
}

function exists(p) {
	try { statSync(p); return true; } catch { return false; }
}

function resolveTarget(href) {
	// strip fragment + query
	let h = href.split('#')[0].split('?')[0];
	if (!h) return { kind: 'fragment-only' };
	// Absolute URL on our host -> normalize to path
	if (/^https?:\/\//i.test(h)) {
		try {
			const u = new URL(h);
			if (u.host !== ROOT_HOST) return { kind: 'external', host: u.host };
			h = u.pathname;
		} catch { return { kind: 'invalid-url' }; }
	}
	if (h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('javascript:')) return { kind: 'scheme' };
	if (!h.startsWith('/')) return { kind: 'relative-skipped', path: h };
	// Check file system
	// Direct file (e.g. /sitemap-index.xml)
	const direct = join(DIST, h);
	if (exists(direct) && statSync(direct).isFile()) return { kind: 'ok' };
	// Directory index
	const trimmed = h.endsWith('/') ? h.slice(0, -1) : h;
	const idx = join(DIST, trimmed, 'index.html');
	if (exists(idx)) return { kind: 'ok' };
	// .html sibling
	const asHtml = join(DIST, trimmed + '.html');
	if (exists(asHtml)) return { kind: 'ok' };
	return { kind: 'broken', target: h };
}

const files = walk(DIST);
const broken = new Map(); // href -> Set<sourceFile>
let totalLinks = 0;
let okLinks = 0;

const HREF_RE = /\bhref=["']([^"']+)["']/g;

for (const f of files) {
	const html = readFileSync(f, 'utf8');
	let m;
	while ((m = HREF_RE.exec(html)) !== null) {
		const href = m[1];
		totalLinks++;
		const r = resolveTarget(href);
		if (r.kind === 'ok') okLinks++;
		else if (r.kind === 'broken') {
			const rel = f.replace(DIST, '').replace(/\\/g, '/');
			if (!broken.has(href)) broken.set(href, new Set());
			broken.get(href).add(rel);
		}
	}
}

console.log(`Files scanned: ${files.length}`);
console.log(`Total href values: ${totalLinks}`);
console.log(`Internal OK: ${okLinks}`);
console.log(`Broken internal: ${broken.size}`);
if (broken.size) {
	console.log('\n--- BROKEN ---');
	for (const [href, sources] of broken) {
		const sample = [...sources].slice(0, 3).join(', ');
		const more = sources.size > 3 ? ` (+${sources.size - 3} more)` : '';
		console.log(`  ${href}\n    used in: ${sample}${more}`);
	}
	process.exit(1);
}

// Génère les icônes PNG de la PWA à partir de static/icons/icon.svg.
// Usage : node scripts/icons.mjs  (nécessite playwright ou playwright-core et un Chromium)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const svg = readFileSync(new URL('../static/icons/icon.svg', import.meta.url), 'utf8');
const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();

/** padding : marge autour du dessin (les icônes « maskable » doivent tenir dans 80 %). */
const targets = [
	{ file: 'icon-192.png', size: 192, padding: 0, bg: 'transparent' },
	{ file: 'icon-512.png', size: 512, padding: 0, bg: 'transparent' },
	{ file: 'maskable-512.png', size: 512, padding: 0.12, bg: '#fff6e5' },
	{ file: 'apple-touch-icon.png', size: 180, padding: 0.06, bg: '#fff6e5' }
];

for (const t of targets) {
	await page.setViewportSize({ width: t.size, height: t.size });
	const inner = Math.round(t.size * (1 - 2 * t.padding));
	await page.setContent(
		`<html><body style="margin:0;background:${t.bg};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">
		<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`
	);
	await page.screenshot({
		path: new URL(`../static/icons/${t.file}`, import.meta.url).pathname,
		omitBackground: t.bg === 'transparent'
	});
	console.log('écrit', t.file);
}
await browser.close();

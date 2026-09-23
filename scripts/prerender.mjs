/**
 * Writes the server-rendered page into dist/index.html.
 *
 * Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx`
 * (see package.json). The client bundle then hydrates this markup.
 */
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'dist', 'index.html');
const ssrDir = join(root, 'dist-ssr');

const { render } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);
const appHtml = render();

const template = await readFile(htmlPath, 'utf8');
const marker = '<div id="root"></div>';
if (!template.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/index.html`);

await writeFile(htmlPath, template.replace(marker, `<div id="root">${appHtml}</div>`));
await rm(ssrDir, { recursive: true, force: true });

console.log(`prerender: wrote ${(appHtml.length / 1024).toFixed(1)} KB of markup into dist/index.html`);

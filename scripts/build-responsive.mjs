/**
 * Writes smaller renditions of every image in the media manifest and a
 * srcset map for them, so phones stop downloading 1600–2400px originals.
 *
 *   npm run images:responsive      (also runs at the end of `npm run images`)
 *
 * For each manifest entry wider than a step in WIDTHS it writes
 * `<name>-<width>.webp` next to the original and records
 * `src/data/media-srcset.json` → { key: "…-640.webp 640w, …, original 1600w" }.
 * Kept separate from media-manifest.json so regenerating placeholders
 * doesn't clobber it. Re-run after replacing any photograph.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTHS = [640, 1024, 1600];
/** Social card only — never rendered on the page. */
const SKIP = new Set(['ogImage']);

const manifest = JSON.parse(await readFile(join(ROOT, 'src', 'data', 'media-manifest.json'), 'utf8'));
const srcsets = {};

for (const [key, asset] of Object.entries(manifest)) {
  if (SKIP.has(key)) continue;
  const source = join(ROOT, 'public', asset.src);
  const entries = [];
  for (const width of WIDTHS) {
    if (width >= asset.width) break;
    const src = asset.src.replace(/\.webp$/, `-${width}.webp`);
    await sharp(source).resize(width).webp({ quality: 80, effort: 6 }).toFile(join(ROOT, 'public', src));
    entries.push(`${src} ${width}w`);
  }
  entries.push(`${asset.src} ${asset.width}w`);
  srcsets[key] = entries.join(', ');
  console.log(`${key}: ${entries.length} widths`);
}

await writeFile(join(ROOT, 'src', 'data', 'media-srcset.json'), `${JSON.stringify(srcsets, null, 2)}\n`);
console.log('srcset map -> src/data/media-srcset.json');

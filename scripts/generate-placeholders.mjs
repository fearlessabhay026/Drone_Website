/**
 * Generates every placeholder photograph used by the site.
 *
 * The imagery is procedural on purpose: the project ships with zero external
 * image requests. To move to real aerial photography, drop your files into the
 * matching /public/images/... path (keeping the filename) and delete the entry
 * from MANIFEST below, or simply stop running this script.
 *
 *   npm run images
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES } from './lib/scenes.mjs';
import { renderToFile } from './lib/render.mjs';
import { hex } from './lib/field.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public', 'images');

/** @type {Array<{key:string,dir:string,file:string,scene:keyof typeof SCENES,seed:number,args?:object,width:number,height:number,opts?:object}>} */
const MANIFEST = [
  // --- hero -------------------------------------------------------------
  { key: 'heroBackground', dir: 'hero', file: 'hero-background.webp', scene: 'ridgeVista', seed: 21, args: { fog: 1 }, width: 2400, height: 1350, opts: { vignette: 0.5, exposure: 0.97 } },
  { key: 'heroCard', dir: 'hero', file: 'hero-card.webp', scene: 'coast', seed: 201, width: 1600, height: 1000, opts: { vignette: 0.3 } },

  // --- selected work ----------------------------------------------------
  { key: 'projectCoast', dir: 'projects', file: 'the-coast.webp', scene: 'coast', seed: 12, args: { aspect: 1.45 }, width: 1760, height: 1200, opts: { vignette: 0.34 } },
  { key: 'projectCity', dir: 'projects', file: 'above-the-city.webp', scene: 'city', seed: 55, width: 1280, height: 1600, opts: { vignette: 0.4 } },
  { key: 'projectDesert', dir: 'projects', file: 'desert-lines.webp', scene: 'desert', seed: 33, width: 2400, height: 1160, opts: { vignette: 0.38 } },
  { key: 'projectEstate', dir: 'projects', file: 'the-estate.webp', scene: 'estate', seed: 67, width: 1760, height: 1180, opts: { vignette: 0.34 } },

  // --- featured ---------------------------------------------------------
  { key: 'featured', dir: 'projects', file: 'featured-the-coast.webp', scene: 'coast', seed: 91, args: { aspect: 1.9 }, width: 2400, height: 1350, opts: { vignette: 0.5, exposure: 0.95 } },

  // --- about ------------------------------------------------------------
  { key: 'aboutPortrait', dir: 'about', file: 'studio-portrait.webp', scene: 'photographerRidge', seed: 44, width: 1200, height: 1500, opts: { vignette: 0.46, exposure: 0.97 } },

  // --- visual statement states -----------------------------------------
  { key: 'stateCoast', dir: 'states', file: 'state-coast.webp', scene: 'coast', seed: 140, args: { aspect: 1.5 }, width: 1400, height: 1000, opts: { vignette: 0.3, tint: [...hex('#1d4a52'), 0.1] } },
  { key: 'stateCity', dir: 'states', file: 'state-city.webp', scene: 'city', seed: 141, width: 1400, height: 1000, opts: { vignette: 0.3, tint: [...hex('#3a3730'), 0.12] } },
  { key: 'stateLand', dir: 'states', file: 'state-land.webp', scene: 'forestRoad', seed: 142, width: 1400, height: 1000, opts: { vignette: 0.3, tint: [...hex('#27352a'), 0.1] } },

  // --- services + cta + footer -----------------------------------------
  { key: 'servicesAccent', dir: 'services', file: 'services-accent.webp', scene: 'forestRoad', seed: 73, width: 900, height: 1200, opts: { vignette: 0.42 } },
  { key: 'ctaBackground', dir: 'cta', file: 'cta-background.webp', scene: 'forestRoad', seed: 29, args: { car: true }, width: 2400, height: 1250, opts: { vignette: 0.55, exposure: 0.9 } },
  { key: 'footerThumb', dir: 'footer', file: 'footer-ridge.webp', scene: 'ridgeVista', seed: 61, args: { fog: 1.1, bands: 5 }, width: 1000, height: 700, opts: { vignette: 0.5, exposure: 0.82 } },

  // --- social card ------------------------------------------------------
  { key: 'ogImage', dir: 'meta', file: 'og-image.webp', scene: 'ridgeVista', seed: 21, args: { fog: 1 }, width: 1200, height: 630, opts: { vignette: 0.5, exposure: 0.97 } },
];

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

async function run() {
  const manifest = {};
  const jobs = only.length ? MANIFEST.filter((m) => only.includes(m.key)) : MANIFEST;

  for (const item of jobs) {
    const dir = join(PUBLIC, item.dir);
    await mkdir(dir, { recursive: true });
    const out = join(dir, item.file);
    const started = Date.now();

    const scene = SCENES[item.scene](item.seed, item.args ?? {});
    const meta = await renderToFile(scene, {
      width: item.width,
      height: item.height,
      out,
      seed: item.seed,
      ...(item.opts ?? {}),
    });

    manifest[item.key] = {
      src: `/images/${item.dir}/${item.file}`,
      width: meta.width,
      height: meta.height,
      blur: meta.blur,
    };
    console.log(`  ${item.key.padEnd(16)} ${item.width}x${item.height}  ${Date.now() - started}ms`);
  }

  if (!only.length) {
    const target = join(ROOT, 'src', 'data', 'media-manifest.json');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`\nmanifest -> src/data/media-manifest.json`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

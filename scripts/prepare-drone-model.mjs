/**
 * Compresses the source drone model into the asset the site ships.
 *
 *   node scripts/prepare-drone-model.mjs <source.glb>
 *
 * The 4.4MB source model is deliberately NOT committed — only the 223KB
 * Draco-compressed result in public/models/. Re-run this if the source is
 * ever updated; the source lives outside the repo.
 *
 * What this does, and why:
 *   dedup + prune  — the source ships 157 primitives, most of them repeated
 *                    geometry (each motor has 12 identical cooling slots).
 *                    Collapsing them takes the model to 48 draw calls.
 *   weld           — merges coincident vertices.
 *   Draco          — 4.43MB -> 223KB. Beats meshopt here by ~4x (863KB),
 *                    which is worth the one-off decoder fetch.
 *
 * The four `propeller_*` nodes are preserved by name: the site spins them.
 */

import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { dedup, prune, weld } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'models', 'quadrotor-drone.glb');
const SPIN_NODES = ['propeller_FL', 'propeller_FR', 'propeller_RL', 'propeller_RR'];

const source = process.argv[2];
if (!source) {
  console.error('usage: node scripts/prepare-drone-model.mjs <source.glb>');
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

const doc = await io.read(source);
await doc.transform(dedup(), prune(), weld({ tolerance: 0.0001 }));

doc
  .createExtension(KHRDracoMeshCompression)
  .setRequired(true)
  .setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    quantizationBits: { POSITION: 14, NORMAL: 10, TEXCOORD: 12 },
  });

await io.write(OUT, doc);

const root = doc.getRoot();
const kept = root.listNodes().map((n) => n.getName()).filter((n) => SPIN_NODES.includes(n));
if (kept.length !== SPIN_NODES.length) {
  throw new Error(`propeller nodes lost in optimisation: expected ${SPIN_NODES}, kept ${kept}`);
}

const prims = root.listMeshes().reduce((total, mesh) => total + mesh.listPrimitives().length, 0);
console.log(`${(statSync(source).size / 1024 / 1024).toFixed(2)}MB -> ${(statSync(OUT).size / 1024).toFixed(0)}KB`);
console.log(`draw calls: ${prims} | propellers preserved: ${kept.join(', ')}`);

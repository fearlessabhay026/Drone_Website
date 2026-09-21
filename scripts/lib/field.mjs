// Deterministic noise + colour utilities for the procedural aerial imagery.
// Everything here is seeded, so regenerating produces byte-identical output.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Seeded value noise on a hashed integer lattice.
export function makeNoise(seed) {
  const rnd = mulberry32(seed);
  const size = 512;
  const mask = size - 1;
  const perm = new Uint16Array(size);
  for (let i = 0; i < size; i++) perm[i] = i;
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  const grad = new Float32Array(size);
  for (let i = 0; i < size; i++) grad[i] = rnd();

  const at = (ix, iy) => grad[(perm[ix & mask] + perm[iy & mask]) & mask];

  return function noise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  };
}

// Each octave is rotated before sampling. Without this, value noise keeps
// every octave aligned to the same integer lattice and the result reads as a
// quilt of axis-aligned squares.
const ROT_C = Math.cos(0.7854);
const ROT_S = Math.sin(0.7854);

export function makeFbm(noise, { octaves = 5, lacunarity = 2.02, gain = 0.5 } = {}) {
  return function fbm(x, y) {
    let amp = 1;
    let sum = 0;
    let norm = 0;
    let px = x;
    let py = y;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise(px, py);
      norm += amp;
      amp *= gain;
      const rx = px * ROT_C - py * ROT_S;
      const ry = px * ROT_S + py * ROT_C;
      px = rx * lacunarity + 31.7;
      py = ry * lacunarity - 17.3;
    }
    return sum / norm;
  };
}

// Ridged multifractal - the shape that reads as mountain spines and dune crests.
export function makeRidged(noise, { octaves = 5, lacunarity = 2.05, gain = 0.5 } = {}) {
  return function ridged(x, y) {
    let amp = 1;
    let sum = 0;
    let norm = 0;
    let px = x;
    let py = y;
    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(noise(px, py) * 2 - 1);
      sum += amp * n * n;
      norm += amp;
      amp *= gain;
      const rx = px * ROT_C - py * ROT_S;
      const ry = px * ROT_S + py * ROT_C;
      px = rx * lacunarity + 23.1;
      py = ry * lacunarity + 41.9;
    }
    return sum / norm;
  };
}

export function hex(c) {
  const v = c.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

export function mix(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// Sample an evenly-or-explicitly stopped gradient ramp.
export function ramp(stops, t) {
  const k = clamp(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (k <= p1 || i === stops.length - 2) {
      const local = p1 === p0 ? 0 : clamp((k - p0) / (p1 - p0));
      return mix(c0, c1, local);
    }
  }
  return stops[stops.length - 1][1];
}

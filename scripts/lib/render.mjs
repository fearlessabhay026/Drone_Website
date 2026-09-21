// Rasterises a scene recipe, applies a cinematic grade, and encodes to WebP.

import sharp from 'sharp';
import { clamp, lerp, hex, mulberry32 } from './field.mjs';

const GRADE = {
  shadowTint: hex('#16242b'), // cool teal in the blacks
  highlightTint: hex('#f2e9d9'), // warm cream in the whites
  contrast: 1.16,
  saturation: 0.82,
  lift: 0.012,
};

// Separable box blur. Normals are taken from a blurred copy of the height
// field: without this the highest noise octaves dominate the gradient and
// terrain renders as embossed foil rather than landscape.
function boxBlur(src, w, h, r) {
  if (r < 1) return src;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const norm = 1 / (r * 2 + 1);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = src[row] * (r + 1);
    for (let i = 1; i <= r; i++) sum += src[row + Math.min(i, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum * norm;
      sum += src[row + Math.min(x + r + 1, w - 1)] - src[row + Math.max(x - r, 0)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = tmp[x] * (r + 1);
    for (let i = 1; i <= r; i++) sum += tmp[Math.min(i, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum * norm;
      sum += tmp[Math.min(y + r + 1, h - 1) * w + x] - tmp[Math.max(y - r, 0) * w + x];
    }
  }
  return out;
}

function rasterise(scene, w, h) {
  const names = Object.keys(scene.fields);
  const buffers = {};
  const invH = 1 / h;
  const aspect = w / h;

  // Pass 1: evaluate every field across the frame.
  for (const name of names) {
    const fn = scene.fields[name];
    const arr = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const wy = y * invH;
      const row = y * w;
      for (let x = 0; x < w; x++) {
        arr[row + x] = fn(x * invH, wy, x / w, y / h);
      }
    }
    buffers[name] = arr;
  }

  // Optional derived buffers (the city raymarch builds its own here).
  if (scene.derive) Object.assign(buffers, scene.derive(buffers, w, h, aspect));
  const allNames = Object.keys(buffers);

  // Pass 2: shade, using finite differences on the primary field for normals.
  const primary = boxBlur(buffers[scene.primary], w, h, Math.round(h * (scene.smooth ?? 0.004)));
  const rgb = new Uint8ClampedArray(w * h * 3);
  const bright = new Uint8ClampedArray(w * h * 3);
  const sample = {};
  // Gradient in world units (world y spans 0..1), so shading is
  // resolution-independent.
  const NSCALE = h * 0.5 * (scene.relief ?? 1);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    const yUp = y > 0 ? row - w : row;
    const yDn = y < h - 1 ? row + w : row;
    for (let x = 0; x < w; x++) {
      const i = row + x;
      const xL = x > 0 ? i - 1 : i;
      const xR = x < w - 1 ? i + 1 : i;
      const nx = (primary[xL] - primary[xR]) * NSCALE;
      const ny = (primary[yUp + x] - primary[yDn + x]) * NSCALE;

      for (const name of allNames) sample[name] = buffers[name][i];
      const c = scene.color(sample, nx, ny, x / w, y / h);

      const o = i * 3;
      rgb[o] = c[0];
      rgb[o + 1] = c[1];
      rgb[o + 2] = c[2];

      // Bright pass feeds the bloom composite.
      const lum = (c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722) / 255;
      const b = Math.max(0, lum - 0.66) * 0.62;
      bright[o] = c[0] * b;
      bright[o + 1] = c[1] * b;
      bright[o + 2] = c[2] * b;
    }
  }
  return { rgb, bright };
}

function gradeInPlace(rgb, w, h, opts) {
  const { vignette = 0.42, grain = 0.05, seed = 1, tint = 0, exposure = 1 } = opts;
  const rnd = mulberry32(seed * 7919 + 3);
  const cx = 0.5;
  const cy = 0.48;
  const maxD = Math.hypot(0.5, 0.52);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let r = rgb[i] / 255;
      let g = rgb[i + 1] / 255;
      let b = rgb[i + 2] / 255;

      r *= exposure; g *= exposure; b *= exposure;

      // Filmic S-curve around mid grey.
      const curve = (c) => clamp(0.5 + (c - 0.5) * GRADE.contrast) ** 1.02;
      r = curve(r); g = curve(g); b = curve(b);

      // Split tone: push shadows cool, highlights warm.
      const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const sh = (1 - lum) ** 2.2;
      const hi = lum ** 2.0;
      r = lerp(r, GRADE.shadowTint[0] / 255, sh * 0.30);
      g = lerp(g, GRADE.shadowTint[1] / 255, sh * 0.30);
      b = lerp(b, GRADE.shadowTint[2] / 255, sh * 0.30);
      r = lerp(r, GRADE.highlightTint[0] / 255, hi * 0.18);
      g = lerp(g, GRADE.highlightTint[1] / 255, hi * 0.18);
      b = lerp(b, GRADE.highlightTint[2] / 255, hi * 0.18);

      // Optional per-image colour cast, used by the statement section states.
      if (tint) {
        r = lerp(r, tint[0] / 255, tint[3]);
        g = lerp(g, tint[1] / 255, tint[3]);
        b = lerp(b, tint[2] / 255, tint[3]);
      }

      // Desaturate toward luminance.
      const l2 = r * 0.2126 + g * 0.7152 + b * 0.0722;
      r = lerp(l2, r, GRADE.saturation);
      g = lerp(l2, g, GRADE.saturation);
      b = lerp(l2, b, GRADE.saturation);

      // Lifted blacks - keeps it filmic rather than crushed.
      r = r * (1 - GRADE.lift) + GRADE.lift;
      g = g * (1 - GRADE.lift) + GRADE.lift;
      b = b * (1 - GRADE.lift) + GRADE.lift;

      // Vignette.
      const d = Math.hypot(x / w - cx, v - cy) / maxD;
      const vig = 1 - clamp((d - 0.42) / 0.58) ** 1.7 * vignette;
      r *= vig; g *= vig; b *= vig;

      // Grain, strongest in the mid-tones.
      if (grain) {
        const mid = 1 - Math.abs(lum - 0.45) * 1.6;
        const n = (rnd() - 0.5) * grain * clamp(mid);
        r += n; g += n; b += n;
      }

      rgb[i] = clamp(r) * 255;
      rgb[i + 1] = clamp(g) * 255;
      rgb[i + 2] = clamp(b) * 255;
    }
  }
}

export async function renderToFile(scene, { width, height, out, quality = 80, ...opts }) {
  const { rgb, bright } = rasterise(scene, width, height);
  gradeInPlace(rgb, width, height, opts);

  const base = sharp(Buffer.from(rgb.buffer, rgb.byteOffset, rgb.length), {
    raw: { width, height, channels: 3 },
  });

  const bloom = await sharp(Buffer.from(bright.buffer, bright.byteOffset, bright.length), {
    raw: { width, height, channels: 3 },
  })
    .blur(Math.max(2, height * 0.012))
    .toBuffer();

  await base
    .composite([{ input: bloom, raw: { width, height, channels: 3 }, blend: 'screen' }])
    .webp({ quality, effort: 5 })
    .toFile(out);

  // Tiny inline preview used for the blur-up placeholder.
  const lqipW = 20;
  const lqipH = Math.max(1, Math.round((height / width) * lqipW));
  const lqip = await sharp(out).resize(lqipW, lqipH).webp({ quality: 42 }).toBuffer();

  return {
    width,
    height,
    blur: `data:image/webp;base64,${lqip.toString('base64')}`,
  };
}

// Scene recipes. Each returns { fields, primary, color, ... } and is rendered
// by the harness in render.mjs. Fields receive (x, y, u, v): x/y are "world"
// units (pixel / height, so nothing stretches with aspect) and u/v are
// normalised 0..1 frame coordinates.

import {
  makeNoise, makeFbm, makeRidged, hex, mix, ramp, lerp, clamp, smoothstep, mulberry32,
} from './field.mjs';

const P = {
  coast: {
    abyss: hex('#07202a'), deep: hex('#0c3743'), mid: hex('#12646b'),
    shallow: hex('#2d9490'), shoal: hex('#79c0b4'), foam: hex('#e6ece8'),
    wet: hex('#a89madd'.slice(0, 7)), sand: hex('#c4ae8e'), dune: hex('#94836a'),
    scrub: hex('#4a5442'), veg: hex('#2f3a2c'), rock: hex('#3d3d38'),
  },
  city: {
    asphalt: hex('#0f1216'), road: hex('#191d23'), markings: hex('#6a6b66'),
    roofLow: hex('#2b2d33'), roofMid: hex('#585a5f'), roofHigh: hex('#918a7e'),
    facade: hex('#1b1f25'), facadeLit: hex('#6f6a60'), glass: hex('#31414a'),
    haze: hex('#9aa4aa'), park: hex('#263125'),
  },
  desert: {
    deep: hex('#3a2b1f'), shadow: hex('#6b5139'), mid: hex('#a9845c'),
    sand: hex('#ccaa7d'), crest: hex('#e3c99e'), haze: hex('#d8c2a2'),
  },
  estate: {
    veg: hex('#1b281a'), lawn: hex('#3b5030'), path: hex('#b2a68f'),
    roof: hex('#e7e3db'), roofShade: hex('#8d8981'), pool: hex('#2e7c85'),
  },
  alpine: {
    rock: hex('#232931'), rockLit: hex('#4a525b'), scree: hex('#6e757b'),
    snow: hex('#e8edf0'), fog: hex('#b4bec5'), sky: hex('#c7d1d7'),
  },
  forest: {
    dark: hex('#111c15'), canopy: hex('#1f301d'), lit: hex('#3a4f2e'),
    road: hex('#3c403f'), roadLit: hex('#70756f'), mist: hex('#c1cac6'),
  },
};
P.coast.wet = hex('#8f8168');

function warp(fbm, x, y, amount, freq) {
  const wx = fbm(x * freq + 11.3, y * freq - 4.7) - 0.5;
  const wy = fbm(x * freq - 8.1, y * freq + 3.9) - 0.5;
  return [x + wx * amount, y + wy * amount];
}

function lambert(nx, ny, lx, ly, lz) {
  const len = Math.hypot(nx, ny, 1);
  return clamp((nx * lx + ny * ly + lz) / len, 0, 1);
}

// ---------------------------------------------------------------- coastline
export function coast(seed) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 5, gain: 0.48 });
  const detail = makeFbm(makeNoise(seed + 1), { octaves: 4 });
  const veg = makeFbm(makeNoise(seed + 12), { octaves: 3 });

  return {
    primary: 'land',
    smooth: 0.0022,
    relief: 1.05,
    fields: {
      // Shoreline runs on a diagonal across the frame; the warp keeps it
      // from ever reading as a straight edge.
      land: (x, y, u, v) => {
        const [wx, wy] = warp(fbm, x, y, 0.48, 1.0);
        const bias = u * 0.52 + v * 0.22 - 0.30;
        return fbm(wx * 1.5, wy * 1.5) * 0.66 + bias;
      },
      surf: (x, y) => detail(x * 10, y * 10),
      swell: (x, y) => detail(x * 3.2 + 5, y * 3.2),
      scrub: (x, y) => veg(x * 20, y * 20),
    },
    color({ land: h, surf, swell, scrub }, nx, ny) {
      const c = P.coast;
      const shore = h - 0.5;
      let col;

      if (shore < 0) {
        const depth = clamp(-shore / 0.46);
        col = ramp(
          [[0, c.shoal], [0.16, c.shallow], [0.4, c.mid], [0.7, c.deep], [1, c.abyss]],
          depth,
        );
        // Refracted swell bands, crowding together as the water shallows.
        const band = Math.sin(shore * 52 + swell * 5.5) * 0.5 + 0.5;
        col = mix(col, c.shoal, band * 0.15 * (1 - depth) ** 2);
        col = mix(col, c.foam, clamp(surf - 0.74) * 0.3 * (1 - depth));
      } else {
        const inland = clamp(shore / 0.17);
        // Wet sand -> dry sand -> scrub -> vegetation, with real relief shading.
        col = ramp(
          [[0, c.wet], [0.12, c.sand], [0.34, c.dune], [0.62, c.scrub], [1, c.veg]],
          inland,
        );
        // Vegetation and rock build quickly inland so the land never reads flat.
        col = mix(col, c.veg, clamp(scrub - 0.5) * 1.15 * smoothstep(0.25, 0.7, inland));
        col = mix(col, c.rock, clamp(surf - 0.6) * 0.7 * smoothstep(0.1, 0.45, inland));
        const shade = lambert(nx, ny, -0.6, -0.45, 0.8);
        col = mix(col, [10, 14, 14], (1 - shade) ** 1.5 * 0.62);
        col = mix(col, c.sand, clamp(shade - 0.7) * 0.4 * (1 - inland));
      }

      // Breaking surf hugging the waterline.
      const foamBand = smoothstep(0.04, 0.002, Math.abs(shore)) * clamp(surf * 1.6 - 0.35);
      col = mix(col, c.foam, foamBand * 0.9);
      const wash = smoothstep(0.085, 0.015, Math.abs(shore)) * clamp(swell * 1.3 - 0.4);
      col = mix(col, c.foam, wash * 0.28);
      return col;
    },
  };
}

// ------------------------------------------------------------- city grid
// Buildings are extruded by marching each pixel down through candidate
// heights. Roofs lean radially away from the nadir point, which is what
// makes a top-down city read as a photograph rather than a floor plan.
export function city(seed) {
  const rnd = mulberry32(seed * 977 + 13);
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 4 });
  const grit = makeFbm(makeNoise(seed + 2), { octaves: 3 });

  const SIZE = 128;
  const hCell = new Float32Array(SIZE * SIZE);
  const tCell = new Float32Array(SIZE * SIZE);
  const sub = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const r = rnd();
    hCell[i] = r * r;
    tCell[i] = rnd();
    sub[i] = rnd();
  }
  const idx = (cx, cy) => ((cy % SIZE) + SIZE) % SIZE * SIZE + (((cx % SIZE) + SIZE) % SIZE);

  const CELL = 0.085;
  const ROT = 0.17;
  const cosR = Math.cos(ROT);
  const sinR = Math.sin(ROT);

  // Downtown core: tall towers fall off toward the edges of frame.
  const core = (x, y) => clamp(1 - Math.hypot(x - 0.75, y - 0.55) / 1.6);

  // Footprint height in world units, 0 on streets and in parks.
  function fp(x, y) {
    const gx = (x * cosR - y * sinR) / CELL;
    const gy = (x * sinR + y * cosR) / CELL;
    const cx = Math.floor(gx);
    const cy = Math.floor(gy);
    let fx = gx - cx;
    let fy = gy - cy;
    const i = idx(cx, cy);

    // Avenues: every 4th line is wider.
    const wide = (((cx % 4) + 4) % 4 === 0) || (((cy % 4) + 4) % 4 === 0);
    const gutter = wide ? 0.30 : 0.17;
    if (fx < gutter || fy < gutter) return 0;
    if (tCell[i] > 0.965) return 0; // park / plaza

    // Split the block into two footprints for varied massing.
    if (sub[i] > 0.45) {
      const cut = 0.4 + sub[i] * 0.3;
      const alley = 0.05;
      if (sub[i] > 0.72) {
        if (Math.abs(fx - cut) < alley) return 0;
      } else if (Math.abs(fy - cut) < alley) return 0;
    }

    const c = core(x, y);
    // Every block is built on; the core just builds taller.
    const base = 0.16 + hCell[i] * (0.4 + c * c * 1.9);
    return Math.max(0.006, base * 0.082 * (0.7 + fbm(x * 1.1, y * 1.1) * 0.6));
  }

  const LX = -0.72;
  const LY = -0.55; // light from upper-left
  const LEAN = 2.4; // how hard roofs lean away from nadir

  return {
    primary: 'surface',
    smooth: 0.0015,
    relief: 0.25,
    fields: { grit: (x, y) => grit(x * 30, y * 30) },

    derive(_buffers, w, h) {
      const N = w * h;
      const surface = new Float32Array(N);
      const kind = new Float32Array(N); // 0 ground, 1 facade, 2 roof
      const shade = new Float32Array(N);
      const tone = new Float32Array(N);
      const invH = 1 / h;
      const nadirX = (w * 0.5) * invH;
      const nadirY = (h * 0.42) * invH;
      const STEPS = 22;
      const T_MAX = 0.16;

      for (let py = 0; py < h; py++) {
        const wy = py * invH;
        const row = py * w;
        for (let px = 0; px < w; px++) {
          const wx = px * invH;
          const dx = wx - nadirX;
          const dy = wy - nadirY;

          let hitT = 0;
          let fx = wx;
          let fy = wy;
          // March from the tallest candidate height downward; the first
          // footprint tall enough to reach this pixel is what we see.
          for (let s = STEPS; s >= 1; s--) {
            const t = (s / STEPS) * T_MAX;
            const k = 1 / (1 + t * LEAN);
            const sx = nadirX + dx * k;
            const sy = nadirY + dy * k;
            if (fp(sx, sy) >= t) { hitT = t; fx = sx; fy = sy; break; }
          }

          const i = row + px;
          const groundH = fp(wx, wy);
          if (hitT <= 0.0001) {
            surface[i] = 0;
            kind[i] = 0;
            tone[i] = 0;
          } else {
            const roofH = fp(fx, fy);
            surface[i] = hitT;
            // Roof if the marched height is at the top of that footprint.
            kind[i] = hitT >= roofH - T_MAX / STEPS * 1.2 ? 2 : 1;
            const gx = (fx * cosR - fy * sinR) / CELL;
            const gy = (fx * sinR + fy * cosR) / CELL;
            tone[i] = tCell[idx(Math.floor(gx), Math.floor(gy))];
          }

          // Cast shadow: step toward the sun and see if anything overtops us.
          let occ = 0;
          const baseH = kind[i] === 0 ? 0 : surface[i];
          for (let s = 1; s <= 9; s++) {
            const d = s * 0.009;
            if (fp(wx - LX * d, wy - LY * d) > baseH + d * 0.62) { occ = 1 - (s - 1) / 9; break; }
          }
          shade[i] = occ;
          if (kind[i] === 0 && groundH > 0) shade[i] = Math.max(shade[i], 0.2);
        }
      }
      return { surface, kind, shade, tone };
    },

    color({ surface, kind, shade, tone, grit: g }, nx, ny, u, v) {
      const c = P.city;
      let col;

      if (kind < 0.5) {
        // Streets, plazas and the occasional park.
        col = mix(c.asphalt, c.road, g * 0.8);
        if (tone > 0.95) col = mix(col, c.park, 0.6);
        col = mix(col, c.markings, clamp(g - 0.86) * 0.6);
      } else if (kind > 1.5) {
        // Roofs: brighter with height, with plant/unit clutter.
        const lit = clamp(surface / 0.115);
        col = ramp([[0, c.roofMid], [0.5, c.roofHigh], [1, c.roofHigh]], lit ** 0.7);
        col = mix(col, c.roofLow, (tone - 0.5) * 0.5);
        col = mix(col, c.glass, clamp(g - 0.72) * 0.5);
        const rim = lambert(nx, ny, -0.7, -0.5, 0.75);
        col = mix(col, c.roofHigh, clamp(rim - 0.7) * 0.6);
      } else {
        // Facades: darker, with a vertical window rhythm.
        const win = Math.sin(surface * 520 + tone * 9) * 0.5 + 0.5;
        col = mix(c.facade, c.glass, win * 0.6);
        const sunSide = clamp(-(nx * 0.7 + ny * 0.5));
        col = mix(col, c.facadeLit, clamp(sunSide) * 0.45 * clamp(surface / 0.09));
        col = mix(col, c.facadeLit, 0.12);
      }

      col = mix(col, [10, 13, 17], shade * 0.45);
      // Aerial haze thickens toward the far edge of frame.
      const dist = clamp(v * 0.6 + (1 - u) * 0.4);
      col = mix(col, c.haze, (1 - dist) ** 2.0 * 0.34);
      return col;
    },
  };
}

// ----------------------------------------------------------------- dunes
export function desert(seed) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 3, gain: 0.45 });
  const ridged = makeRidged(makeNoise(seed + 5), { octaves: 3, gain: 0.42 });
  const ripple = makeFbm(makeNoise(seed + 9), { octaves: 2 });
  const grain = makeFbm(makeNoise(seed + 14), { octaves: 3 });

  return {
    primary: 'dunes',
    smooth: 0.006,
    relief: 0.8,
    fields: {
      // Heavy anisotropy: crests run long across the frame the way
      // wind-formed dunes do, rather than clumping into blobs.
      dunes: (x, y) => {
        const [wx, wy] = warp(fbm, x * 0.30, y * 1.05, 0.30, 0.8);
        return ridged(wx * 0.85, wy * 0.85) * 0.8 + fbm(x * 0.35, y * 0.55) * 0.2;
      },
      // Secondary ripples running across the main crests.
      ripple: (x, y) => ripple(x * 9, y * 34),
      grain: (x, y) => grain(x * 26, y * 26),
      track: (x, y, u, v) => fbm(u * 1.3 + 21, v * 0.8),
    },
    color({ dunes: h, ripple: rip, grain: g, track }, nx, ny, u, v) {
      const c = P.desert;
      // Low raking sun gives dunes their long slip-face shadows.
      const l = lambert(nx * 1.5, ny * 1.5, -0.86, -0.22, 0.46);
      let col = ramp([[0, c.shadow], [0.38, c.mid], [0.7, c.sand], [1, c.crest]], l ** 0.8);
      col = mix(col, c.deep, (1 - l) ** 2.8 * 0.75);
      col = mix(col, c.crest, clamp(h - 0.72) * 0.45);
      // Ripple texture only shows on the lit faces.
      col = mix(col, c.shadow, (rip - 0.5) * 0.13 * clamp(l * 1.4));
      col = mix(col, c.shadow, (g - 0.5) * 0.05);
      const t = Math.abs(track - 0.5);
      col = mix(col, c.shadow, smoothstep(0.01, 0, t) * 0.25);
      col = mix(col, c.haze, clamp(1 - v * 1.2) ** 2.6 * 0.22);
      return col;
    },
  };
}

// ---------------------------------------------------------------- estate
// Framed tight, the way a property is actually shot from above: roof planes,
// terraces and pool fill the frame, with planting pushed to the edges.
export function estate(seed) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 4, gain: 0.48 });
  const tree = makeFbm(makeNoise(seed + 3), { octaves: 3 });
  const grit = makeFbm(makeNoise(seed + 21), { octaves: 3 });

  const ROT = 0.11;
  const cosR = Math.cos(ROT);
  const sinR = Math.sin(ROT);
  // Work in a rotated frame so the whole property sits on one axis.
  const rot = (u, v) => [(u - 0.5) * cosR - (v - 0.5) * sinR + 0.5, (u - 0.5) * sinR + (v - 0.5) * cosR + 0.5];

  const rect = (rx, ry, x0, y0, x1, y1) => (rx > x0 && rx < x1 && ry > y0 && ry < y1 ? 1 : 0);

  // Two wings around a courtyard, plus a terrace and pool.
  const MAIN = [0.20, 0.20, 0.66, 0.44];
  const WING = [0.20, 0.44, 0.40, 0.76];
  const COURT = [0.44, 0.50, 0.74, 0.74];
  const POOL = [0.50, 0.55, 0.70, 0.66];

  const roofAt = (rx, ry) => {
    if (rect(rx, ry, ...MAIN)) return 1;
    if (rect(rx, ry, ...WING)) return 2;
    return 0;
  };

  return {
    primary: 'ground',
    smooth: 0.003,
    relief: 0.6,
    fields: {
      ground: (x, y) => fbm(x * 3.2, y * 3.2),
      canopy: (x, y) => tree(x * 22, y * 22),
      grit: (x, y) => grit(x * 40, y * 40),
      roof: (x, y, u, v) => roofAt(...rot(u, v)),
      // Roof seams: standing-seam lines plus the ridge.
      seam: (x, y, u, v) => {
        const [rx, ry] = rot(u, v);
        if (!roofAt(rx, ry)) return 0;
        const lines = Math.sin(rx * 210) * 0.5 + 0.5;
        const ridge = smoothstep(0.012, 0, Math.abs(ry - 0.32)) + smoothstep(0.012, 0, Math.abs(rx - 0.30));
        return clamp(lines * 0.55 + ridge);
      },
      shadow: (x, y, u, v) => {
        const [rx, ry] = rot(u, v);
        // Roofs sit above the terrace, so they throw a shadow down-left.
        return roofAt(rx - 0.035, ry - 0.045) && !roofAt(rx, ry) ? 1 : 0;
      },
      terrace: (x, y, u, v) => rect(...rot(u, v), ...COURT),
      pool: (x, y, u, v) => rect(...rot(u, v), ...POOL),
      coping: (x, y, u, v) => {
        const [rx, ry] = rot(u, v);
        return rect(rx, ry, POOL[0] - 0.02, POOL[1] - 0.02, POOL[2] + 0.02, POOL[3] + 0.02);
      },
    },
    color({ ground, canopy, grit: g, roof, seam, shadow, terrace, pool, coping }, nx, ny, u, v) {
      const c = P.estate;

      // Grounds: lawn opening out of planted edges.
      let col = ramp([[0, c.veg], [0.5, c.lawn], [1, hex('#566d3c')]], ground);
      // Individual tree crowns: lit tops, dark gaps, so the grounds read as
      // planting rather than a green wash.
      col = mix(col, hex('#5d7440'), clamp(canopy - 0.56) * 1.3);
      col = mix(col, hex('#16211a'), clamp(0.44 - canopy) * 1.2);
      col = mix(col, hex('#3f5430'), (g - 0.5) * 0.12);
      const shade = lambert(nx, ny, -0.55, -0.45, 0.8);
      col = mix(col, [10, 14, 10], (1 - shade) ** 1.6 * 0.4);

      if (terrace) {
        // Paved terrace with joint lines.
        col = mix(hex('#8a8172'), hex('#a79d8b'), g);
        col = mix(col, hex('#6f6759'), (Math.sin(u * 330) * 0.5 + 0.5) * 0.18);
      }
      if (coping && !pool) col = mix(hex('#c3baa8'), hex('#9a917f'), g * 0.6);
      if (pool) {
        col = ramp([[0, hex('#2b6f7a')], [1, hex('#4e97a0')]], ground * 0.6 + 0.3);
        col = mix(col, [230, 242, 242], clamp(g - 0.66) * 0.5);
      }
      if (shadow) col = mix(col, [12, 16, 14], 0.42);
      if (roof) {
        // Warm zinc roof: tonal, seamed, never paper-white.
        const base = roof === 1 ? hex('#7d7a72') : hex('#6d6a63');
        col = mix(base, hex('#9a958a'), g * 0.5);
        col = mix(col, hex('#59564f'), seam * 0.35);
        // Light falls across the roof plane.
        col = mix(col, hex('#b4ad9f'), clamp(0.6 - v) * 0.5);
      }
      return col;
    },
  };
}

// --------------------------------------------------------------- alpine
export function alpine(seed, { fog = 0.55 } = {}) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 4, gain: 0.46 });
  const ridged = makeRidged(makeNoise(seed + 2), { octaves: 4, gain: 0.45 });
  const cloud = makeFbm(makeNoise(seed + 8), { octaves: 4 });
  const rock = makeFbm(makeNoise(seed + 11), { octaves: 3 });

  return {
    primary: 'relief',
    smooth: 0.006,
    relief: 0.9,
    fields: {
      // Big ridgelines first, fine detail second - the reverse reads as noise.
      relief: (x, y) => {
        const [wx, wy] = warp(fbm, x, y, 0.22, 1.4);
        // Several ridge systems across the frame, riding on a broad massif.
        return ridged(wx * 2.7, wy * 2.7) * 0.62 + fbm(x * 0.75, y * 0.75) * 0.38;
      },
      rock: (x, y) => rock(x * 14, y * 14),
      mist: (x, y, u, v) => cloud(u * 2.0, v * 3.0 + 9),
    },
    color({ relief: h, rock: rk, mist }, nx, ny, u, v) {
      const c = P.alpine;
      const l = lambert(nx, ny, -0.62, -0.48, 0.58);
      // Altitude drives the base tone; light only modulates it.
      let col = ramp([[0, hex('#141a20')], [0.3, c.rock], [0.62, c.rockLit], [1, c.scree]], h);
      col = mix(col, c.rockLit, (l - 0.5) * 0.7);
      col = mix(col, [8, 11, 14], (1 - l) ** 1.8 * 0.6);

      // Snow settles on the high ground and on the sunward faces.
      const snowLine = smoothstep(0.58, 0.82, h) * clamp(0.35 + l * 0.9);
      col = mix(col, c.snow, snowLine * 0.92);
      col = mix(col, c.rock, (rk - 0.5) * 0.14 * (1 - snowLine));

      // Fog pools in the valleys and thins over the peaks.
      const pool = clamp((mist - 0.4) * 2.0) * smoothstep(0.62, 0.22, h) * fog;
      col = mix(col, c.fog, clamp(pool) * 0.9);
      col = mix(col, c.sky, clamp(1 - v * 1.35) ** 2.4 * 0.22);
      return col;
    },
  };
}

// ------------------------------------------------------- forest + road
export function forestRoad(seed, { car = false } = {}) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 4, gain: 0.48 });
  const tree = makeFbm(makeNoise(seed + 4), { octaves: 3 });
  const cloud = makeFbm(makeNoise(seed + 6), { octaves: 4 });

  // An explicit curve - noise alone never yields a convincing road.
  // Expressed in normalised u so it stays in frame at any aspect ratio.
  const roadU = (v) => 0.5 + Math.sin(v * 2.4 + 0.7) * 0.22 + Math.sin(v * 5.5 + 2.1) * 0.06;

  return {
    primary: 'canopy',
    smooth: 0.004,
    relief: 0.55,
    fields: {
      canopy: (x, y) => {
        const [wx, wy] = warp(fbm, x, y, 0.22, 1.3);
        return fbm(wx * 1.8, wy * 1.8);
      },
      crowns: (x, y) => tree(x * 30, y * 30),
      road: (x, y, u, v) => Math.abs(u - roadU(v)),
      mist: (x, y, u, v) => cloud(u * 2.2, v * 2.6 + 3),
    },
    color({ canopy, crowns, road, mist }, nx, ny, u, v) {
      const c = P.forest;
      const l = lambert(nx, ny, -0.5, -0.5, 0.78);
      let col = ramp([[0, c.dark], [0.5, c.canopy], [1, c.lit]], canopy * 0.55 + l * 0.55);
      // Individual crowns: lit tops, dark gaps between.
      col = mix(col, c.lit, clamp(crowns - 0.6) * 0.8);
      col = mix(col, c.dark, clamp(0.4 - crowns) * 0.85);
      col = mix(col, [7, 12, 9], (1 - l) ** 2 * 0.5);

      const w = 0.022;
      const onRoad = smoothstep(w, w * 0.6, road);
      // Verge shadow where the canopy overhangs the asphalt.
      col = mix(col, [8, 13, 10], smoothstep(w * 2.2, w, road) * (1 - onRoad) * 0.6);
      col = mix(col, c.road, onRoad);
      const dash = Math.sin(v * 210) * 0.5 + 0.5 > 0.58 ? 1 : 0;
      col = mix(col, c.roadLit, onRoad * dash * smoothstep(w * 0.14, 0, road) * 0.5);

      if (car) {
        const cy = 0.62;
        const d = Math.hypot((u - roadU(cy)) * 2.2, v - cy);
        col = mix(col, [236, 236, 232], smoothstep(0.011, 0.004, d));
      }

      const fogAmt = clamp((mist - 0.48) * 2.3);
      col = mix(col, c.mist, fogAmt * 0.5);
      return col;
    },
  };
}

// ------------------------------------------- ridge silhouettes + figure
// The About portrait: a figure on a ridge with a drone, shot from behind.
export function photographerRidge(seed) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 4, gain: 0.48 });
  const ridged = makeRidged(makeNoise(seed + 2), { octaves: 4 });
  const cloud = makeFbm(makeNoise(seed + 7), { octaves: 4 });

  const ridge = (u, band, amp, base, freq) =>
    base - (ridged(u * freq + band * 17, band * 3.1) * amp
      + fbm(u * freq * 2.2 + band * 5, band) * amp * 0.4);

  // The figure stands on the middle ridge. Its feet are pinned to that
  // ridge's actual silhouette height so it never floats.
  const FIG_U = 0.38;
  const FIG_BAND = 2;
  const FOOT = ridge(FIG_U, FIG_BAND, 0.045 + FIG_BAND * 0.03, 0.40 + FIG_BAND * 0.175, 0.9 + FIG_BAND * 0.35);
  const FIG_H = 0.145; // full height as a fraction of the frame

  // Seen from behind: small in the landscape, which is the point of the shot.
  const figure = (u, v) => {
    const t = (FOOT - v) / FIG_H;        // 0 at the feet, 1 at the top of the head
    if (t < 0 || t > 1) return 0;
    const fx = (u - FIG_U) / (FIG_H * 0.52);

    if (t > 0.82) return Math.hypot(fx * 1.25, (t - 0.895) * 2.9) < 0.30 ? 1 : 0; // head
    if (t > 0.76) return Math.abs(fx) < 0.13 ? 1 : 0;                              // neck
    if (t > 0.40) {
      // Shoulders slope down into the waist.
      const k = (0.76 - t) / 0.36;
      const halfW = lerp(0.50, 0.34, k) - (t > 0.72 ? (t - 0.72) * 2.2 : 0);
      if (Math.abs(fx) < halfW) return 1;
      // Forearm raised to the right, holding the controller.
      if (t > 0.56 && t < 0.70 && fx > halfW - 0.04 && fx < halfW + 0.34) return 1;
    }
    if (t > 0.30 && t <= 0.44 && Math.abs(fx) < 0.40) return 1;                    // pack
    if (t <= 0.42) {
      const k = t / 0.42;
      if (Math.abs(Math.abs(fx) - lerp(0.20, 0.13, k)) < lerp(0.11, 0.14, k)) return 1; // legs
    }
    return 0;
  };

  // Quadcopter silhouette, small and high.
  const drone = (u, v) => {
    const dx = (u - 0.655) / 0.052;
    const dy = (v - 0.285) / 0.052;
    if (Math.abs(dx) < 0.34 && Math.abs(dy) < 0.13) return 1; // body
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        if (Math.abs(dx - sx * 0.62) < 0.34 && Math.abs(dy - sy * 0.34) < 0.045) return 1; // rotor
        const ax = dx - sx * 0.33;
        const ay = dy - sy * 0.18;
        if (Math.abs(ax * 0.55 - ay) < 0.07 && Math.abs(ax) < 0.34) return 1; // arm
      }
    }
    return 0;
  };

  return {
    primary: 'depth',
    smooth: 0.02,
    relief: 0.15,
    fields: {
      // Which receding ridge band a pixel belongs to (0 sky .. 1 nearest).
      depth: (x, y, u, v) => {
        for (let b = 3; b >= 1; b--) {
          const base = 0.40 + b * 0.175;
          const amp = 0.045 + b * 0.03;
          if (v > ridge(u, b, amp, base, 0.9 + b * 0.35)) return b / 3;
        }
        return 0;
      },
      mist: (x, y, u, v) => cloud(u * 2.0, v * 2.8),
      rock: (x, y) => fbm(x * 12, y * 12),
    },
    color({ depth, mist, rock }, nx, ny, u, v) {
      const c = P.alpine;
      let col;
      if (depth === 0) {
        col = ramp([[0, hex('#d5dde1')], [1, c.fog]], clamp(v * 2.4));
      } else {
        // Nearer ridges sit darker and carry more texture.
        const t = 1 - depth;
        col = mix(hex('#1a2127'), c.fog, t * 0.7);
        col = mix(col, hex('#0d1115'), (rock - 0.5) * 0.2 * depth);
      }
      const fogAmt = clamp((mist - 0.42) * 2.0) * smoothstep(0.05, 0.7, v);
      col = mix(col, c.fog, fogAmt * 0.5 * (1 - depth * 0.4));

      if (figure(u, v)) col = mix(hex('#080b0e'), col, 0.05);
      if (drone(u, v)) col = mix(hex('#0a0e12'), col, 0.12);
      return col;
    },
  };
}


// ------------------------------------------------------------ ridge vista
// Receding ridgelines separated by fog banks - the view from altitude, just
// after sunrise. Used wherever the site needs a wide cinematic backdrop.
export function ridgeVista(seed, { bands = 6, fog = 1, sky = '#c9d4da' } = {}) {
  const n = makeNoise(seed);
  const fbm = makeFbm(n, { octaves: 4, gain: 0.5 });
  const ridged = makeRidged(makeNoise(seed + 2), { octaves: 4, gain: 0.5 });
  const cloud = makeFbm(makeNoise(seed + 7), { octaves: 4 });
  const tex = makeFbm(makeNoise(seed + 13), { octaves: 3 });

  // Silhouette height of band b at horizontal position u.
  const line = (u, b) => {
    const base = 0.30 + (b / bands) * 0.62;
    const amp = 0.035 + (b / bands) * 0.11;
    const freq = 0.8 + b * 0.45;
    const peaks = ridged(u * freq + b * 19.3, b * 7.1);
    const roll = fbm(u * freq * 0.45 + b * 3.7, b * 2.3);
    return base - (peaks * amp + (roll - 0.5) * amp * 1.1);
  };

  return {
    primary: 'depth',
    smooth: 0.03,
    relief: 0.12,
    fields: {
      depth: (x, y, u, v) => {
        for (let b = bands; b >= 1; b--) if (v > line(u, b)) return b / bands;
        return 0;
      },
      // Distance below this band's own crest, which shades each ridge face.
      drop: (x, y, u, v) => {
        for (let b = bands; b >= 1; b--) if (v > line(u, b)) return clamp((v - line(u, b)) * 4.2);
        return 0;
      },
      mist: (x, y, u, v) => cloud(u * 2.2, v * 3.4),
      tex: (x, y) => tex(x * 9, y * 9),
    },
    color({ depth, drop, mist, tex: tx }, nx, ny, u, v) {
      const c = P.alpine;
      let col;

      if (depth === 0) {
        // Sky: brightest just above the farthest ridge.
        col = ramp([[0, hex('#aebcc6')], [0.65, hex(sky)], [1, hex('#e2e7e9')]], clamp(v * 1.9));
      } else {
        // Nearer ridges are darker and warmer; far ones dissolve into haze.
        const near = depth;
        col = mix(c.fog, hex('#161d24'), near ** 0.85);
        // Each face falls off from its own crest.
        col = mix(col, hex('#0c1116'), clamp(drop) * 0.35 * near);
        col = mix(col, c.fog, (1 - clamp(drop * 1.6)) * 0.3 * (1 - near));
        // Texture only survives on the nearest two bands.
        col = mix(col, hex('#0b0f13'), (tx - 0.5) * 0.22 * smoothstep(0.55, 1, near));
      }

      // Fog banks settle into the gaps between ridges.
      const bankAmt = clamp((mist - 0.4) * 2.1) * smoothstep(0.02, 0.5, v);
      col = mix(col, c.fog, bankAmt * 0.55 * (1 - depth * 0.55) * fog);
      // A low horizontal fog sheet reading as the valley floor.
      const sheet = smoothstep(0.34, 0.52, v) * smoothstep(0.92, 0.6, v);
      col = mix(col, c.fog, sheet * 0.22 * fog * (1 - depth * 0.5));
      return col;
    },
  };
}

export const SCENES = { coast, city, desert, estate, alpine, ridgeVista, forestRoad, photographerRidge };

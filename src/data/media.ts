import manifest from './media-manifest.json';

/**
 * Central media registry.
 *
 * Every image on the site is resolved through this file. The files under
 * `/public/images` are procedurally generated placeholders (see
 * `scripts/generate-placeholders.mjs`) so the site makes no external requests.
 *
 * To move to real aerial photography: drop your file at the same path under
 * `/public/images`, then update `width`/`height` here (and delete the `blur`
 * value, or regenerate it). Nothing else in the codebase needs to change.
 */
export type MediaAsset = {
  src: string;
  width: number;
  height: number;
  /** Inline 20px preview used for the blur-up transition. Optional. */
  blur?: string;
  alt: string;
};

type MediaKey = keyof typeof manifest;

const ALT: Record<MediaKey, string> = {
  heroBackground: 'Mountain ridgelines receding into layers of morning fog, seen from altitude',
  heroCard: 'Aerial view of a turquoise shoreline meeting pale sand',
  projectCoast: 'Aerial view of surf breaking along a curved stretch of coastline',
  projectCity: 'Dense city blocks and avenues photographed straight down from altitude',
  projectDesert: 'Long dune crests raking across desert sand in low sunlight',
  projectEstate: 'Aerial view of a property set among trees with a pool and drive',
  featured: 'Wide aerial view of a coastline, shot from altitude',
  aboutPortrait: 'A lone figure on a ridge flying a drone above layered mountains',
  stateCoast: 'Aerial view of shallow water over a reef',
  stateCity: 'Aerial view of a city grid at dusk',
  stateLand: 'Aerial view of a road winding through dense forest',
  servicesAccent: 'A road curving through dense forest, seen from above',
  ctaBackground: 'A single vehicle on a road threading through misted forest, seen from above',
  footerThumb: 'Distant mountain ridges fading into haze',
  ogImage: 'Skyframe — aerial photography and cinematography',
};

function build(): Record<MediaKey, MediaAsset> {
  const out = {} as Record<MediaKey, MediaAsset>;
  for (const key of Object.keys(manifest) as MediaKey[]) {
    out[key] = { ...manifest[key], alt: ALT[key] };
  }
  return out;
}

export const media = build();

/**
 * The drone's flight plan.
 *
 * Waypoints are declared per *section* rather than as absolute page
 * percentages, then resolved against the sections' measured offsets at
 * runtime. Section heights change with viewport and content, so hard-coded
 * page percentages would drift out of sync with the thing the drone is
 * supposed to be pointing at.
 *
 * Coordinates are viewport-relative, not world units:
 *   x, y  -1..1, a fraction of the visible half-extent *at that depth*
 *   z     world depth; camera sits at CAMERA_Z looking at the origin, so
 *         more negative is further away and smaller on screen.
 * Resolving x/y against the frustum at each point's own depth keeps the
 * composition intact from ultrawide down to a phone.
 */

export const CAMERA_Z = 12;
export const CAMERA_FOV = 35;

export type Waypoint = {
  /** Section id this point belongs to, matching `data-flight` in the DOM. */
  section: string;
  /** Position within that section, 0 = its top reaches the viewport top. */
  at: number;
  x: number;
  y: number;
  z: number;
};

/**
 * The narrative. Each section gets a "flight moment"; between them the drone
 * is deliberately parked far back, because a drone that never stops moving
 * stops reading as a camera and starts reading as decoration.
 */
export const FLIGHT_PLAN: Waypoint[] = [
  // Hero — arrives beside the card, then works the sequence.
  //
  // The card spans roughly x -0.64..0.64 on a desktop viewport, so the drone
  // has to hold the margins or the air above the headline. Parked any closer
  // to centre it is simply behind the card and invisible.
  { section: 'hero', at: 0.00, x: 0.82, y: 0.22, z: -3.5 },
  { section: 'hero', at: 0.14, x: 0.86, y: 0.34, z: -4.5 },
  { section: 'hero', at: 0.32, x: -0.80, y: 0.30, z: -6.0 },
  { section: 'hero', at: 0.54, x: 0.84, y: -0.30, z: -5.0 },
  { section: 'hero', at: 0.78, x: -0.30, y: 0.76, z: -9.0 },
  { section: 'hero', at: 1.00, x: -0.05, y: 0.92, z: -14.0 },

  // Portfolio — crosses the grid, high and wide so it never sits on a card.
  { section: 'work', at: 0.00, x: 0.62, y: 0.50, z: -16 },
  { section: 'work', at: 0.35, x: 0.72, y: 0.12, z: -12 },
  { section: 'work', at: 0.70, x: -0.62, y: -0.12, z: -13 },
  { section: 'work', at: 1.00, x: -0.55, y: 0.32, z: -18 },

  // Services — one subtle pass, left to right, behind the rows.
  { section: 'services', at: 0.00, x: -0.82, y: 0.36, z: -14 },
  { section: 'services', at: 0.50, x: 0.00, y: -0.04, z: -9 },
  { section: 'services', at: 1.00, x: 0.82, y: 0.26, z: -14 },

  // Featured — moves toward the plate, then yields to it.
  { section: 'featured', at: 0.00, x: 0.74, y: 0.42, z: -15 },
  { section: 'featured', at: 0.45, x: 0.18, y: 0.06, z: -6 },
  { section: 'featured', at: 1.00, x: -0.50, y: 0.36, z: -13 },

  // About — at rest. There is nothing here for it to do.
  { section: 'about', at: 0.00, x: -0.70, y: 0.40, z: -17 },
  { section: 'about', at: 1.00, x: -0.76, y: 0.26, z: -19 },

  // Visual statement — crosses the composition slowly, observing.
  { section: 'statement', at: 0.00, x: 0.92, y: 0.30, z: -12 },
  { section: 'statement', at: 0.50, x: 0.02, y: 0.00, z: -7 },
  { section: 'statement', at: 1.00, x: -0.92, y: 0.24, z: -12 },

  // Clients / testimonials — parked, far back.
  { section: 'clients', at: 0.00, x: -0.80, y: 0.44, z: -20 },
  { section: 'clients', at: 1.00, x: -0.74, y: 0.40, z: -21 },

  // CTA — the exit. Slows, turns away, shrinks into the distance.
  { section: 'contact', at: 0.00, x: 0.48, y: 0.30, z: -13 },
  { section: 'contact', at: 0.55, x: 0.12, y: 0.16, z: -20 },
  { section: 'contact', at: 1.00, x: -0.04, y: 0.34, z: -44 },
];

/** Where the drone starts its entrance, far out and off to one side. */
export const INTRO_START = { x: -0.92, y: 0.70, z: -34 };
/**
 * Mid-point of the entrance. Placed centre-ish and close so the drone crosses
 * *behind* the headline on its way in and emerges at the right margin — the
 * "passes behind AERIAL, comes out near STORIES" beat.
 */
export const INTRO_BEND = { x: -0.10, y: 0.30, z: -6 };

/**
 * Compact viewports get their own plan, not a squeezed copy of the desktop one.
 *
 * On a phone the card is ~92vw, so there are no side margins to fly in: the
 * only clear air is above the headline and below the card. The path is also
 * shorter, shallower and further back, per the brief's instruction that the
 * content stays the priority on small screens.
 */
export const FLIGHT_PLAN_COMPACT: Waypoint[] = [
  { section: 'hero', at: 0.00, x: 0.30, y: 0.80, z: -5 },
  { section: 'hero', at: 0.34, x: -0.34, y: 0.86, z: -6 },
  { section: 'hero', at: 0.68, x: 0.26, y: -0.74, z: -7 },
  { section: 'hero', at: 1.00, x: 0.00, y: 0.92, z: -12 },

  { section: 'work', at: 0.00, x: 0.60, y: 0.72, z: -14 },
  { section: 'work', at: 0.55, x: -0.55, y: 0.60, z: -15 },
  { section: 'work', at: 1.00, x: 0.40, y: 0.70, z: -16 },

  { section: 'services', at: 0.00, x: -0.70, y: 0.66, z: -14 },
  { section: 'services', at: 1.00, x: 0.70, y: 0.58, z: -14 },

  { section: 'featured', at: 0.00, x: 0.62, y: 0.70, z: -14 },
  { section: 'featured', at: 1.00, x: -0.45, y: 0.62, z: -13 },

  { section: 'about', at: 0.00, x: -0.62, y: 0.72, z: -17 },
  { section: 'about', at: 1.00, x: -0.66, y: 0.66, z: -18 },

  { section: 'statement', at: 0.00, x: 0.78, y: 0.55, z: -13 },
  { section: 'statement', at: 0.50, x: 0.05, y: 0.40, z: -10 },
  { section: 'statement', at: 1.00, x: -0.78, y: 0.55, z: -13 },

  { section: 'clients', at: 0.00, x: -0.70, y: 0.70, z: -19 },
  { section: 'clients', at: 1.00, x: -0.66, y: 0.68, z: -20 },

  { section: 'contact', at: 0.00, x: 0.45, y: 0.66, z: -14 },
  { section: 'contact', at: 1.00, x: -0.04, y: 0.80, z: -40 },
];

/** Compact viewports also start the entrance from higher, clear of the card. */
export const INTRO_START_COMPACT = { x: -0.80, y: 0.95, z: -30 };
export const INTRO_BEND_COMPACT = { x: -0.10, y: 0.86, z: -9 };

export type ResolvedPoint = { p: number; x: number; y: number; z: number };

/**
 * Two knots may not share a progress value.
 *
 * Sections tile the page, so one section's `at: 1` lands on exactly the same
 * page progress as the next section's `at: 0` — two different positions
 * demanded at the same instant. Left alone, the zero-length segment blows up
 * the spline's tangents: measured jumps of up to 24 world units at every
 * section boundary, which reads as the drone teleporting.
 *
 * Coincident knots are merged into a single handover point instead.
 */
const KNOT_EPSILON = 0.004;

/**
 * Maps each waypoint's section-relative `at` onto absolute page progress,
 * using measured section ranges. Sections missing from the DOM are skipped
 * rather than collapsing the path to 0.
 */
export function resolvePlan(
  plan: Waypoint[],
  ranges: Map<string, { start: number; end: number }>,
): ResolvedPoint[] {
  const raw: ResolvedPoint[] = [];
  for (const wp of plan) {
    const range = ranges.get(wp.section);
    if (!range) continue;
    raw.push({
      p: range.start + (range.end - range.start) * wp.at,
      x: wp.x,
      y: wp.y,
      z: wp.z,
    });
  }
  raw.sort((a, b) => a.p - b.p);

  const points: ResolvedPoint[] = [];
  for (const point of raw) {
    const last = points[points.length - 1];
    if (last && point.p - last.p < KNOT_EPSILON) {
      // Average the pair into one handover, weighted evenly.
      last.x = (last.x + point.x) / 2;
      last.y = (last.y + point.y) / 2;
      last.z = (last.z + point.z) / 2;
      continue;
    }
    points.push(point);
  }
  return points;
}

/** Centripetal Catmull-Rom: smooth through every waypoint, no overshoot. */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const at = (points: ResolvedPoint[], i: number) =>
  points[Math.min(points.length - 1, Math.max(0, i))];

/** Samples the spline at absolute page progress. */
export function samplePath(points: ResolvedPoint[], p: number, out: { x: number; y: number; z: number }) {
  if (!points.length) return out;
  if (points.length === 1 || p <= points[0].p) {
    out.x = points[0].x;
    out.y = points[0].y;
    out.z = points[0].z;
    return out;
  }
  const last = points[points.length - 1];
  if (p >= last.p) {
    out.x = last.x;
    out.y = last.y;
    out.z = last.z;
    return out;
  }

  let i = 0;
  while (i < points.length - 2 && points[i + 1].p < p) i += 1;

  const a = points[i];
  const b = points[i + 1];
  const span = b.p - a.p;
  const t = span <= 0 ? 0 : (p - a.p) / span;

  const p0 = at(points, i - 1);
  const p3 = at(points, i + 2);
  out.x = catmullRom(p0.x, a.x, b.x, p3.x, t);
  out.y = catmullRom(p0.y, a.y, b.y, p3.y, t);
  out.z = catmullRom(p0.z, a.z, b.z, p3.z, t);
  return out;
}

/** Converts a viewport-relative point to world units at its own depth. */
export function toWorld(
  point: { x: number; y: number; z: number },
  aspect: number,
  out: { x: number; y: number; z: number },
) {
  const halfHeight = Math.tan((CAMERA_FOV * Math.PI) / 360) * (CAMERA_Z - point.z);
  out.x = point.x * halfHeight * aspect;
  out.y = point.y * halfHeight;
  out.z = point.z;
  return out;
}

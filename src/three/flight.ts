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
/**
 * The hero flight. After the hero the drone docks into the navigation, so
 * there are deliberately no waypoints beyond this section.
 *
 * The card spans roughly x -0.64..0.64 on a desktop viewport, so the drone
 * has to hold the margins or the air above the headline. Parked any closer
 * to centre it is simply behind the card and invisible.
 */
export const FLIGHT_PLAN: Waypoint[] = [
  { section: 'hero', at: 0.00, x: 0.82, y: 0.22, z: -3.5 },
  { section: 'hero', at: 0.14, x: 0.86, y: 0.34, z: -4.5 },
  { section: 'hero', at: 0.32, x: -0.80, y: 0.30, z: -6.0 },
  { section: 'hero', at: 0.54, x: 0.84, y: -0.30, z: -5.0 },
  // Drifts toward the top-left, which is where the navigation dock is.
  { section: 'hero', at: 0.80, x: -0.55, y: 0.78, z: -7.0 },
  { section: 'hero', at: 1.00, x: -0.72, y: 0.94, z: -6.0 },
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
  { section: 'hero', at: 1.00, x: -0.60, y: 0.90, z: -6 },
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


/**
 * The dock.
 *
 * Past the hero the drone stops being a camera and becomes part of the
 * chrome: it flies up to the navigation and holds station beside the
 * wordmark, reacting when the visitor crosses into a new section.
 */
export const DOCK_Z = -0.5;
/** On-screen width of the docked drone, in CSS pixels. */
export const DOCK_WIDTH_PX = { comfortable: 54, compact: 40 };
/** Widest span of the model at scale 1, from its bounding box. */
export const MODEL_WIDTH = 0.733;

/**
 * Converts a viewport pixel position into the -1..1 space the flight path
 * uses, so a DOM element can be used as a flight target.
 */
export function pixelToViewportPoint(
  px: number,
  py: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return {
    x: viewportWidth ? (px / viewportWidth) * 2 - 1 : 0,
    y: viewportHeight ? -((py / viewportHeight) * 2 - 1) : 0,
  };
}

/** Scale that renders the model at a given on-screen width at a given depth. */
export function scaleForPixelWidth(
  targetPx: number,
  depth: number,
  viewportHeightPx: number,
) {
  if (!viewportHeightPx) return 1;
  const halfHeight = Math.tan((CAMERA_FOV * Math.PI) / 360) * (CAMERA_Z - depth);
  const worldPerPixel = (halfHeight * 2) / viewportHeightPx;
  return (targetPx * worldPerPixel) / MODEL_WIDTH;
}

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
};

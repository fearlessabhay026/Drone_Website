# Skyframe

A cinematic single-page site for an aerial photography and cinematography studio.

The composition treats the photograph as the hero object — oversized type,
a floating project card that the image breaks out of, layered parallax, and a
scroll-driven visual statement section — rather than the usual
navbar-headline-image-cards stack.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Lucide ·
Three.js · React Three Fiber

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm run lint
npm run images     # regenerate the placeholder photography
npm run model <src.glb>   # re-compress the drone model
```

## Structure

```
src/
  data/
    site.ts              all copy, projects, services, testimonials
    media.ts             central image registry (every image resolves here)
    media-manifest.json  generated: paths, dimensions, blur placeholders
  components/
    Navbar, Hero, FloatingProjectCard, PortfolioSection, ProjectCard,
    ServicesSection, FeaturedProject, AboutSection, VisualStatement,
    ClientsSection, Testimonials, BookingCTA, Footer
    ui/                  Figure, Reveal, MagneticButton, Cursor, Grain, SectionLabel
    DroneLayer             mounts the 3D layer, lazily and defensively
  three/
    flight.ts              the flight plan, spline and viewport mapping
    flightStore.ts         scroll progress + section geometry (not React state)
    useFlightDriver.ts     passive scroll listener and re-measurement
    Drone.tsx              model, propellers, banking, hover
    DroneScene.tsx         lighting rig and procedural environment
    DroneStage.tsx         the Canvas — code-split, never in the main bundle
  hooks/                 useMediaQuery, useActiveSection
  lib/motion.ts          the shared motion language — durations, easings, variants
scripts/
  generate-placeholders.mjs   the image generator
  lib/                        noise, scene recipes, render + grading pipeline
```

Content and imagery are kept out of the components. To change what the site
says, edit `src/data/site.ts`; to change what it shows, edit
`src/data/media.ts`.

## The drone

A quadrotor introduces the page, then becomes part of its chrome.

**In the hero** it enters from the far background on an arc, passes behind the
headline, and settles beside the card — only then does the hero reveal. The
five project cards are a depth stack advanced by scroll inside a pinned frame.

**After the hero it docks into the navigation**, holding station beside the
wordmark at ~54px (40px on compact viewports) and reacting with a small lift
and bank each time the visitor crosses into a new section. There is no flight
plan past the hero; the drone has stopped being a camera and become chrome.

**Layering is the art direction.** During the flight the canvas is fixed at
`z-5`: above every section's background plate, below every piece of text and
every card, so the drone flies *behind* the headline and can never obscure
something you are reading. The hero and the visual statement are each pinned
in two separate layers so it can pass between a section's backdrop and its own
copy — `position: sticky` creates a stacking context, so a single pinned
wrapper would flatten both onto one plane.

Once docked, the layer comes forward to `z-55`, because the navigation bar is
opaque when scrolled and would otherwise hide the drone. The canvas never
takes pointer events, so nothing underneath stops being clickable, and it
stays below the mobile menu overlay at `z-60`.

**The hand-off** from flight to dock is measured in viewport heights
(`DOCK_BLEND_SCREENS`), not page progress. A fixed fraction of progress is
hundreds of pixels on a long page, which left a half-docked, oversized drone
hanging around for most of the first screen after the hero.

**The flight plan** (`src/three/flight.ts`) is declared per *section* and
resolved against measured section offsets at runtime, since section heights
move with viewport and content. Coordinates are viewport-relative and resolved
against the camera frustum *at each point's own depth*, which keeps the
composition intact from ultrawide to phone. Compact viewports fly a separate,
simpler plan: a phone's hero card is ~92vw, so there are no side margins and
the only clear air is above the headline.

**Performance.** The model is Draco-compressed from 4.4MB to 223KB, with
duplicate geometry pruned from 157 primitives down to 48 draw calls. Three.js
and the canvas are code-split into a lazy chunk, so the main bundle is
unchanged and the page's HTML and images are never behind WebGL. The Draco
decoder is self-hosted in `public/draco`, keeping the site's zero-external-
request property. Scroll writes one number to a ref and never re-renders React.

**It is never load-bearing.** `useHasArrived()` gates the hero's reveal, and a
2.6s timeout flips it regardless — if WebGL is unsupported, the chunk fails to
load, or the context is lost, the page reveals itself and behaves normally.
An error boundary around the canvas does the same.

**Reduced motion** skips the entrance and the flight entirely: the drone simply
lives in the navigation from the start, and content transitions run as fades.

## The imagery

`public/images` ships **procedurally generated** placeholder photography. It is
rendered offline by `npm run images` — coastlines, dune fields, a raymarched
city grid, ridge vistas — then graded, vignetted and grained through a shared
filmic pipeline. Nothing is fetched from a stock photo service, so the site
makes **zero external requests** (fonts are self-hosted from npm too).

### Replacing it with real photography

1. Drop your file at the same path, keeping the filename:

   ```
   public/images/hero/hero-background.webp
   public/images/projects/the-coast.webp
   ...
   ```

2. Update that entry's `width` / `height` in `src/data/media-manifest.json`,
   and drop its `blur` value (or keep a base64 LQIP of your own).
3. Revise the alt text in `src/data/media.ts`, which is where every image's
   description lives.
4. Run `npm run images:responsive` to rebuild the 640 / 1024 / 1600px
   renditions and `src/data/media-srcset.json`.

Nothing else needs to change — no component imports an image path directly.
Once you have swapped everything, `generate-placeholders.mjs` and `scripts/lib/`
can be deleted; keep `build-responsive.mjs`, `prerender.mjs` and `sharp`.

The social card is `public/images/meta/og-image.jpg` (JPEG, because WebP link
previews are unreliable). It is not produced by the generator — re-export it if
the WebP changes.

Hero and featured imagery loads eagerly (it is the LCP element); everything
else is lazy with a blur-up placeholder and explicit dimensions, so nothing
reflows on load.

## Placeholder content

These are illustrative and marked in `src/data/site.ts` — replace before going
live:

- studio contact details (`email`, `whatsapp`, social URLs)
- the About statistics (50+ / 12+ / 4K+)
- all three testimonials, including the attributed names

Client logos are deliberately not invented. `ClientsSection` renders industry
categories; each entry in `clients` accepts an optional `logo` asset for when
real marks are available.

## Prerendering

`npm run build` renders the page twice: the normal client build, then
`vite build --ssr src/entry-server.tsx`, and `scripts/prerender.mjs` writes
the server-rendered markup (plus font preloads) into `dist/index.html`.
Crawlers, link previews and visitors without JavaScript get the whole page;
`src/main.tsx` hydrates it. The dev server still renders client-side.

- Read browser state through `useMediaQuery` (it is hydration-safe), never in
  a `useState` initialiser or during render.
- Motion renders each entrance at its `initial` state. The `<noscript>` styles
  in `index.html` show the end state instead; if you add an element that
  should stay hidden without JS (like the stacked hero cards), mark it the way
  `data-stack-slide` is.

## Notes

- **Motion.** Everything comes from `src/lib/motion.ts`. `MotionConfig
  reducedMotion="user"` is set at the root, and `Reveal` renders statically
  when motion is reduced, so no text is ever left parked behind its mask.
- **Mobile** is a redesigned composition, not a narrowed desktop one: the type
  sits above the card rather than behind it, metadata simplifies, parallax
  softens, and hover-only content is always visible.
- **Accessibility.** Skip link, one consistent focus ring, labelled controls,
  alt text on every image, and a keyboard-operable mobile menu that traps
  scroll and closes on Escape.

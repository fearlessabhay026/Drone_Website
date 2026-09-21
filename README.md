# Skyframe

A cinematic single-page site for an aerial photography and cinematography studio.

The composition treats the photograph as the hero object — oversized type,
a floating project card that the image breaks out of, layered parallax, and a
scroll-driven visual statement section — rather than the usual
navbar-headline-image-cards stack.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Lucide

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm run lint
npm run images     # regenerate the placeholder photography
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
  hooks/                 useMediaQuery, useActiveSection
  lib/motion.ts          the shared motion language — durations, easings, variants
scripts/
  generate-placeholders.mjs   the image generator
  lib/                        noise, scene recipes, render + grading pipeline
```

Content and imagery are kept out of the components. To change what the site
says, edit `src/data/site.ts`; to change what it shows, edit
`src/data/media.ts`.

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

Nothing else needs to change — no component imports an image path directly.
Once you have swapped everything, `scripts/` and the `sharp` dev dependency can
be deleted.

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

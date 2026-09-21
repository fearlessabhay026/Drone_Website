import { media } from './media';
import type { MediaAsset } from './media';

/**
 * All site copy lives here so components stay presentational.
 *
 * Values marked PLACEHOLDER are illustrative only — replace them with the
 * studio's real details before the site goes live.
 */

export const studio = {
  name: 'Skyframe',
  tagline: 'Aerial Photography & Cinematography',
  strapline: ['New perspectives.', 'Bolder stories.'],
  /** PLACEHOLDER contact details. */
  email: 'hello@skyframe.studio',
  whatsapp: '+91 00000 00000',
  instagram: 'https://instagram.com',
  youtube: 'https://youtube.com',
  footerNote: 'Made for a higher perspective.',
  year: 2026,
} as const;

/**
 * PLACEHOLDER destination for every "book a shoot" action on the site.
 *
 * Every booking control routes through this one value, so swapping in the
 * studio's real address — or a booking form URL, or a wa.me link — is a
 * one-line change here and nothing else needs touching.
 */
export const bookingHref =
  `mailto:${studio.email}?subject=${encodeURIComponent('Shoot enquiry — Skyframe')}`;

export type NavItem = { label: string; href: string; id: string };

export const navigation: NavItem[] = [
  { label: 'Work', href: '#work', id: 'work' },
  { label: 'Services', href: '#services', id: 'services' },
  { label: 'About', href: '#about', id: 'about' },
  { label: 'Contact', href: '#contact', id: 'contact' },
];


export type Project = {
  id: string;
  index: string;
  title: string;
  location: string;
  category: string;
  year: string;
  /** Short line shown when a project is hovered or focused. */
  note: string;
  image: MediaAsset;
  /** Drives the asymmetric editorial layout in the portfolio section. */
  layout: 'wide' | 'offset' | 'full' | 'split';
  accent: string;
};

export const projects: Project[] = [
  {
    id: 'the-coast',
    index: '01',
    title: 'The Coast',
    location: 'Goa, India',
    category: 'Hospitality',
    year: '2026',
    note: 'Shoreline, architecture and movement across three days of shooting.',
    image: media.projectCoast,
    layout: 'wide',
    accent: 'var(--color-tide)',
  },
  {
    id: 'above-the-city',
    index: '02',
    title: 'Above the City',
    location: 'Mumbai, India',
    category: 'Architecture',
    year: '2025',
    note: 'A vertical study of density, shot in the first hour of light.',
    image: media.projectCity,
    layout: 'offset',
    accent: 'var(--color-dusk)',
  },
  {
    id: 'desert-lines',
    index: '03',
    title: 'Desert Lines',
    location: 'Rajasthan, India',
    category: 'Travel',
    year: '2025',
    note: 'Dune geometry at the edge of the golden hour.',
    image: media.projectDesert,
    layout: 'full',
    accent: '#6b5139',
  },
  {
    id: 'the-estate',
    index: '04',
    title: 'The Estate',
    location: 'Delhi NCR, India',
    category: 'Real Estate',
    year: '2026',
    note: 'A property shown from the one angle that explains it.',
    image: media.projectEstate,
    layout: 'split',
    accent: 'var(--color-moss)',
  },
];

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  location: string;
  /** Third metadata line — altitude, year, whatever the frame is known by. */
  meta: string;
  image: MediaAsset;
  /** The portfolio project this slide opens, when it has one. */
  projectId?: string;
};

/**
 * The hero card cycles through these. The opening frame is a film that has no
 * portfolio entry of its own; the rest are the portfolio projects, so the
 * arrows lead somewhere real.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: 'the-highlands',
    eyebrow: 'Aerial film',
    title: 'The Highlands',
    location: 'Uttarakhand · India',
    meta: 'ALT 420M',
    image: media.heroCard,
  },
  ...projects.map((project) => ({
    id: project.id,
    eyebrow: project.category,
    title: project.title,
    location: project.location,
    meta: project.year,
    image: project.image,
    projectId: project.id,
  })),
];

export type Service = {
  index: string;
  title: string;
  description: string;
};

export const services: Service[] = [
  {
    index: '01',
    title: 'Aerial Photography',
    description: 'High-resolution drone photography for brands, properties and destinations.',
  },
  {
    index: '02',
    title: 'Aerial Cinematography',
    description: 'Cinematic drone footage for films, campaigns and commercial productions.',
  },
  {
    index: '03',
    title: 'Real Estate',
    description: 'Premium aerial visuals that show properties from their strongest perspective.',
  },
  {
    index: '04',
    title: 'Hospitality & Travel',
    description: 'Visual storytelling for hotels, resorts, destinations and experiences.',
  },
  {
    index: '05',
    title: 'Commercial',
    description: 'Custom aerial production for brands and creative campaigns.',
  },
];

export const featuredProject = {
  /** The project this section features — drives the index row below it. */
  projectId: 'the-coast',
  title: 'The Coast',
  location: 'Goa / India',
  description: 'A cinematic exploration of coastline, architecture and movement.',
  cta: 'Explore project',
  image: media.featured,
  markers: ['Oceans', 'Cities', 'Landscapes', 'Beyond'],
} as const;

export const about = {
  eyebrow: 'About the studio',
  statement: 'We create images from perspectives people rarely get to see.',
  body: [
    'Skyframe is a small aerial studio working across coastlines, cities and landscapes. We fly, shoot and grade every frame ourselves, which keeps the work consistent from the first scout to the final delivery.',
    'The brief is usually the same: show this place the way nobody has seen it. The answer is rarely the obvious angle.',
  ],
  image: media.aboutPortrait,
  /** PLACEHOLDER figures — replace with the studio's real numbers. */
  stats: [
    { value: '50+', label: 'Projects' },
    { value: '12+', label: 'Locations' },
    { value: '4K+', label: 'Aerial frames' },
  ],
} as const;

export type StatementState = {
  id: string;
  index: string;
  label: string;
  image: MediaAsset;
  background: string;
  caption: string;
};

export const statementStates: StatementState[] = [
  {
    id: 'coast',
    index: '01',
    label: 'Coast',
    image: media.stateCoast,
    background: '#0d2329',
    caption: 'Where the water turns.',
  },
  {
    id: 'city',
    index: '02',
    label: 'City',
    image: media.stateCity,
    background: '#1c1b18',
    caption: 'Where the grid resolves.',
  },
  {
    id: 'land',
    index: '03',
    label: 'Land',
    image: media.stateLand,
    background: '#141d16',
    caption: 'Where the road disappears.',
  },
];

/**
 * Client categories rather than invented logos. When real client logos are
 * provided, add a `logo` field here and render it in ClientsSection.
 */
export type Client = { label: string; icon: 'building2' | 'hotel' | 'landmark' | 'compass' | 'clapperboard' | 'sparkles'; logo?: MediaAsset };

export const clients: Client[] = [
  { label: 'Real Estate', icon: 'building2' },
  { label: 'Hotels', icon: 'hotel' },
  { label: 'Architecture', icon: 'landmark' },
  { label: 'Travel', icon: 'compass' },
  { label: 'Film', icon: 'clapperboard' },
  { label: 'Brands', icon: 'sparkles' },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

/** PLACEHOLDER testimonials — replace with real, attributed client quotes. */
export const testimonials: Testimonial[] = [
  {
    quote: 'The aerial perspective completely changed how we presented the property.',
    name: 'Client name',
    role: 'Real estate developer',
    initials: 'RM',
  },
  {
    quote: 'They found an angle on the resort that our last three shoots had missed entirely.',
    name: 'Client name',
    role: 'Hospitality group',
    initials: 'AS',
  },
  {
    quote: 'Calm on set, precise in the air, and the grade came back better than the brief.',
    name: 'Client name',
    role: 'Commercial director',
    initials: 'NK',
  },
];

export const booking = {
  eyebrow: "Let's collaborate",
  title: ["Let's take it", 'higher.'],
  body: 'Have a project that needs a different perspective?',
  primary: { label: 'Book a shoot', href: bookingHref },
  secondary: { label: 'View work', href: '#work' },
  markers: ['Ideas', 'Landscapes', 'Brands', 'To new heights'],
  image: media.ctaBackground,
} as const;

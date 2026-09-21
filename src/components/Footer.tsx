import { ArrowUpRight } from 'lucide-react';
import { media } from '../data/media';
import { navigation, studio } from '../data/site';
import { Figure } from './ui/Figure';

// Named rather than badged: lucide dropped brand marks, and reproducing them
// here would be a trademark question the site does not need to answer.
const social = [
  { label: 'Instagram', href: studio.instagram, external: true },
  { label: 'YouTube', href: studio.youtube, external: true },
  { label: 'Email', href: `mailto:${studio.email}`, external: false },
  { label: 'WhatsApp', href: `https://wa.me/${studio.whatsapp.replace(/\D/g, '')}`, external: true },
];

export function Footer() {
  return (
    <footer className="relative border-t border-bone/8 px-4 pt-16 pb-10 sm:px-6 lg:pt-20">
      <div className="mx-auto max-w-[112rem]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="text-display text-[clamp(1.75rem,4vw,2.75rem)]">{studio.name}</p>
            <p className="mt-3 text-sm text-ash">{studio.tagline}</p>

            <p className="mt-10 text-lg leading-snug text-bone/85">
              {studio.strapline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>

            <ul className="mt-8 flex flex-wrap items-center gap-2">
              {social.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                    className="text-meta group flex items-center gap-2 rounded-full border border-bone/15 px-4 py-2.5 text-[9px] text-ash transition-colors duration-300 hover:bg-bone hover:text-ink"
                  >
                    {item.label}
                    <ArrowUpRight
                      size={11}
                      strokeWidth={1.5}
                      aria-hidden
                      className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <ul className="flex flex-col gap-3">
              {navigation.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="text-sm text-ash transition-colors duration-300 hover:text-bone"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <Figure
              asset={media.footerThumb}
              sizes="(max-width: 1024px) 100vw, 30vw"
              className="aspect-[3/2] w-full rounded-xl"
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-bone/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-meta text-[9px] text-ash">
            © {studio.year} {studio.name}. All rights reserved.
          </p>
          <p className="text-meta text-[9px] text-ash">{studio.footerNote}</p>
        </div>
      </div>
    </footer>
  );
}

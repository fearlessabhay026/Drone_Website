import * as motionReact from 'motion/react';
import { Building2, Hotel, Landmark, Compass, Clapperboard, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clients } from '../data/site';
import { SectionLabel } from './ui/SectionLabel';
import { Reveal } from './ui/Reveal';
import { inViewSoft } from '../lib/motion';

const { motion } = motionReact;

const ICONS: Record<string, LucideIcon> = {
  building2: Building2,
  hotel: Hotel,
  landmark: Landmark,
  compass: Compass,
  clapperboard: Clapperboard,
  sparkles: Sparkles,
};

/**
 * Client categories, not invented logos. Each entry accepts an optional
 * `logo` asset — when real client marks arrive, render it in place of the
 * icon and nothing else changes.
 */
export function ClientsSection() {
  return (
    <section
      aria-labelledby="clients-heading"
      data-flight="clients"
      className="relative z-10 border-t border-bone/8 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-[112rem]">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel>Clients</SectionLabel>
            <h2
              id="clients-heading"
              className="text-display text-edge mt-7 text-[clamp(2rem,5.5vw,4.25rem)]"
            >
              <Reveal>Built for</Reveal>
              <Reveal delay={0.08}>visionary teams.</Reveal>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ash lg:col-span-4 lg:col-start-9">
            Trusted by creators, businesses and industries that think bigger.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-bone/10 bg-bone/10 lg:mt-20 lg:grid-cols-6">
          {clients.map((client, index) => {
            const Icon = ICONS[client.icon];
            return (
              <motion.li
                key={client.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={inViewSoft}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
                className="group flex flex-col items-center gap-4 bg-ink px-3 py-9 transition-colors duration-500 hover:bg-ink-soft"
              >
                <Icon
                  size={20}
                  strokeWidth={1}
                  aria-hidden
                  className="text-ash transition-colors duration-500 group-hover:text-bone"
                />
                <span className="text-meta text-center text-[9px] text-ash transition-colors duration-500 group-hover:text-bone">
                  {client.label}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

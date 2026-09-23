import { useCallback, useState } from 'react';
import * as motionReact from 'motion/react';
import { Menu, X } from 'lucide-react';
import { navigation, studio } from '../data/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { useDialog } from '../hooks/useDialog';
import { ease, swift } from '../lib/motion';

const { motion, AnimatePresence, useScroll, useMotionValueEvent } = motionReact;

const SECTION_IDS = navigation.map((item) => item.id);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 64);
  });

  // Scroll lock, Escape, focus trap and focus restore all live in one place.
  const close = useCallback(() => setOpen(false), []);
  const menuRef = useDialog(open, close);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        // Early, not last: the navigation and its CTA must be usable while
        // the rest of the hero is still settling.
        transition={{ duration: 0.7, ease, delay: 0.15 }}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6"
      >
        <nav
          aria-label="Primary"
          className={`mx-auto flex max-w-[112rem] items-center justify-between gap-4 rounded-full border px-4 py-2.5 transition-colors duration-500 sm:px-5 ${
            scrolled
              ? 'surface-glass border-bone/12'
              : 'border-transparent bg-transparent backdrop-blur-none'
          }`}
        >
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#top"
              className="text-meta -my-3.5 py-3.5 text-bone transition-opacity hover:opacity-70"
            >
              {studio.name}
            </a>
            {/* Landing pad. The drone flies here once the hero is behind us
                and holds station for the rest of the page. Reserving the
                space in layout keeps the wordmark from shifting when it
                arrives. */}
            <span
              aria-hidden
              data-drone-dock
              className="block h-6 w-9 shrink-0 sm:h-7 sm:w-12"
            />
          </div>

          {/* Desktop navigation pills */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`text-meta relative block rounded-full px-4 py-2 transition-colors duration-300 ${
                      isActive ? 'text-ink' : 'text-ash hover:text-bone'
                    }`}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-bone"
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className="text-meta hidden rounded-full bg-bone px-5 py-2.5 text-ink transition-colors duration-300 hover:bg-white sm:block"
            >
              Book a shoot
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="flex size-10 items-center justify-center rounded-full border border-bone/15 text-bone transition-colors hover:bg-bone/10 lg:hidden"
            >
              <Menu size={16} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={swift}
            className="fixed inset-0 z-60 overflow-y-auto bg-ink/96 backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex min-h-full flex-col px-6 pt-6 pb-10">
              <div className="flex items-center justify-between">
                <span className="text-meta text-bone">{studio.name}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="flex size-10 items-center justify-center rounded-full border border-bone/15 text-bone"
                >
                  <X size={16} strokeWidth={1.5} aria-hidden />
                </button>
              </div>

              <ul className="mt-auto mb-auto flex flex-col gap-1 py-8">
                {navigation.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.06 * index + 0.08 }}
                  >
                    <a
                      href={item.href}
                      onClick={close}
                      className="text-display block py-2 text-[clamp(2.75rem,13vw,4.5rem)] text-bone"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <a
                href="#contact"
                onClick={close}
                className="text-meta block rounded-full bg-bone px-6 py-4 text-center text-ink"
              >
                Book a shoot
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

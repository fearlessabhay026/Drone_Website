import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input',
  'select',
  'textarea',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ');

/**
 * Everything a modal surface owes the keyboard: the page behind it stops
 * scrolling, Escape closes it, Tab stays inside it, and focus returns to
 * whatever opened it. Shared by the mobile menu and the project dialog so
 * the two behave identically.
 */
export function useDialog(open: boolean, onClose: () => void): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement as HTMLElement | null;

    // Move focus into the surface ourselves rather than letting a child claim
    // it with `autoFocus` — a child that grabs focus during the same commit
    // runs before this effect, and we would then record *it* as the opener
    // and hand focus to a node that is about to be unmounted.
    const surface = ref.current;
    if (surface) {
      surface.setAttribute('tabindex', '-1');
      surface.focus({ preventScroll: true });
    }

    // Lock the page without letting it jump: the scrollbar's width is handed
    // back as padding so nothing reflows underneath the overlay.
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !ref.current) return;

      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!ref.current.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (active === ref.current) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
      opener.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

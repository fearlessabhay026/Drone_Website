import type { ReactNode } from 'react';

/** The small tracked caption that opens most sections. */
export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-meta flex items-center gap-3 text-ash ${className}`}>
      <span aria-hidden className="h-px w-6 bg-ash/40" />
      {children}
    </span>
  );
}

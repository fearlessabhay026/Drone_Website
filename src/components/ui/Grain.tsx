/** Static film grain overlay. Purely decorative, never interactive. */
export function Grain({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`grain pointer-events-none absolute inset-0 ${className}`} />;
}

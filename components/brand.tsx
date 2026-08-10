import { cn } from "@/lib/utils";

/**
 * Cadence mark — three bars of decreasing height, a lesson finding its rhythm.
 * Drawn rather than an icon-font glyph so it stays crisp at 16px.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("size-4", className)} aria-hidden>
      <rect x="1" y="6" width="2.6" height="4" rx="1.3" fill="currentColor" opacity="0.45" />
      <rect x="5.4" y="2.5" width="2.6" height="11" rx="1.3" fill="currentColor" />
      <rect x="9.8" y="4.5" width="2.6" height="7" rx="1.3" fill="currentColor" opacity="0.7" />
      <rect x="14" y="7" width="2" height="2" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Mark className="text-accent" />
      <span className="text-[13px] font-semibold tracking-[-0.02em] text-ink">Cadence</span>
    </span>
  );
}

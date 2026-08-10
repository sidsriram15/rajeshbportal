"use client";

import { cn } from "@/lib/utils";

/**
 * Audio-activity indicator. Purely presentational — CSS-driven so it costs
 * nothing while the session runs.
 */
export function Waveform({
  active = true,
  bars = 14,
  className,
}: {
  active?: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex h-4 items-center gap-[2px]", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-[2px] origin-center rounded-full",
            active ? "animate-bar bg-answer/70" : "bg-line-strong"
          )}
          style={
            active
              ? {
                  height: `${6 + ((i * 7) % 10)}px`,
                  animationDelay: `${(i % 7) * 110}ms`,
                  animationDuration: `${700 + ((i * 13) % 500)}ms`,
                }
              : { height: "4px" }
          }
        />
      ))}
    </span>
  );
}

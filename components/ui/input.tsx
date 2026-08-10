"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-8 w-full rounded border border-line bg-surface px-2.5 text-[13px] text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-none rounded border border-line bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink">{label}</span>
        {hint ? <span className="text-2xs text-faint">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

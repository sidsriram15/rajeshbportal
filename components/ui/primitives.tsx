"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

/* ------------------------------------------------------------------ Avatar */

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "size-5 text-[9px]",
    sm: "size-6 text-[10px]",
    md: "size-8 text-[11px]",
    lg: "size-11 text-sm",
  } as const;
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded font-medium tracking-wide",
        sizes[size],
        className
      )}
      style={
        color
          ? { backgroundColor: `hsl(${color} / 0.14)`, color: `hsl(${color})` }
          : undefined
      }
    >
      <AvatarPrimitive.Fallback
        className={cn(
          "flex size-full items-center justify-center",
          !color && "bg-ink/[0.07] text-muted"
        )}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/* ------------------------------------------------------------------- Badge */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-2xs font-medium leading-4 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-line bg-canvas text-muted",
        accent: "border-accent/25 bg-accent/[0.08] text-accent",
        topic: "border-topic/25 bg-topic/[0.08] text-topic",
        question: "border-question/25 bg-question/[0.08] text-question",
        answer: "border-answer/25 bg-answer/[0.08] text-answer",
        resource: "border-resource/25 bg-resource/[0.08] text-resource",
        live: "border-live/30 bg-live/[0.09] text-live",
        outline: "border-line-strong bg-transparent text-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/* --------------------------------------------------------------- Separator */

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <SeparatorPrimitive.Root
      decorative
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}

/* -------------------------------------------------------------------- Tabs */

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex items-center gap-0.5 border-b border-line", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative -mb-px inline-flex items-center gap-1.5 border-b-[1.5px] border-transparent px-2.5 pb-2 pt-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("animate-fade-up focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

/* ----------------------------------------------------------------- Tooltip */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  children,
  label,
  side = "bottom",
  shortcut,
}: {
  children: React.ReactNode;
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  shortcut?: string;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 flex items-center gap-1.5 rounded border border-line bg-raised px-2 py-1 text-2xs text-ink shadow-pop data-[state=delayed-open]:animate-fade-up"
        >
          {label}
          {shortcut ? <span className="kbd">{shortcut}</span> : null}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ Switch */

export function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-line bg-line/60 transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 translate-x-[1px] rounded-full bg-surface shadow-card transition-transform data-[state=checked]:translate-x-[15px]" />
    </SwitchPrimitive.Root>
  );
}

/* --------------------------------------------------------------- Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded bg-ink/[0.06]", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-ink/[0.05] to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------------- Empty state */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-8" : "gap-3 py-16"
      )}
    >
      <div className="relative">
        <div className="grid-paper absolute -inset-6 rounded-full opacity-60 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
        <div className="relative grid size-9 place-items-center rounded border border-line bg-surface text-faint shadow-card">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        {description ? (
          <p className="mx-auto max-w-[38ch] text-xs leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------ Meter (bars) */

const meterTones = {
  accent: "bg-accent",
  topic: "bg-topic",
  question: "bg-question",
  answer: "bg-answer",
  resource: "bg-resource",
  ink: "bg-ink/70",
} as const;

/** A quiet tick meter — deliberately used instead of charts. */
export function Meter({
  value,
  tone = "accent",
  ticks = 10,
}: {
  value: number;
  tone?: keyof typeof meterTones;
  ticks?: number;
}) {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * ticks);
  return (
    <span className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: ticks }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-[3px] rounded-[1px] transition-colors duration-300",
            i < filled ? meterTones[tone] : "bg-line-strong/60"
          )}
        />
      ))}
    </span>
  );
}

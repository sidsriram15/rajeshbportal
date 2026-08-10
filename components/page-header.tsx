import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Application header — deliberately small. Titles are labels, not marketing.
 */
export function PageHeader({
  crumbs,
  title,
  meta,
  actions,
  sticky = true,
}: {
  crumbs?: Crumb[];
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "z-20 border-b border-line bg-canvas/85 backdrop-blur",
        sticky && "sticky top-0 md:top-0"
      )}
    >
      <div className="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-2 px-5 py-2.5 lg:px-7">
        <div className="min-w-0 flex-1">
          {crumbs?.length ? (
            <nav className="mb-0.5 flex items-center gap-1 text-2xs text-faint">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {c.href ? (
                    <Link href={c.href} className="transition-colors hover:text-ink">
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < crumbs.length - 1 ? <ChevronRight className="size-3 opacity-60" /> : null}
                </span>
              ))}
            </nav>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink">
              {title}
            </h1>
            {meta}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2.5", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="eyebrow">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

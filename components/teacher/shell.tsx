"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  LayoutGrid,
  Menu as MenuIcon,
  Radio,
  Users,
  Waves,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Avatar, Badge, Tooltip } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { clock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StartSessionDialog } from "@/components/teacher/start-session-dialog";

const nav = [
  { href: "/teacher", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/teacher/students", label: "Students", icon: Users },
  { href: "/teacher/sessions", label: "Sessions", icon: Waves },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { students, sessions, liveId, elapsed } = useStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [startOpen, setStartOpen] = React.useState(false);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  /* Global shortcuts: N starts a session, G+S jumps to students. */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setStartOpen(true);
      }
      /* The students page owns "/" once you are already there. */
      if (e.key === "/" && !e.metaKey && !window.location.pathname.startsWith("/teacher/students")) {
        e.preventDefault();
        router.push("/teacher/students?focus=1");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const liveSession = sessions.find((s) => s.id === liveId);
  const liveStudent = students.find((s) => s.id === liveSession?.studentId);

  const recent = React.useMemo(
    () =>
      [...sessions]
        .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
        .slice(0, 5)
        .map((s) => students.find((st) => st.id === s.studentId))
        .filter((s, i, arr): s is NonNullable<typeof s> => Boolean(s) && arr.indexOf(s) === i)
        .slice(0, 4),
    [sessions, students]
  );

  const isActive = (item: (typeof nav)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const sidebar = (
    <div className="flex h-full flex-col gap-1 px-3 py-3">
      <div className="flex items-center justify-between px-2 py-2">
        <Link href="/teacher" className="rounded transition-opacity hover:opacity-70">
          <Wordmark />
        </Link>
        <button
          className="grid size-6 place-items-center rounded text-faint hover:bg-ink/[0.06] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="px-1 pb-3 pt-1">
        <Button
          variant="primary"
          size="md"
          className="w-full justify-between"
          onClick={() => setStartOpen(true)}
        >
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5" />
            Start session
          </span>
          <span className="kbd border-canvas/25 bg-transparent text-canvas/60">N</span>
        </Button>
      </div>

      <nav className="space-y-px">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-2.5 rounded px-2 py-1.5 text-[13px] font-medium transition-colors duration-150",
              isActive(item)
                ? "bg-ink/[0.06] text-ink"
                : "text-muted hover:bg-ink/[0.04] hover:text-ink"
            )}
          >
            <item.icon
              className={cn(
                "size-4 transition-colors",
                isActive(item) ? "text-accent" : "text-faint group-hover:text-muted"
              )}
            />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-1 px-2">
        <p className="eyebrow px-0.5">Recent students</p>
        <div className="space-y-px pt-1">
          {recent.map((s) => (
            <Link
              key={s.id}
              href={`/teacher/students/${s.id}`}
              className={cn(
                "flex items-center gap-2 rounded px-1 py-1 text-[13px] transition-colors",
                pathname === `/teacher/students/${s.id}`
                  ? "bg-ink/[0.06] text-ink"
                  : "text-muted hover:bg-ink/[0.04] hover:text-ink"
              )}
            >
              <Avatar name={s.name} color={s.color} size="xs" />
              <span className="truncate">{s.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto px-1">
        {liveSession && liveStudent ? (
          <Link
            href={`/session/${liveSession.id}`}
            className="group flex items-center gap-2.5 rounded border border-live/25 bg-live/[0.06] px-2.5 py-2 transition-colors hover:bg-live/[0.1]"
          >
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-live" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-ink">
                {liveStudent.name.split(" ")[0]} · live
              </span>
              <span className="num block text-2xs text-live">{clock(elapsed)}</span>
            </span>
            <ChevronRight className="size-3.5 text-live/60 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 rounded border border-dashed border-line px-2.5 py-2 text-2xs text-faint">
            <span className="size-2 rounded-full border border-line-strong" />
            No session in progress
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 border-r border-line bg-surface/60 md:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[hsl(var(--shadow))]/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[260px] animate-slide-in border-r border-line bg-surface shadow-pop">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-11 items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur md:hidden">
          <button
            className="grid size-7 place-items-center rounded text-muted hover:bg-ink/[0.06]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <MenuIcon className="size-4" />
          </button>
          <Wordmark />
          <div className="ml-auto">
            {liveSession ? (
              <Link href={`/session/${liveSession.id}`}>
                <Badge tone="live" className="num">
                  <span className="size-1.5 animate-pulse rounded-full bg-live" />
                  {clock(elapsed)}
                </Badge>
              </Link>
            ) : (
              <Tooltip label="Start a session" shortcut="N">
                <Button size="sm" variant="primary" onClick={() => setStartOpen(true)}>
                  <Radio className="size-3.5" />
                  Start
                </Button>
              </Tooltip>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <StartSessionDialog open={startOpen} onOpenChange={setStartOpen} />
    </div>
  );
}

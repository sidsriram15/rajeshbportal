"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { Avatar } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The student side is deliberately chrome-light: one bar, one column, no
 * dashboard. They come here to read, not to manage anything.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const { students, viewerId } = useStore();
  const student = students.find((s) => s.id === viewerId) ?? students[0];
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[860px] items-center gap-3 px-5">
          <Link href="/student" className="transition-opacity hover:opacity-70">
            <Wordmark />
          </Link>
          <nav className="ml-3 hidden items-center gap-1 sm:flex">
            <Link
              href="/student"
              className={cn(
                "rounded px-2 py-1 text-[13px] transition-colors",
                pathname === "/student"
                  ? "bg-ink/[0.06] text-ink"
                  : "text-muted hover:bg-ink/[0.04] hover:text-ink"
              )}
            >
              My lessons
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-2xs text-faint sm:inline">{student?.grade}</span>
            <Avatar name={student?.name ?? "Student"} color={student?.color} size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-5 pb-24 pt-7">{children}</main>
    </div>
  );
}

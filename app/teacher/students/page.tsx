"use client";

import * as React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, UserPlus, Users, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, Badge, EmptyState, Tooltip } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddStudentDialog } from "@/components/teacher/add-student-dialog";
import { useStore } from "@/lib/store";
import { relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Subject } from "@/lib/types";

type Sort = "recent" | "name" | "sessions";

export default function StudentsPage() {
  const { students, sessions } = useStore();
  const [query, setQuery] = React.useState("");
  const [subject, setSubject] = React.useState<Subject | "all">("all");
  const [sort, setSort] = React.useState<Sort>("recent");
  const [addOpen, setAddOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  /* "/" from anywhere in the shell lands here with the field focused. */
  React.useEffect(() => {
    if (window.location.search.includes("focus=1")) searchRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enriched = React.useMemo(
    () =>
      students.map((s) => {
        const own = sessions
          .filter((x) => x.studentId === s.id)
          .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
        return {
          student: s,
          count: own.length,
          last: own[0],
          minutes: own.reduce((n, x) => n + x.durationMin, 0),
        };
      }),
    [students, sessions]
  );

  const subjects = React.useMemo(() => {
    const set = new Set<Subject>();
    students.forEach((s) => s.subjects.forEach((x) => set.add(x)));
    return Array.from(set);
  }, [students]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = enriched.filter(({ student }) => {
      const matchesQuery =
        !q ||
        [student.name, student.email, student.grade, student.focus, ...student.subjects]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesSubject = subject === "all" || student.subjects.includes(subject);
      return matchesQuery && matchesSubject;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.student.name.localeCompare(b.student.name);
      if (sort === "sessions") return b.count - a.count;
      return (b.last ? +new Date(b.last.startedAt) : 0) - (a.last ? +new Date(a.last.startedAt) : 0);
    });
    return list;
  }, [enriched, query, subject, sort]);

  return (
    <>
      <PageHeader
        title="Students"
        meta={
          <Badge tone="outline" className="num">
            {students.length}
          </Badge>
        }
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-3.5" />
            Add student
          </Button>
        }
      />

      <div className="mx-auto max-w-[1160px] px-5 py-5 lg:px-7">
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, subject or focus…"
              className="pl-8 pr-8"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded text-faint hover:text-ink"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            ) : (
              <span className="kbd pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                /
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <FilterChip active={subject === "all"} onClick={() => setSubject("all")}>
              All
            </FilterChip>
            {subjects.map((s) => (
              <FilterChip key={s} active={subject === s} onClick={() => setSubject(s)}>
                {s}
              </FilterChip>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <SlidersHorizontal className="size-3.5 text-faint" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-7 rounded border border-line bg-surface px-1.5 text-2xs text-muted outline-none transition-colors hover:border-line-strong focus:border-accent/60"
            >
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
              <option value="sessions">Session count</option>
            </select>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1.5fr)_auto] items-center gap-4 border-b border-line bg-canvas/50 px-4 py-2 text-2xs uppercase tracking-[0.08em] text-faint lg:grid">
            <span>Student</span>
            <span>Subjects</span>
            <span>Last session</span>
            <span className="text-right">Sessions</span>
          </div>

          {rows.map(({ student, count, last, minutes }) => (
            <Link
              key={student.id}
              href={`/teacher/students/${student.id}`}
              className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 border-b border-line px-4 py-3 last:border-b-0 row-hover lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1.5fr)_auto]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={student.name} color={student.color} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{student.name}</p>
                  <p className="truncate text-2xs text-faint">
                    {student.grade} · {student.timezone.split("/")[1]?.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {student.subjects.map((s) => (
                  <Badge key={s} tone="neutral">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="min-w-0">
                {last ? (
                  <>
                    <p className="truncate text-xs text-muted">{last.title}</p>
                    <p className="text-2xs text-faint">{relativeDay(last.startedAt)}</p>
                  </>
                ) : (
                  <p className="text-2xs text-faint">No sessions yet</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <Tooltip label={`${minutes} minutes taught`}>
                  <span className="num text-xs text-muted">{count}</span>
                </Tooltip>
              </div>
            </Link>
          ))}

          {rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query ? `No students match “${query}”` : "No students yet"}
              description={
                query
                  ? "Try a different name, subject, or clear the filters."
                  : "Add your first student to start recording sessions."
              }
              action={
                query ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setSubject("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
                    <UserPlus className="size-3.5" />
                    Add student
                  </Button>
                )
              }
            />
          ) : null}
        </div>
      </div>

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 rounded border px-2.5 text-2xs font-medium transition-colors",
        active
          ? "border-ink/20 bg-ink/[0.07] text-ink"
          : "border-transparent text-muted hover:bg-ink/[0.04] hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Search, UserPlus, Users, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddStudentDialog } from "@/components/teacher/add-student-dialog";
import { useStore } from "@/lib/store";
import { relativeDay, topicLine, totalTimeLabel } from "@/lib/format";

export default function StudentsPage() {
  const { students, sessions, snapshots } = useStore();
  const [query, setQuery] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

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

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .map((student) => {
        const own = sessions
          .filter((s) => s.participants.includes(student.id))
          .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
        return {
          student,
          count: own.length,
          last: own[0],
          seconds: own.reduce((n, s) => n + s.durationSeconds, 0),
        };
      })
      .filter(({ student }) => {
        if (!q) return true;
        const snapshot = snapshots[student.id]?.workingOn ?? "";
        return [student.name, student.username, student.yearGroup ?? "", snapshot]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) =>
          (b.last ? +new Date(b.last.startedAt) : 0) - (a.last ? +new Date(a.last.startedAt) : 0)
      );
  }, [students, sessions, snapshots, query]);

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

      <div className="mx-auto max-w-[1000px] px-5 py-5 lg:px-7">
        <div className="mb-3.5">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
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
        </div>

        <div className="panel overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.8fr)_auto] items-center gap-4 border-b border-line bg-canvas/50 px-4 py-2 text-2xs uppercase tracking-[0.08em] text-faint lg:grid">
            <span>Student</span>
            <span>Last class</span>
            <span className="text-right">Taught</span>
          </div>

          {rows.map(({ student, last, seconds }) => (
            <Link
              key={student.id}
              href={`/teacher/students/${student.id}`}
              className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 border-b border-line px-4 py-3 last:border-b-0 row-hover lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.8fr)_auto]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={student.name} color={student.color} src={student.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{student.name}</p>
                  <p className="truncate text-2xs text-faint">
                    {[student.yearGroup, student.usualSlot].filter(Boolean).join(" · ") ||
                      student.username}
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                {last ? (
                  <>
                    <p className="truncate text-xs text-muted">
                      {topicLine(last) || "No topics detected"}
                    </p>
                    <p className="text-2xs text-faint">{relativeDay(last.startedAt)}</p>
                  </>
                ) : (
                  <p className="text-2xs text-faint">No classes yet</p>
                )}
              </div>

              <div className="num text-right text-xs text-muted">
                {seconds ? totalTimeLabel(seconds) : "—"}
              </div>
            </Link>
          ))}

          {rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query ? `No students match “${query}”` : "No students yet"}
              description={
                query ? undefined : "Add a student and you can start a class with them right away."
              }
              action={
                query ? (
                  <Button size="sm" onClick={() => setQuery("")}>
                    Clear search
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

"use client";

import * as React from "react";
import { Search, Waves } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SessionRow } from "@/components/session-row";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | "draft" | "published";

export default function SessionsPage() {
  const { sessions, students } = useStore();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...sessions]
      .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
      .filter((s) => {
        const student = students.find((x) => x.id === s.studentId);
        const matchesQuery =
          !q ||
          [s.title, s.subject, student?.name ?? "", ...s.topics.map((t) => t.label)]
            .join(" ")
            .toLowerCase()
            .includes(q);
        const matchesFilter =
          filter === "all" ? true : filter === "draft" ? s.status !== "published" : s.status === "published";
        return matchesQuery && matchesFilter;
      });
  }, [sessions, students, query, filter]);

  const groups = React.useMemo(() => {
    const map = new Map<string, typeof rows>();
    rows.forEach((s) => {
      const key = relativeDay(s.startedAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    });
    return Array.from(map.entries());
  }, [rows]);

  const drafts = sessions.filter((s) => s.status !== "published").length;

  return (
    <>
      <PageHeader
        title="Sessions"
        meta={
          <Badge tone="outline" className="num">
            {sessions.length}
          </Badge>
        }
        actions={
          <div className="relative w-44 sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions and topics…"
              className="pl-8"
            />
          </div>
        }
      />

      <div className="mx-auto max-w-[1000px] px-5 py-5 lg:px-7">
        <div className="mb-4 flex items-center gap-1">
          {(
            [
              ["all", `All ${sessions.length}`],
              ["draft", `Needs review ${drafts}`],
              ["published", "Published"],
            ] as Array<[Filter, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "h-7 rounded border px-2.5 text-2xs font-medium transition-colors",
                filter === id
                  ? "border-ink/20 bg-ink/[0.07] text-ink"
                  : "border-transparent text-muted hover:bg-ink/[0.04] hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {groups.map(([label, items]) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="eyebrow">{label}</span>
                <span className="h-px flex-1 bg-line" />
                <span className="num text-2xs text-faint">{items.length}</span>
              </div>
              <div className="panel overflow-hidden">
                {items.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    student={students.find((x) => x.id === s.studentId)}
                    href={s.status === "live" ? `/session/${s.id}` : `/teacher/sessions/${s.id}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {rows.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={Waves}
                title={query ? `Nothing matches “${query}”` : "No sessions here"}
                description={
                  query
                    ? "Search covers session titles, subjects, students and captured topics."
                    : "Sessions appear here once you have taught them."
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

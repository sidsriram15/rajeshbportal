"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { useStore, useVisibleStudentSessions } from "@/lib/store";
import { durationLabel, shortDate, topicLine } from "@/lib/format";

export default function StudentHome() {
  const { students, snapshots, viewerStudentId } = useStore();
  const student = students.find((s) => s.id === viewerStudentId) ?? students[0];
  const sessions = useVisibleStudentSessions(student?.id);
  const snapshot = snapshots[student?.id ?? ""];

  return (
    <div className="space-y-8">
      <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
        {student?.name.split(" ")[0]}
      </h1>

      <section className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <h2 className="eyebrow">Recent classes</h2>
          <span className="h-px flex-1 bg-line" />
        </div>

        {sessions.length ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/student/sessions/${s.id}`}
                className="group block rounded-lg border border-line bg-surface p-4 shadow-card transition-colors duration-150 ease-snap hover:border-line-strong"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-faint">
                      {shortDate(s.startedAt)} · {durationLabel(s.durationSeconds)}
                    </p>
                    <h3 className="mt-1 text-sm font-medium tracking-[-0.01em] text-ink">
                      {topicLine(s, 4) || "Class"}
                    </h3>
                    {s.summary ? (
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                        {s.summary.split("\n\n")[0]}
                      </p>
                    ) : null}
                    <span className="mt-2.5 inline-flex items-center gap-1 text-2xs text-accent">
                      View class
                      <ArrowRight className="size-3 transition-transform duration-150 ease-snap group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              icon={BookOpen}
              title="Nothing here yet"
              description="Your classes appear here after they happen."
            />
          </div>
        )}
      </section>

      {snapshot && sessions.length ? (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <h2 className="eyebrow">Working on</h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <p className="text-[13px] leading-relaxed text-muted">{snapshot.workingOn}</p>
        </section>
      ) : null}
    </div>
  );
}

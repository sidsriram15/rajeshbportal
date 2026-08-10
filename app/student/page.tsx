"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, Clock, MessageSquareQuote } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { useStore, useStudentSessions } from "@/lib/store";
import { dateLabel, relativeDay } from "@/lib/format";

export default function StudentHome() {
  const { students, viewerId } = useStore();
  const student = students.find((s) => s.id === viewerId) ?? students[0];
  const all = useStudentSessions(student?.id);
  const sessions = all.filter((s) => s.status === "published");

  const totalQuestions = sessions.reduce((n, s) => n + s.qa.length, 0);
  const totalMinutes = sessions.reduce((n, s) => n + s.durationMin, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-2xs uppercase tracking-[0.1em] text-faint">{greeting}</p>
        <h1 className="mt-1 text-[19px] font-semibold tracking-[-0.02em] text-ink">
          {student?.name.split(" ")[0]}
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Everything from your lessons — what you covered, the questions you asked, and the answers.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3 shadow-card">
        <Stat icon={BookOpen} value={String(sessions.length)} label="lessons" />
        <Stat icon={Clock} value={`${Math.floor(totalMinutes / 60)}h`} label="of tutoring" />
        <Stat icon={MessageSquareQuote} value={String(totalQuestions)} label="questions asked" />
        {student?.cadence && student.cadence !== "Not scheduled" ? (
          <span className="ml-auto flex items-center gap-1.5 text-2xs text-faint">
            <CalendarClock className="size-3.5" />
            Next up · {student.cadence}
          </span>
        ) : null}
      </div>

      <section className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <h2 className="eyebrow">Your lessons</h2>
          <span className="h-px flex-1 bg-line" />
        </div>

        {sessions.length ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/student/sessions/${s.id}`}
                className="group block rounded-lg border border-line bg-surface p-4 shadow-card transition-all duration-150 ease-snap hover:-translate-y-px hover:border-line-strong hover:shadow-pop"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{s.subject}</Badge>
                      <span className="text-2xs text-faint">
                        {relativeDay(s.startedAt)} · {dateLabel(s.startedAt)}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-sm font-medium tracking-[-0.01em] text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {s.summary.split("\n\n")[0]}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {s.topics.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="rounded-sm border border-line bg-canvas px-1.5 py-px text-2xs text-muted"
                        >
                          {t.label}
                        </span>
                      ))}
                      {s.topics.length > 3 ? (
                        <span className="text-2xs text-faint">+{s.topics.length - 3} more</span>
                      ) : null}
                    </div>
                  </div>

                  <ArrowRight className="mt-1 size-4 shrink-0 text-faint transition-transform duration-150 ease-snap group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>

                <div className="mt-3 flex items-center gap-4 border-t border-line pt-2.5 text-2xs text-faint">
                  <span className="num">{s.durationMin} min</span>
                  <span>
                    <span className="num">{s.qa.length}</span> questions
                  </span>
                  <span>
                    <span className="num">{s.resources.length}</span> resources
                  </span>
                  {s.homework.length ? (
                    <span className="ml-auto text-question">
                      {s.homework.length} practice items
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              icon={BookOpen}
              title="No lessons published yet"
              description="Once your tutor finishes writing up a session, it will appear here with the summary, your questions and every link they shared."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <Icon className="size-3.5 translate-y-0.5 text-faint" />
      <span className="num text-sm font-medium text-ink">{value}</span>
      <span className="text-2xs text-faint">{label}</span>
    </span>
  );
}

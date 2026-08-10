"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CircleAlert,
  FileText,
  HelpCircle,
  Radio,
  Sparkles,
} from "lucide-react";
import { PageHeader, Section } from "@/components/page-header";
import { SessionRow } from "@/components/session-row";
import { Avatar, Badge, EmptyState, Meter, Tooltip } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { StartSessionDialog } from "@/components/teacher/start-session-dialog";
import { useStore } from "@/lib/store";
import { clock, relativeDay, stamp } from "@/lib/format";

export default function TeacherOverview() {
  const { sessions, students, liveId, elapsed } = useStore();
  const [startOpen, setStartOpen] = React.useState(false);

  const byDate = React.useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)),
    [sessions]
  );

  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeek = byDate.filter((s) => +new Date(s.startedAt) > weekAgo && s.status !== "live");
  const minutes = thisWeek.reduce((n, s) => n + s.durationMin, 0);
  const questions = thisWeek.reduce((n, s) => n + s.qa.length, 0);
  const unanswered = sessions.flatMap((s) =>
    s.qa.filter((q) => !q.answer).map((q) => ({ session: s, q }))
  );
  const drafts = sessions.filter((s) => s.status === "draft");
  const live = sessions.find((s) => s.id === liveId);
  const liveStudent = students.find((s) => s.id === live?.studentId);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const upcoming = students
    .filter((s) => s.cadence !== "Not scheduled")
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Overview"
        meta={<span className="text-xs text-faint">{today}</span>}
        actions={
          <Button variant="primary" onClick={() => setStartOpen(true)}>
            <Radio className="size-3.5" />
            Start session
          </Button>
        }
      />

      <div className="mx-auto max-w-[1160px] space-y-7 px-5 py-6 lg:px-7">
        {live && liveStudent ? (
          <Link
            href={`/session/${live.id}`}
            className="group flex items-center gap-4 rounded-lg border border-live/30 bg-live/[0.05] px-4 py-3 transition-colors hover:bg-live/[0.09]"
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-live" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {live.title} · {liveStudent.name}
              </p>
              <p className="text-2xs text-muted">
                Session in progress — {live.topics.length} topics, {live.qa.length} questions
                captured so far
              </p>
            </div>
            <span className="num text-sm text-live">{clock(elapsed)}</span>
            <ArrowUpRight className="size-4 text-live/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ) : null}

        {/* Quiet metrics — numbers, not charts. */}
        <div className="grid grid-cols-2 divide-line rounded-lg border border-line bg-surface shadow-card sm:grid-cols-4 sm:divide-x">
          <Stat label="Sessions this week" value={String(thisWeek.length)} sub={`${students.length} active students`} />
          <Stat
            label="Teaching time"
            value={`${Math.floor(minutes / 60)}h ${minutes % 60}m`}
            sub="across all students"
          />
          <Stat label="Questions captured" value={String(questions)} sub="last seven days" />
          <Stat
            label="Needs review"
            value={String(drafts.length + unanswered.length)}
            sub={`${drafts.length} drafts · ${unanswered.length} unanswered`}
            tone={drafts.length + unanswered.length > 0 ? "warn" : undefined}
          />
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_308px]">
          <div className="space-y-7">
            <Section
              title="Needs your attention"
              description="Sessions that are not finished for the student yet."
            >
              <div className="panel divide-y divide-line">
                {drafts.map((s) => {
                  const st = students.find((x) => x.id === s.studentId);
                  return (
                    <Link
                      key={s.id}
                      href={`/teacher/sessions/${s.id}`}
                      className="flex items-center gap-3 px-4 py-3 row-hover"
                    >
                      <FileText className="size-4 shrink-0 text-question" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{s.title}</p>
                        <p className="text-2xs text-muted">
                          {st?.name} · summary drafted, not published
                        </p>
                      </div>
                      <Badge tone="question">Review</Badge>
                    </Link>
                  );
                })}

                {unanswered.slice(0, 4).map(({ session, q }) => {
                  const st = students.find((x) => x.id === session.studentId);
                  return (
                    <Link
                      key={q.id}
                      href={`/teacher/sessions/${session.id}?tab=questions`}
                      className="flex items-start gap-3 px-4 py-3 row-hover"
                    >
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-question" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{q.question}</p>
                        <p className="text-2xs text-muted">
                          {st?.name} · {relativeDay(session.startedAt)} ·{" "}
                          <span className="num">{stamp(q.at)}</span>
                        </p>
                      </div>
                      <Badge tone="outline">Answer</Badge>
                    </Link>
                  );
                })}

                {drafts.length === 0 && unanswered.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Sparkles}
                    title="Everything is published"
                    description="No draft summaries and no unanswered questions."
                  />
                ) : null}
              </div>
            </Section>

            <Section
              title="Recent sessions"
              action={
                <Link
                  href="/teacher/sessions"
                  className="text-2xs text-muted transition-colors hover:text-ink"
                >
                  View all
                </Link>
              }
            >
              <div className="panel overflow-hidden">
                {byDate.slice(0, 7).map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    student={students.find((x) => x.id === s.studentId)}
                    href={s.status === "live" ? `/session/${s.id}` : `/teacher/sessions/${s.id}`}
                  />
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-7">
            <Section title="Regular schedule">
              <div className="panel divide-y divide-line">
                {upcoming.map((s) => (
                  <Link
                    key={s.id}
                    href={`/teacher/students/${s.id}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 row-hover"
                  >
                    <Avatar name={s.name} color={s.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{s.name}</p>
                      <p className="truncate text-2xs text-faint">{s.cadence}</p>
                    </div>
                    <CalendarClock className="size-3.5 text-faint" />
                  </Link>
                ))}
              </div>
            </Section>

            <Section
              title="Coverage"
              description="How much lesson time each student has had this month."
            >
              <div className="panel space-y-2.5 p-3.5">
                {students.slice(0, 6).map((s) => {
                  const mins = sessions
                    .filter((x) => x.studentId === s.id)
                    .reduce((n, x) => n + x.durationMin, 0);
                  return (
                    <div key={s.id} className="flex items-center gap-2.5">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted">{s.name}</span>
                      <Tooltip label={`${mins} minutes total`}>
                        <span className="flex items-center gap-2">
                          <Meter value={mins / 180} tone="ink" ticks={8} />
                          <span className="num w-9 text-right text-2xs text-faint">{mins}m</span>
                        </span>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        </div>
      </div>

      <StartSessionDialog open={startOpen} onOpenChange={setStartOpen} />
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "warn";
}) {
  return (
    <div className="border-b border-line p-4 last:border-b-0 sm:border-b-0">
      <p className="eyebrow">{label}</p>
      <p
        className={`num mt-1.5 text-[22px] font-medium leading-none tracking-tight ${
          tone === "warn" ? "text-question" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 flex items-center gap-1 text-2xs text-faint">
        {tone === "warn" ? <CircleAlert className="size-3 text-question" /> : null}
        {sub}
      </p>
    </div>
  );
}

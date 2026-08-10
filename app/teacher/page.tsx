"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, Check, Radio, Sparkles, TriangleAlert } from "lucide-react";
import { PageHeader, Section } from "@/components/page-header";
import { SessionRow } from "@/components/session-row";
import { Avatar, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { StartSessionDialog } from "@/components/teacher/start-session-dialog";
import { useStore } from "@/lib/store";
import { clock, relativeDay, topicLine } from "@/lib/format";

export default function TeacherOverview() {
  const { sessions, students, liveId, elapsed, resolveAttention } = useStore();
  const [startOpen, setStartOpen] = React.useState(false);

  const byDate = React.useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)),
    [sessions]
  );

  /* Only genuinely broken classes land here. A finished class needs nothing. */
  const attention = React.useMemo(
    () =>
      sessions.flatMap((session) =>
        session.attention
          .filter((item) => !item.resolvedAt)
          .map((item) => ({ session, item }))
      ),
    [sessions]
  );

  const live = sessions.find((s) => s.id === liveId);
  const liveStudent = students.find((s) => s.id === live?.participants[0]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const scheduled = students.filter((s) => s.usualSlot).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Overview"
        meta={<span className="text-xs text-faint">{today}</span>}
        actions={
          <Button variant="primary" onClick={() => setStartOpen(true)}>
            <Radio className="size-3.5" />
            Start class
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
                Recording · {liveStudent.name}
              </p>
              <p className="truncate text-2xs text-muted">
                {topicLine(live) || "Listening"}
              </p>
            </div>
            <span className="num text-sm text-live">{clock(elapsed)}</span>
            <ArrowUpRight className="size-4 text-live/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ) : null}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_296px]">
          <div className="space-y-7">
            <Section
              title="Needs attention"
              description="Only classes where something actually went wrong."
            >
              <div className="panel divide-y divide-line">
                {attention.map(({ session, item }) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-question" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/teacher/sessions/${session.id}`}
                        className="text-[13px] leading-snug text-ink hover:underline"
                      >
                        {item.message}
                      </Link>
                      <p className="mt-0.5 text-2xs text-muted">
                        {students.find((s) => s.id === session.participants[0])?.name} ·{" "}
                        {relativeDay(session.startedAt)}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => resolveAttention(session.id, item.id)}
                    >
                      <Check className="size-3" />
                      Resolve
                    </Button>
                  </div>
                ))}

                {attention.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Sparkles}
                    title="Nothing needs you"
                    description="Every class has been written up and sent to the student."
                  />
                ) : null}
              </div>
            </Section>

            <Section
              title="Recent classes"
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
                {byDate.slice(0, 8).map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    student={students.find((x) => x.id === s.participants[0])}
                    href={
                      s.status === "recording" ? `/session/${s.id}` : `/teacher/sessions/${s.id}`
                    }
                  />
                ))}
              </div>
            </Section>
          </div>

          {scheduled.length ? (
            <div>
              <Section title="Regular slots">
                <div className="panel divide-y divide-line">
                  {scheduled.map((s) => (
                    <Link
                      key={s.id}
                      href={`/teacher/students/${s.id}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 row-hover"
                    >
                      <Avatar name={s.name} color={s.color} src={s.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{s.name}</p>
                        <p className="truncate text-2xs text-faint">{s.usualSlot}</p>
                      </div>
                      <CalendarClock className="size-3.5 text-faint" />
                    </Link>
                  ))}
                </div>
              </Section>
            </div>
          ) : null}
        </div>
      </div>

      <StartSessionDialog open={startOpen} onOpenChange={setStartOpen} />
    </>
  );
}

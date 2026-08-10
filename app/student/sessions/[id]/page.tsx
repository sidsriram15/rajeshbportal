"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Lock,
  Tag,
} from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { ResourceIcon } from "@/components/session/resource-icon";
import { useStore, useStudentSessions } from "@/lib/store";
import { dateLabel, hostOf, stamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function StudentSessionView({ params }: { params: { id: string } }) {
  const { sessions, students, viewerId } = useStore();
  const session = sessions.find((s) => s.id === params.id);
  const student = students.find((s) => s.id === viewerId) ?? students[0];
  const siblings = useStudentSessions(student?.id).filter((s) => s.status === "published");
  const [done, setDone] = React.useState<Set<number>>(new Set());

  if (!session) notFound();

  /* Students only ever see their own published sessions. */
  if (session.studentId !== student?.id || session.status !== "published") {
    return (
      <div className="panel">
        <EmptyState
          icon={Lock}
          title="This lesson isn't available"
          description="It either belongs to another student or your tutor hasn't published it yet."
          action={
            <Link
              href="/student"
              className="text-2xs text-accent underline-offset-4 hover:underline"
            >
              Back to my lessons
            </Link>
          }
        />
      </div>
    );
  }

  const index = siblings.findIndex((s) => s.id === session.id);
  const prev = siblings[index + 1];
  const next = siblings[index - 1];
  const answered = session.qa.filter((q) => q.answer);

  const toggle = (i: number) =>
    setDone((prev) => {
      const copy = new Set(prev);
      if (copy.has(i)) copy.delete(i);
      else copy.add(i);
      return copy;
    });

  return (
    <article className="space-y-9">
      <header className="space-y-2">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-2xs text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3" />
          My lessons
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{session.subject}</Badge>
          <span className="text-2xs text-faint">
            {dateLabel(session.startedAt)} · <span className="num">{session.durationMin} min</span>
          </span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.022em] text-ink">
          {session.title}
        </h1>
      </header>

      {/* Summary — the reason they came. */}
      <section className="space-y-3.5">
        {session.summary.split("\n\n").filter(Boolean).map((p, i) => (
          <p key={i} className="text-[15px] leading-[1.75] text-ink/90">
            {p}
          </p>
        ))}
      </section>

      {/* Topics */}
      {session.topics.length ? (
        <section className="space-y-2.5">
          <SectionLabel icon={Tag}>What we covered</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {session.topics.map((t) => (
              <span
                key={t.id}
                className="rounded border border-line bg-surface px-2 py-1 text-[13px] text-ink shadow-card"
              >
                {t.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Q&A */}
      {answered.length ? (
        <section className="space-y-2.5">
          <SectionLabel>Your questions</SectionLabel>
          <div className="space-y-2.5">
            {answered.map((q) => (
              <details
                key={q.id}
                open
                className="group rounded-lg border border-line bg-surface shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-start gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="num mt-px shrink-0 text-2xs text-faint">{stamp(q.at)}</span>
                  <span className="flex-1 text-[14px] font-medium leading-snug text-ink">
                    {q.question}
                  </span>
                  <span className="mt-0.5 shrink-0 text-2xs text-faint transition-transform group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <div className="border-t border-line px-4 py-3">
                  <p className="text-[14px] leading-[1.7] text-muted">{q.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Resources */}
      {session.resources.length ? (
        <section className="space-y-2.5">
          <SectionLabel>Links your tutor shared</SectionLabel>
          <div className="panel divide-y divide-line">
            {session.resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 row-hover"
              >
                <ResourceIcon kind={r.kind} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{r.title}</span>
                  <span className="block truncate text-2xs text-faint">
                    {hostOf(r.url)}
                    {r.note ? ` · ${r.note}` : ""}
                  </span>
                </span>
                <ExternalLink className="size-3.5 shrink-0 text-faint" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Practice */}
      {session.homework.length ? (
        <section className="space-y-2.5">
          <SectionLabel>Practice before next lesson</SectionLabel>
          <ul className="panel divide-y divide-line">
            {session.homework.map((h, i) => (
              <li key={h}>
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left row-hover"
                >
                  {done.has(i) ? (
                    <CheckCircle2 className="size-4 shrink-0 text-answer" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-line-strong" />
                  )}
                  <span
                    className={cn(
                      "text-[13px] transition-colors",
                      done.has(i) ? "text-faint line-through" : "text-ink"
                    )}
                  >
                    {h}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-1 text-2xs text-faint">
            Ticking these is just for you — your tutor doesn&apos;t see it.
          </p>
        </section>
      ) : null}

      {/* Pagination */}
      <nav className="flex items-stretch gap-2 border-t border-line pt-5">
        {prev ? (
          <Link
            href={`/student/sessions/${prev.id}`}
            className="group flex flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface p-3 shadow-card transition-colors hover:border-line-strong"
          >
            <ArrowLeft className="size-3.5 shrink-0 text-faint transition-transform group-hover:-translate-x-0.5" />
            <span className="min-w-0">
              <span className="block text-2xs text-faint">Previous lesson</span>
              <span className="block truncate text-[13px] text-ink">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/student/sessions/${next.id}`}
            className="group flex flex-1 items-center justify-end gap-2.5 rounded-lg border border-line bg-surface p-3 text-right shadow-card transition-colors hover:border-line-strong"
          >
            <span className="min-w-0">
              <span className="block text-2xs text-faint">Next lesson</span>
              <span className="block truncate text-[13px] text-ink">{next.title}</span>
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </article>
  );
}

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <h2 className="eyebrow flex items-center gap-1.5">
        {Icon ? <Icon className="size-3" /> : null}
        {children}
      </h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

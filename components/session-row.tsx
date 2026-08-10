"use client";

import Link from "next/link";
import { HelpCircle, Link2, Radio, Tags } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { relativeDay, timeLabel } from "@/lib/format";
import type { Session, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Session["status"] }) {
  if (status === "live")
    return (
      <Badge tone="live">
        <span className="size-1.5 animate-pulse rounded-full bg-live" />
        Live
      </Badge>
    );
  if (status === "draft") return <Badge tone="question">Draft summary</Badge>;
  return <Badge tone="neutral">Published</Badge>;
}

export function SessionRow({
  session,
  student,
  href,
  showStudent = true,
  className,
}: {
  session: Session;
  student?: Student;
  href: string;
  showStudent?: boolean;
  className?: string;
}) {
  const unanswered = session.qa.filter((q) => !q.answer).length;

  return (
    <Link
      href={href}
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 last:border-b-0 row-hover sm:px-4",
        className
      )}
    >
      {showStudent && student ? (
        <Avatar name={student.name} color={student.color} size="sm" />
      ) : (
        <span
          className="mt-px size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: `hsl(${student?.color ?? "34 6% 60%"})` }}
        />
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-ink">{session.title}</p>
          {session.status !== "published" ? <StatusBadge status={session.status} /> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-2xs text-faint">
          {showStudent && student ? <span className="text-muted">{student.name}</span> : null}
          <span>{session.subject}</span>
          <span aria-hidden>·</span>
          <span>
            {relativeDay(session.startedAt)}, {timeLabel(session.startedAt)}
          </span>
          {session.status !== "live" ? (
            <>
              <span aria-hidden>·</span>
              <span className="num">{session.durationMin}m</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 text-2xs text-faint">
        <span className="hidden items-center gap-1 sm:flex" title="Topics">
          <Tags className="size-3 text-topic/70" />
          <span className="num">{session.topics.length}</span>
        </span>
        <span className="hidden items-center gap-1 sm:flex" title="Questions">
          <HelpCircle className="size-3 text-question/70" />
          <span className="num">{session.qa.length}</span>
        </span>
        <span className="hidden items-center gap-1 md:flex" title="Resources">
          <Link2 className="size-3 text-resource/70" />
          <span className="num">{session.resources.length}</span>
        </span>
        {unanswered > 0 && session.status !== "live" ? (
          <Badge tone="question">{unanswered} unanswered</Badge>
        ) : null}
        {session.status === "live" ? <Radio className="size-3.5 text-live" /> : null}
      </div>
    </Link>
  );
}

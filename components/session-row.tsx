"use client";

import Link from "next/link";
import { AlertTriangle, HelpCircle, Link2, Loader2, Radio, Tags } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { durationLabel, relativeDay, timeLabel, topicLine } from "@/lib/format";
import type { Session, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Session["status"] }) {
  switch (status) {
    case "recording":
      return (
        <Badge tone="live">
          <span className="size-1.5 animate-pulse rounded-full bg-live" />
          Recording
        </Badge>
      );
    case "processing":
      return (
        <Badge tone="outline">
          <Loader2 className="size-2.5 animate-spin" />
          Processing
        </Badge>
      );
    case "needs_attention":
      return (
        <Badge tone="question">
          <AlertTriangle className="size-2.5" />
          Needs attention
        </Badge>
      );
    case "failed":
      return <Badge tone="live">Failed</Badge>;
    default:
      return null;
  }
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
  const topics = topicLine(session);
  const unanswered = session.questions.filter((q) => !q.answer).length;

  return (
    <Link
      href={href}
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 last:border-b-0 row-hover sm:px-4",
        className
      )}
    >
      {showStudent && student ? (
        <Avatar name={student.name} color={student.color} src={student.avatarUrl} size="sm" />
      ) : (
        <span
          className="mt-px size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: `hsl(${student?.color ?? "34 6% 60%"})` }}
        />
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-ink">
            {topics || (session.status === "recording" ? "In progress" : "No topics detected")}
          </p>
          <StatusBadge status={session.status} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-2xs text-faint">
          {showStudent && student ? <span className="text-muted">{student.name}</span> : null}
          <span>
            {relativeDay(session.startedAt)}, {timeLabel(session.startedAt)}
          </span>
          {session.status !== "recording" ? (
            <>
              <span aria-hidden>·</span>
              <span className="num">{durationLabel(session.durationSeconds)}</span>
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
          <span className="num">{session.questions.length}</span>
        </span>
        <span className="hidden items-center gap-1 md:flex" title="Resources">
          <Link2 className="size-3 text-resource/70" />
          <span className="num">{session.resources.length}</span>
        </span>
        {unanswered > 0 && session.status === "ready" ? (
          <Badge tone="outline">{unanswered} unanswered</Badge>
        ) : null}
        {session.status === "recording" ? <Radio className="size-3.5 text-live" /> : null}
      </div>
    </Link>
  );
}

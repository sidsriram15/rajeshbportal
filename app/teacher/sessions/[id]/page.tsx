"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Ear, Eye, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/session-row";
import {
  Avatar,
  Badge,
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/session/timeline";
import { QuestionsPanel, ResourcesPanel, TopicsPanel } from "@/components/session/panels";
import { NotesEditor, ProcessingNotice, SummaryEditor } from "@/components/session/write-up";
import { useStore } from "@/lib/store";
import { dateLabel, durationLabel, stamp, timeLabel } from "@/lib/format";

export default function SessionView({ params }: { params: { id: string } }) {
  const { sessions, students, resolveAttention } = useStore();
  const session = sessions.find((s) => s.id === params.id);
  const student = students.find((s) => s.id === session?.participants[0]);
  const [tab, setTab] = React.useState("summary");

  if (!session || !student) notFound();

  const processing = session.status === "processing";
  const unresolved = session.attention.filter((a) => !a.resolvedAt);
  const visibleToStudent = session.publishedAt !== null && session.status === "ready";

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Classes", href: "/teacher/sessions" },
          { label: student.name, href: `/teacher/students/${student.id}` },
        ]}
        title={dateLabel(session.startedAt)}
        meta={
          <>
            <StatusBadge status={session.status} />
            <span className="text-2xs text-faint">
              {timeLabel(session.startedAt)} ·{" "}
              <span className="num">{durationLabel(session.durationSeconds)}</span>
            </span>
            {visibleToStudent ? (
              <span className="flex items-center gap-1 text-2xs text-answer">
                <Check className="size-3" />
                Shared with {student.name.split(" ")[0]}
              </span>
            ) : null}
          </>
        }
        actions={
          visibleToStudent ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/student/sessions/${session.id}`}>
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">Student view</span>
              </Link>
            </Button>
          ) : null
        }
      />

      {unresolved.length ? (
        <div className="border-b border-question/25 bg-question/[0.06] px-5 py-2.5 lg:px-7">
          {unresolved.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5 text-xs text-ink">
              <TriangleAlert className="mt-px size-3.5 shrink-0 text-question" />
              <span className="flex-1 leading-relaxed">{item.message}</span>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => resolveAttention(session.id, item.id)}
              >
                Resolve and share
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1160px] gap-7 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_324px] lg:px-7">
        <div className="min-w-0 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="summary">Write-up</TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline
                <Badge tone="outline" className="num">
                  {session.topics.length + session.questions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-5 pt-4">
              {processing ? (
                <ProcessingNotice />
              ) : (
                <>
                  <SummaryEditor session={session} />
                  <NotesEditor session={session} kind="key_point" />
                  <NotesEditor session={session} kind="practice" />
                </>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="pt-4">
              <div className="panel py-2">
                <Timeline session={session} editable />
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="pt-4">
              <div className="panel">
                {session.transcript.length ? (
                  <div className="space-y-2.5 px-4 py-3.5">
                    <p className="pb-1 text-2xs text-faint">
                      Only you can see this. Students never get the raw transcript.
                    </p>
                    {session.transcript.map((line) => (
                      <p key={line.id} className="flex gap-3 text-[13px] leading-relaxed">
                        <span className="num shrink-0 text-2xs text-faint">
                          {stamp(line.startMs)}
                        </span>
                        <span
                          className={`w-14 shrink-0 text-2xs font-medium ${
                            line.speaker === "teacher" ? "text-accent" : "text-answer"
                          }`}
                        >
                          {line.speaker === "teacher" ? "You" : student.name.split(" ")[0]}
                        </span>
                        <span className="text-muted">{line.text}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Ear}
                    title="No transcript"
                    description="Nothing was captured for this class."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-5">
          <div className="panel p-3.5">
            <Link
              href={`/teacher/students/${student.id}`}
              className="flex items-center gap-2.5 rounded transition-opacity hover:opacity-80"
            >
              <Avatar name={student.name} color={student.color} src={student.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{student.name}</p>
                {student.yearGroup ? (
                  <p className="truncate text-2xs text-faint">{student.yearGroup}</p>
                ) : null}
              </div>
            </Link>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-2xs text-faint">
              <Clock className="size-3" />
              {durationLabel(session.durationSeconds)} · {session.topics.length} topics ·{" "}
              {session.questions.length} questions
            </div>
          </div>

          <Panel title="Topics" count={session.topics.length}>
            <TopicsPanel session={session} editable />
          </Panel>

          <Panel title="Questions & answers" count={session.questions.length}>
            <QuestionsPanel session={session} editable />
          </Panel>

          <Panel title="Resources" count={session.resources.length}>
            <ResourcesPanel session={session} editable />
          </Panel>
        </div>
      </div>
    </>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2">
        <span className="eyebrow">{title}</span>
        <span className="num ml-auto text-2xs text-faint">{count}</span>
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

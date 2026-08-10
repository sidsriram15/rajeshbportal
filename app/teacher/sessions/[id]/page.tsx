"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  Ear,
  Eye,
  MoreHorizontal,
  Send,
  Undo2,
} from "lucide-react";
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
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Timeline } from "@/components/session/timeline";
import { QuestionsPanel, ResourcesPanel, TopicsPanel } from "@/components/session/panels";
import { GeneratingSummary, RegenerateHint, SummaryEditor } from "@/components/session/summary-editor";
import { useStore } from "@/lib/store";
import { dateLabel, stamp, timeLabel } from "@/lib/format";

export default function SessionReview({ params }: { params: { id: string } }) {
  const { sessions, students, publishSummary, unpublishSummary, summaryPhase, clearSummaryPhase } =
    useStore();
  const session = sessions.find((s) => s.id === params.id);
  const student = students.find((s) => s.id === session?.studentId);
  const [tab, setTab] = React.useState("summary");
  const [justPublished, setJustPublished] = React.useState(false);

  /* Deep links from the overview open the right tab. */
  React.useEffect(() => {
    if (window.location.search.includes("tab=questions")) setTab("timeline");
  }, []);

  React.useEffect(() => {
    if (summaryPhase !== "ready") return;
    const t = window.setTimeout(clearSummaryPhase, 400);
    return () => window.clearTimeout(t);
  }, [summaryPhase, clearSummaryPhase]);

  if (!session || !student) notFound();

  const generating = summaryPhase === "generating" && session.status === "draft";
  const published = session.status === "published";
  const unanswered = session.qa.filter((q) => !q.answer).length;

  const publish = () => {
    publishSummary(session.id);
    setJustPublished(true);
    window.setTimeout(() => setJustPublished(false), 2200);
  };

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Sessions", href: "/teacher/sessions" },
          { label: student.name, href: `/teacher/students/${student.id}` },
        ]}
        title={session.title}
        meta={
          <>
            <StatusBadge status={session.status} />
            <span className="text-2xs text-faint">
              {dateLabel(session.startedAt)} · {timeLabel(session.startedAt)} ·{" "}
              <span className="num">{session.durationMin}m</span>
            </span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/student/sessions/${session.id}`}>
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">Student view</span>
              </Link>
            </Button>
            {published ? (
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Check className="size-3.5 text-answer" />
                    Published
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  <MenuItem onSelect={publish}>
                    <Send />
                    Re-publish with edits
                  </MenuItem>
                  <MenuItem destructive onSelect={() => unpublishSummary(session.id)}>
                    <Undo2 />
                    Unpublish
                  </MenuItem>
                </MenuContent>
              </Menu>
            ) : (
              <Button variant="primary" size="sm" disabled={generating} onClick={publish}>
                <Send className="size-3.5" />
                Publish to {student.name.split(" ")[0]}
              </Button>
            )}
          </>
        }
      />

      {justPublished ? (
        <div className="animate-fade-up border-b border-answer/25 bg-answer/[0.07] px-5 py-2 text-xs text-ink lg:px-7">
          <span className="flex items-center gap-2">
            <Check className="size-3.5 text-answer" />
            Published — {student.name.split(" ")[0]} can now read this session in their portal.
          </span>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1160px] gap-7 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_324px] lg:px-7">
        <div className="min-w-0 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline
                <Badge tone="outline" className="num">
                  {session.events.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-3 pt-4">
              {generating ? <GeneratingSummary /> : <SummaryEditor session={session} />}
              {!generating ? <RegenerateHint /> : null}
            </TabsContent>

            <TabsContent value="timeline" className="pt-4">
              <div className="panel py-2">
                <Timeline session={session} editable />
              </div>
              {unanswered > 0 ? (
                <p className="mt-2 px-1 text-2xs text-question">
                  {unanswered} question{unanswered > 1 ? "s have" : " has"} no answer recorded yet.
                </p>
              ) : null}
            </TabsContent>

            <TabsContent value="transcript" className="pt-4">
              <div className="panel">
                {session.transcript.length ? (
                  <div className="space-y-2.5 px-4 py-3.5">
                    {session.transcript.map((line, i) => (
                      <p key={i} className="flex gap-3 text-[13px] leading-relaxed">
                        <span className="num shrink-0 text-2xs text-faint">{stamp(line.at)}</span>
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
                    title="No transcript stored"
                    description="Transcripts are kept for sessions recorded through Zoom. This one was logged manually."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* rail */}
        <div className="space-y-5">
          <div className="panel p-3.5">
            <Link
              href={`/teacher/students/${student.id}`}
              className="flex items-center gap-2.5 rounded transition-opacity hover:opacity-80"
            >
              <Avatar name={student.name} color={student.color} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{student.name}</p>
                <p className="truncate text-2xs text-faint">
                  {student.grade} · {session.subject}
                </p>
              </div>
            </Link>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-2xs text-faint">
              <Clock className="size-3" />
              {session.durationMin} minutes · {session.topics.length} topics · {session.qa.length}{" "}
              questions
            </div>
          </div>

          <Panel title="Topics" count={session.topics.length}>
            <TopicsPanel session={session} editable />
          </Panel>

          <Panel title="Questions & answers" count={session.qa.length}>
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

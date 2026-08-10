"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Circle, Ear, Filter, Square, Target } from "lucide-react";
import {
  Avatar,
  Badge,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/session/timeline";
import { Composer } from "@/components/session/composer";
import { CaptureStatus } from "@/components/session/capture-status";
import { QuestionsPanel, ResourcesPanel, TopicsPanel } from "@/components/session/panels";
import { EndSessionDialog } from "@/components/session/end-session-dialog";
import { Waveform } from "@/components/session/waveform";
import { useStore, useStudentGoals, useStudentSessions } from "@/lib/store";
import { buildTimeline, clock, durationLabel, relativeDay, stamp } from "@/lib/format";
import type { Session, TimelineEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: TimelineEntry["kind"]; label: string; dot: string }> = [
  { id: "topic", label: "Topics", dot: "bg-topic" },
  { id: "question", label: "Questions", dot: "bg-question" },
  { id: "answer", label: "Answers", dot: "bg-answer" },
  { id: "resource", label: "Links", dot: "bg-resource" },
];

export default function ActiveSessionPage({ params }: { params: { id: string } }) {
  const { sessions, students, snapshots, liveId, elapsed } = useStore();
  const router = useRouter();
  const session = sessions.find((s) => s.id === params.id);
  const [endOpen, setEndOpen] = React.useState(false);
  const [transcriptOpen, setTranscriptOpen] = React.useState(false);
  const [active, setActive] = React.useState<TimelineEntry["kind"][]>([]);

  const student = students.find((s) => s.id === session?.participants[0]);
  const history = useStudentSessions(session?.participants[0]);
  const goals = useStudentGoals(session?.participants[0]);

  /*
   * Opening a class that is already over should bounce to the read view — but
   * ending a class from here must not, or the redirect races the teacher's own
   * navigation and drops them back on a class they just finished.
   */
  const wasRecording = React.useRef(false);
  React.useEffect(() => {
    if (session?.status === "recording") wasRecording.current = true;
  }, [session?.status]);

  React.useEffect(() => {
    if (session && session.status !== "recording" && !wasRecording.current) {
      router.replace(`/teacher/sessions/${session.id}`);
    }
  }, [session, router]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement;
        if (/input|textarea/i.test(t.tagName)) return;
        setTranscriptOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!session || !student) notFound();

  const isLive = liveId === session.id;
  const previous = history.filter((s) => s.id !== session.id)[0];
  const snapshot = snapshots[student.id];
  const entryCount = buildTimeline(session).length;
  const toggle = (k: TimelineEntry["kind"]) =>
    setActive((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3">
        <Link
          href="/teacher"
          className="grid size-7 shrink-0 place-items-center rounded text-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
          aria-label="Back to overview"
        >
          <ChevronLeft className="size-4" />
        </Link>

        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={student.name} color={student.color} src={student.avatarUrl} size="sm" />
          <p className="truncate text-[13px] font-medium text-ink">{student.name}</p>
        </div>

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded border px-2 py-1",
              isLive ? "border-live/30 bg-live/[0.07]" : "border-line bg-canvas"
            )}
          >
            {isLive ? (
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-live" />
              </span>
            ) : (
              <Circle className="size-2 text-faint" />
            )}
            <span className={cn("num text-xs tabular-nums", isLive ? "text-live" : "text-muted")}>
              {clock(elapsed)}
            </span>
          </span>

          <CaptureStatus capture={session.capture} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip label="Live transcript" shortcut="T">
            <Button
              variant={transcriptOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTranscriptOpen((v) => !v)}
            >
              <Ear className="size-3.5" />
              <span className="hidden sm:inline">Transcript</span>
            </Button>
          </Tooltip>
          <Button variant="danger" size="sm" onClick={() => setEndOpen(true)}>
            <Square className="size-3 fill-current" />
            End class
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[264px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-surface/50 p-4 scrollbar-thin xl:flex">
          {snapshot ? (
            <div>
              <p className="eyebrow">Working on</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{snapshot.workingOn}</p>
            </div>
          ) : null}

          {goals.length ? (
            <div>
              <p className="eyebrow">Goals</p>
              <ul className="mt-1.5 space-y-1.5">
                {goals.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-start gap-2 text-xs leading-relaxed text-muted"
                  >
                    <Target className="mt-0.5 size-3 shrink-0 text-faint" />
                    {g.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {previous ? (
            <div>
              <p className="eyebrow">Last class</p>
              <Link
                href={`/teacher/sessions/${previous.id}`}
                className="group mt-1.5 block rounded border border-line bg-surface p-2.5 transition-colors hover:border-line-strong"
              >
                <p className="text-2xs text-faint">
                  {relativeDay(previous.startedAt)} · {durationLabel(previous.durationSeconds)}
                </p>
                <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-muted">
                  {previous.summary?.split("\n\n").at(-1) ?? "No summary."}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-0.5 text-2xs text-accent">
                  Open
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          ) : null}

          <div className="mt-auto space-y-1.5">
            <p className="eyebrow">Optional shortcuts</p>
            <ShortcutRow keys={["C"]} label="Note something yourself" />
            <ShortcutRow keys={["T"]} label="Toggle transcript" />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2">
            <Filter className="size-3 text-faint" />
            <div className="flex flex-wrap items-center gap-1">
              {FILTERS.map((f) => {
                const on = active.length === 0 || active.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.id)}
                    className={cn(
                      "flex h-6 items-center gap-1.5 rounded border px-2 text-2xs transition-colors",
                      active.includes(f.id)
                        ? "border-ink/20 bg-ink/[0.06] text-ink"
                        : "border-transparent text-muted hover:bg-ink/[0.04]"
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", f.dot, !on && "opacity-30")} />
                    {f.label}
                  </button>
                );
              })}
            </div>
            {active.length ? (
              <button
                onClick={() => setActive([])}
                className="ml-auto text-2xs text-faint transition-colors hover:text-ink"
              >
                Clear
              </button>
            ) : (
              <span className="ml-auto text-2xs text-faint">{entryCount} captured</span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
            {entryCount === 0 ? (
              <ListeningState />
            ) : (
              <Timeline
                session={session}
                editable
                autoScroll={isLive}
                filter={active.length ? active : undefined}
              />
            )}
          </div>

          {transcriptOpen ? <TranscriptDrawer session={session} live={isLive} /> : null}

          <Composer session={session} />
        </main>

        <aside className="hidden w-[336px] shrink-0 flex-col overflow-hidden border-l border-line bg-surface/50 lg:flex">
          <Tabs defaultValue="topics" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="shrink-0 px-3 pt-2">
              <TabsTrigger value="topics">
                Topics
                <Badge tone="topic" className="num">
                  {session.topics.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="questions">
                Q&amp;A
                <Badge tone="question" className="num">
                  {session.questions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resources">
                Links
                <Badge tone="resource" className="num">
                  {session.resources.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 scrollbar-thin">
              <TabsContent value="topics">
                <TopicsPanel session={session} editable />
              </TabsContent>
              <TabsContent value="questions">
                <QuestionsPanel session={session} editable />
              </TabsContent>
              <TabsContent value="resources">
                <ResourcesPanel session={session} editable />
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>

      <EndSessionDialog session={session} open={endOpen} onOpenChange={setEndOpen} />
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2 text-2xs text-faint">
      <span className="flex gap-0.5">
        {keys.map((k) => (
          <span key={k} className="kbd">
            {k}
          </span>
        ))}
      </span>
      {label}
    </div>
  );
}

function ListeningState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-center">
      <Waveform bars={22} className="h-6 scale-125 opacity-70" />
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-ink">Listening</p>
        <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-muted">
          Topics, questions and answers appear here as the class goes. Just teach.
        </p>
      </div>
    </div>
  );
}

function TranscriptDrawer({ session, live }: { session: Session; live: boolean }) {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session.transcript.length]);

  return (
    <div className="h-[190px] shrink-0 animate-fade-up overflow-hidden border-t border-line bg-canvas">
      <div className="flex items-center gap-2 border-b border-line px-4 py-1.5">
        <Ear className="size-3 text-faint" />
        <span className="eyebrow">Live transcript</span>
        {live ? (
          <span className="flex items-center gap-1 text-2xs text-answer">
            <span className="size-1 animate-pulse rounded-full bg-answer" />
            capturing
          </span>
        ) : null}
        <span className="ml-auto text-2xs text-faint">
          <span className="kbd">T</span> to hide
        </span>
      </div>
      <div className="h-[150px] space-y-1.5 overflow-y-auto px-4 py-2.5 scrollbar-thin">
        {session.transcript.length === 0 ? (
          <p className="py-8 text-center text-xs text-faint">Waiting for speech…</p>
        ) : null}
        {session.transcript.map((line) => (
          <p key={line.id} className="flex gap-2.5 text-xs leading-relaxed">
            <span className="num shrink-0 text-2xs text-faint">{stamp(line.startMs)}</span>
            <span
              className={cn(
                "shrink-0 font-medium",
                line.speaker === "teacher" ? "text-accent" : "text-answer"
              )}
            >
              {line.speaker === "teacher" ? "You" : "Student"}
            </span>
            <span className="text-muted">{line.text}</span>
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

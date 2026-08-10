"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Pencil,
  Radio,
  Target,
  Waves,
  X,
} from "lucide-react";
import { PageHeader, Section } from "@/components/page-header";
import { SessionRow } from "@/components/session-row";
import { Avatar, Badge, EmptyState, Meter, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { StartSessionDialog } from "@/components/teacher/start-session-dialog";
import { useStore, useStudentSessions } from "@/lib/store";
import { dateLabel, hostOf, relativeDay } from "@/lib/format";
import { ResourceIcon } from "@/components/session/resource-icon";

export default function StudentProfile({ params }: { params: { id: string } }) {
  const { students, updateStudent } = useStore();
  const student = students.find((s) => s.id === params.id);
  const sessions = useStudentSessions(params.id);
  const [startOpen, setStartOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [focusDraft, setFocusDraft] = React.useState("");
  const [goalDraft, setGoalDraft] = React.useState("");

  const totalMinutes = sessions.reduce((n, s) => n + s.durationMin, 0);
  const allQuestions = sessions.flatMap((s) => s.qa);
  const answered = allQuestions.filter((q) => q.answer).length;

  const topicIndex = React.useMemo(() => {
    const map = new Map<string, { label: string; count: number; minutes: number; last: string }>();
    sessions.forEach((s) =>
      s.topics.forEach((t) => {
        const key = t.label.toLowerCase();
        const prev = map.get(key);
        map.set(key, {
          label: t.label,
          count: (prev?.count ?? 0) + 1,
          minutes: (prev?.minutes ?? 0) + t.minutes,
          last: prev?.last ?? s.startedAt,
        });
      })
    );
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [sessions]);

  const resources = React.useMemo(
    () =>
      sessions.flatMap((s) =>
        s.resources.map((r) => ({ ...r, sessionId: s.id, sessionTitle: s.title, date: s.startedAt }))
      ),
    [sessions]
  );

  if (!student) notFound();

  const startEdit = () => {
    setFocusDraft(student.focus);
    setEditing(true);
  };

  const saveEdit = () => {
    updateStudent(student.id, { focus: focusDraft.trim() || student.focus });
    setEditing(false);
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Students", href: "/teacher/students" }, { label: student.name }]}
        title={
          <span className="flex items-center gap-2.5">
            <Avatar name={student.name} color={student.color} size="sm" />
            {student.name}
          </span>
        }
        meta={<Badge tone="outline">{student.grade}</Badge>}
        actions={
          <>
            <Button variant="primary" onClick={() => setStartOpen(true)}>
              <Radio className="size-3.5" />
              Start session
            </Button>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem onSelect={startEdit}>
                  <Pencil />
                  Edit focus notes
                </MenuItem>
                <MenuItem onSelect={() => window.open(`mailto:${student.email}`)}>
                  <Mail />
                  Email student
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      />

      <div className="mx-auto grid max-w-[1160px] gap-7 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_296px] lg:px-7">
        <div className="min-w-0">
          <Tabs defaultValue="sessions">
            <TabsList>
              <TabsTrigger value="sessions">
                Sessions
                <Badge tone="outline" className="num">
                  {sessions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="topics">
                Topics
                <Badge tone="outline" className="num">
                  {topicIndex.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="questions">
                Questions
                <Badge tone="outline" className="num">
                  {allQuestions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resources">
                Resources
                <Badge tone="outline" className="num">
                  {resources.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="pt-4">
              {sessions.length ? (
                <div className="panel overflow-hidden">
                  {sessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      student={student}
                      showStudent={false}
                      href={s.status === "live" ? `/session/${s.id}` : `/teacher/sessions/${s.id}`}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Waves}
                  title="No sessions recorded"
                  description={`Start a session with ${student.name.split(" ")[0]} and Cadence will capture topics, questions and answers automatically.`}
                  action={
                    <Button size="sm" variant="primary" onClick={() => setStartOpen(true)}>
                      <Radio className="size-3.5" />
                      Start first session
                    </Button>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="topics" className="pt-4">
              <div className="panel divide-y divide-line">
                {topicIndex.map((t) => (
                  <div key={t.label} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-topic/70" />
                    <p className="min-w-0 flex-1 truncate text-[13px] text-ink">{t.label}</p>
                    <span className="text-2xs text-faint">
                      {t.count} {t.count === 1 ? "session" : "sessions"}
                    </span>
                    <Meter value={t.minutes / 30} tone="topic" ticks={8} />
                    <span className="num w-9 text-right text-2xs text-faint">{t.minutes}m</span>
                  </div>
                ))}
                {topicIndex.length === 0 ? (
                  <EmptyState compact icon={Target} title="No topics yet" />
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4 pt-4">
              {sessions
                .filter((s) => s.qa.length)
                .map((s) => (
                  <div key={s.id}>
                    <div className="mb-1.5 flex items-baseline gap-2">
                      <Link
                        href={`/teacher/sessions/${s.id}`}
                        className="text-xs font-medium text-ink hover:underline"
                      >
                        {s.title}
                      </Link>
                      <span className="text-2xs text-faint">{relativeDay(s.startedAt)}</span>
                    </div>
                    <div className="panel divide-y divide-line">
                      {s.qa.map((q) => (
                        <div key={q.id} className="px-4 py-3">
                          <p className="text-[13px] text-ink">{q.question}</p>
                          {q.answer ? (
                            <p className="mt-1.5 border-l-2 border-answer/30 pl-2.5 text-xs leading-relaxed text-muted">
                              {q.answer}
                            </p>
                          ) : (
                            <Badge tone="question" className="mt-1.5">
                              Unanswered
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {allQuestions.length === 0 ? (
                <EmptyState icon={Target} title="No questions captured yet" />
              ) : null}
            </TabsContent>

            <TabsContent value="resources" className="pt-4">
              <div className="panel divide-y divide-line">
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 row-hover"
                  >
                    <ResourceIcon kind={r.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{r.title}</p>
                      <p className="truncate text-2xs text-faint">
                        {hostOf(r.url)} · shared in {r.sessionTitle}
                      </p>
                    </div>
                    <ExternalLink className="size-3.5 text-faint" />
                  </a>
                ))}
                {resources.length === 0 ? (
                  <EmptyState compact icon={ExternalLink} title="No resources shared yet" />
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Rail */}
        <div className="space-y-6">
          <Section
            title="Working on"
            action={
              editing ? null : (
                <button
                  onClick={startEdit}
                  className="text-2xs text-faint transition-colors hover:text-ink"
                >
                  Edit
                </button>
              )
            }
          >
            <div className="panel p-3.5">
              {editing ? (
                <div className="space-y-2">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={focusDraft}
                    onChange={(e) => setFocusDraft(e.target.value)}
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>
                      <X className="size-3" />
                      Cancel
                    </Button>
                    <Button size="xs" variant="primary" onClick={saveEdit}>
                      <Check className="size-3" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-muted">{student.focus}</p>
              )}
            </div>
          </Section>

          <Section title="Goals">
            <div className="panel divide-y divide-line">
              {student.goals.map((g) => (
                <div key={g} className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <Target className="mt-0.5 size-3.5 shrink-0 text-faint" />
                  <span className="flex-1 text-xs leading-relaxed text-muted">{g}</span>
                  <button
                    onClick={() =>
                      updateStudent(student.id, {
                        goals: student.goals.filter((x) => x !== g),
                      })
                    }
                    className="text-faint transition-colors hover:text-danger"
                    aria-label={`Remove goal ${g}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <form
                className="flex items-center gap-1.5 px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!goalDraft.trim()) return;
                  updateStudent(student.id, { goals: [...student.goals, goalDraft.trim()] });
                  setGoalDraft("");
                }}
              >
                <Input
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  placeholder="Add a goal…"
                  className="h-7 border-transparent bg-transparent px-1.5 hover:border-line"
                />
              </form>
            </div>
          </Section>

          <Section title="Details">
            <dl className="panel divide-y divide-line text-xs">
              <Detail label="Email" value={student.email} />
              <Detail label="Usual slot" value={student.cadence} />
              <Detail label="Timezone" value={student.timezone.replace("_", " ")} />
              <Detail label="Student since" value={dateLabel(student.joinedAt)} />
              <Detail
                label="Total taught"
                value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
                mono
              />
              <Detail
                label="Questions answered"
                value={`${answered} of ${allQuestions.length}`}
                mono
              />
            </dl>
          </Section>

          <div className="flex items-center gap-1.5 px-1 text-2xs text-faint">
            <Clock className="size-3" />
            Last session{" "}
            {sessions[0] ? relativeDay(sessions[0].startedAt).toLowerCase() : "never"}
          </div>
        </div>
      </div>

      <StartSessionDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        presetStudentId={student.id}
      />
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3.5 py-2">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd className={`truncate text-right text-ink ${mono ? "num" : ""}`}>{value}</dd>
    </div>
  );
}

"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { Check, KeyRound, MoreHorizontal, Pencil, Plus, Radio, Target, Trash2, X } from "lucide-react";
import { PageHeader, Section } from "@/components/page-header";
import { SessionRow } from "@/components/session-row";
import { AiMark, Avatar, Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { StartSessionDialog } from "@/components/teacher/start-session-dialog";
import { DeleteStudentDialog } from "@/components/teacher/delete-student-dialog";
import { useStore, useStudentGoals, useStudentSessions } from "@/lib/store";
import { dateLabel, totalTimeLabel } from "@/lib/format";

export default function StudentProfile({ params }: { params: { id: string } }) {
  const { students, snapshots, setSnapshot, addGoal, updateGoal, removeGoal } = useStore();
  const student = students.find((s) => s.id === params.id);
  const sessions = useStudentSessions(params.id);
  const goals = useStudentGoals(params.id);

  const [startOpen, setStartOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editingSnapshot, setEditingSnapshot] = React.useState(false);
  const [snapshotDraft, setSnapshotDraft] = React.useState("");
  const [goalDraft, setGoalDraft] = React.useState("");
  const [editingGoalId, setEditingGoalId] = React.useState<string | null>(null);
  const [goalEdit, setGoalEdit] = React.useState("");

  if (!student) notFound();

  const snapshot = snapshots[student.id];
  const totalSeconds = sessions.reduce((n, s) => n + s.durationSeconds, 0);
  const questions = sessions.flatMap((s) => s.questions);
  const answered = questions.filter((q) => q.answer).length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Students", href: "/teacher/students" }, { label: student.name }]}
        title={
          <span className="flex items-center gap-2.5">
            <Avatar name={student.name} color={student.color} src={student.avatarUrl} size="sm" />
            {student.name}
          </span>
        }
        meta={student.yearGroup ? <Badge tone="outline">{student.yearGroup}</Badge> : null}
        actions={
          <>
            <Button variant="primary" onClick={() => setStartOpen(true)}>
              <Radio className="size-3.5" />
              Start class
            </Button>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Student actions">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem>
                  <KeyRound />
                  Reset password
                </MenuItem>
                <MenuSeparator />
                <MenuItem destructive onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Delete student
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      />

      <div className="mx-auto grid max-w-[1100px] gap-7 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-7">
        <div className="min-w-0 space-y-7">
          <Section
            title="Working on"
            action={snapshot && !snapshot.editedByTeacher ? <AiMark /> : null}
          >
            <div className="panel p-3.5">
              {editingSnapshot ? (
                <div className="space-y-2">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={snapshotDraft}
                    onChange={(e) => setSnapshotDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingSnapshot(false);
                    }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs text-faint">
                      Once you edit this, it stays as you wrote it.
                    </span>
                    <span className="flex gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => setEditingSnapshot(false)}>
                        <X className="size-3" />
                        Cancel
                      </Button>
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => {
                          if (snapshotDraft.trim()) setSnapshot(student.id, snapshotDraft.trim());
                          setEditingSnapshot(false);
                        }}
                      >
                        <Check className="size-3" />
                        Save
                      </Button>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <p className="flex-1 text-[13px] leading-relaxed text-muted">
                    {snapshot?.workingOn ?? "Nothing recorded yet."}
                  </p>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    aria-label="Edit"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => {
                      setSnapshotDraft(snapshot?.workingOn ?? "");
                      setEditingSnapshot(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                </div>
              )}
            </div>
          </Section>

          <Section title="Recent classes">
            {sessions.length ? (
              <div className="panel overflow-hidden">
                {sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    student={student}
                    showStudent={false}
                    href={
                      s.status === "recording" ? `/session/${s.id}` : `/teacher/sessions/${s.id}`
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="panel">
                <EmptyState
                  icon={Radio}
                  title="No classes yet"
                  description={`Start a class with ${student.name.split(" ")[0]} — topics, questions and answers are picked up automatically.`}
                  action={
                    <Button size="sm" variant="primary" onClick={() => setStartOpen(true)}>
                      <Radio className="size-3.5" />
                      Start first class
                    </Button>
                  }
                />
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Goals" action={goals.some((g) => !g.editedByTeacher) ? <AiMark /> : null}>
            <div className="panel divide-y divide-line">
              {goals.map((g) => (
                <div key={g.id} className="group flex items-start gap-2.5 px-3.5 py-2.5">
                  <Target className="mt-0.5 size-3.5 shrink-0 text-faint" />
                  {editingGoalId === g.id ? (
                    <div className="flex-1 space-y-1.5">
                      <Input
                        autoFocus
                        value={goalEdit}
                        onChange={(e) => setGoalEdit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && goalEdit.trim()) {
                            updateGoal(g.id, goalEdit.trim());
                            setEditingGoalId(null);
                          }
                          if (e.key === "Escape") setEditingGoalId(null);
                        }}
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          size="xs"
                          variant="primary"
                          disabled={!goalEdit.trim()}
                          onClick={() => {
                            updateGoal(g.id, goalEdit.trim());
                            setEditingGoalId(null);
                          }}
                        >
                          Save
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => setEditingGoalId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-xs leading-relaxed text-muted">{g.text}</span>
                      <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="iconSm"
                          variant="ghost"
                          aria-label={`Edit goal`}
                          onClick={() => {
                            setGoalEdit(g.text);
                            setEditingGoalId(g.id);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          aria-label="Remove goal"
                          className="hover:text-danger"
                          onClick={() => removeGoal(student.id, g.id)}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    </>
                  )}
                </div>
              ))}
              <form
                className="flex items-center gap-2 px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!goalDraft.trim()) return;
                  addGoal(student.id, goalDraft.trim());
                  setGoalDraft("");
                }}
              >
                <Plus className="size-3 shrink-0 text-faint" />
                <Input
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  placeholder="Add a goal"
                  className="h-7 border-transparent bg-transparent px-0 text-xs hover:border-transparent focus:ring-0"
                />
              </form>
            </div>
          </Section>

          <Section title="Details">
            <dl className="panel divide-y divide-line text-xs">
              <Detail label="Username" value={student.username} mono />
              {student.usualSlot ? <Detail label="Usual slot" value={student.usualSlot} /> : null}
              <Detail label="Timezone" value={student.timezone.replace("_", " ")} />
              <Detail label="Student since" value={dateLabel(student.joinedAt)} />
              <Detail
                label="Total taught"
                value={totalSeconds ? totalTimeLabel(totalSeconds) : "—"}
                mono
              />
              <Detail
                label="Questions answered"
                value={questions.length ? `${answered} of ${questions.length}` : "—"}
                mono
              />
            </dl>
          </Section>
        </div>
      </div>

      <StartSessionDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        presetStudentId={student.id}
      />
      <DeleteStudentDialog student={student} open={deleteOpen} onOpenChange={setDeleteOpen} />
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

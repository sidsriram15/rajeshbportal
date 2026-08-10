"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Radio, Search, Video } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Avatar, Badge } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StartSessionDialog({
  open,
  onOpenChange,
  presetStudentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetStudentId?: string;
}) {
  const { students, startSession, liveId } = useStore();
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [studentId, setStudentId] = React.useState(presetStudentId ?? "");
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState<Subject | "">("");

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setStudentId(presetStudentId ?? "");
    setTitle("");
    setSubject("");
  }, [open, presetStudentId]);

  const selected = students.find((s) => s.id === studentId);

  React.useEffect(() => {
    if (selected && !subject) setSubject(selected.subjects[0]);
  }, [selected, subject]);

  const filtered = students.filter((s) =>
    (s.name + s.subjects.join(" ")).toLowerCase().includes(query.toLowerCase())
  );

  const submit = () => {
    if (!selected || !subject) return;
    const id = startSession(
      selected.id,
      subject as Subject,
      title.trim() || `${subject} session`
    );
    onOpenChange(false);
    router.push(`/session/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="lg">
        <DialogHeader
          title="Start a tutoring session"
          description="Cadence joins the Zoom call, transcribes it, and captures topics, questions and answers as you teach."
        />

        <DialogBody className="space-y-4">
          {liveId ? (
            <div className="flex items-center gap-2 rounded border border-live/25 bg-live/[0.06] px-3 py-2 text-xs text-ink">
              <Radio className="size-3.5 text-live" />
              A session is already running. Starting a new one will end it.
            </div>
          ) : null}

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-ink">Student</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students…"
                className="pl-8"
              />
            </div>
            <div className="max-h-52 space-y-px overflow-y-auto rounded border border-line p-1 scrollbar-thin">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStudentId(s.id);
                    setSubject(s.subjects[0]);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors",
                    studentId === s.id ? "bg-accent/[0.09]" : "hover:bg-ink/[0.04]"
                  )}
                >
                  <Avatar name={s.name} color={s.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{s.name}</span>
                    <span className="block truncate text-2xs text-faint">{s.cadence}</span>
                  </span>
                  {studentId === s.id ? <Badge tone="accent">Selected</Badge> : null}
                </button>
              ))}
              {filtered.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-faint">No students match “{query}”.</p>
              ) : null}
            </div>
          </div>

          {selected ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field label="Session focus" hint="optional">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g. ${selected.focus.split("—")[0].trim()}`}
                />
              </Field>
              <Field label="Subject">
                <div className="flex gap-1">
                  {selected.subjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSubject(sub)}
                      className={cn(
                        "h-8 rounded border px-2.5 text-[13px] transition-colors",
                        subject === sub
                          ? "border-ink bg-ink text-canvas"
                          : "border-line text-muted hover:border-line-strong hover:text-ink"
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded border border-line bg-canvas px-3 py-2 text-2xs text-muted">
            <Video className="size-3.5 text-faint" />
            Zoom meeting <span className="num text-ink">821 4409 7723</span> · transcription will start
            automatically
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!selected} onClick={submit}>
            Start session
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

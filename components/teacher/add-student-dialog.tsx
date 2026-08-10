"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUBJECTS: Subject[] = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
];

export function AddStudentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addStudent } = useStore();
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [grade, setGrade] = React.useState("Grade 11");
  const [cadence, setCadence] = React.useState("");
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [focus, setFocus] = React.useState("");

  React.useEffect(() => {
    if (open) return;
    setName("");
    setEmail("");
    setGrade("Grade 11");
    setCadence("");
    setSubjects([]);
    setFocus("");
  }, [open]);

  const valid = name.trim().length > 1 && subjects.length > 0;

  const submit = () => {
    if (!valid) return;
    const student = addStudent({
      name: name.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
      grade,
      subjects,
      focus: focus.trim() || "No focus notes yet.",
      goals: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cadence: cadence.trim() || "Not scheduled",
    });
    onOpenChange(false);
    router.push(`/teacher/students/${student.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="lg">
        <DialogHeader
          title="Add a student"
          description="Only the name and subjects are required — everything else can be filled in later."
        />
        <DialogBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </Field>
            <Field label="Email" hint="optional">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@school.edu"
              />
            </Field>
            <Field label="Year group">
              <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
            </Field>
            <Field label="Usual slot" hint="optional">
              <Input
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                placeholder="Tue & Thu · 5:00 PM"
              />
            </Field>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-ink">Subjects</span>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map((s) => {
                const on = subjects.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSubjects((prev) =>
                        on ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    className={cn(
                      "h-7 rounded border px-2.5 text-[13px] transition-colors",
                      on
                        ? "border-ink bg-ink text-canvas"
                        : "border-line text-muted hover:border-line-strong hover:text-ink"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="What are you working on?" hint="shown during live sessions">
            <Textarea
              rows={3}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Quadratics — can factorise but freezes on word problems."
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>
            <UserPlus className="size-3.5" />
            Add student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

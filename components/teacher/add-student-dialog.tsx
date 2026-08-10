"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

/** Suggests a login handle from the name — the teacher can always overwrite it. */
function suggestUsername(name: string) {
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].replace(/[^a-z0-9.]/g, "");
  return `${parts[0]}.${parts[parts.length - 1][0]}`.replace(/[^a-z0-9.]/g, "");
}

function generatePassword() {
  const words = ["river", "amber", "cedar", "quartz", "meadow", "harbor", "lantern", "willow"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function AddStudentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addStudent, students } = useStore();
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [usernameTouched, setUsernameTouched] = React.useState(false);
  const [password, setPassword] = React.useState(generatePassword);
  const [yearGroup, setYearGroup] = React.useState("");
  const [usualSlot, setUsualSlot] = React.useState("");

  React.useEffect(() => {
    if (open) return;
    setName("");
    setUsername("");
    setUsernameTouched(false);
    setPassword(generatePassword());
    setYearGroup("");
    setUsualSlot("");
  }, [open]);

  const effectiveUsername = usernameTouched ? username : suggestUsername(name);
  const taken = students.some(
    (s) => s.username.toLowerCase() === effectiveUsername.trim().toLowerCase()
  );
  const valid = name.trim().length > 1 && effectiveUsername.trim().length > 1 && !taken;

  const submit = () => {
    if (!valid) return;
    const student = addStudent({
      name: name.trim(),
      username: effectiveUsername.trim(),
      yearGroup: yearGroup.trim() || undefined,
      usualSlot: usualSlot.trim() || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    onOpenChange(false);
    router.push(`/teacher/students/${student.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <DialogHeader
          title="Add a student"
          description="They sign in with a username and password. No email needed."
        />
        <DialogBody className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) submit();
              }}
              placeholder="Ada Lovelace"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" hint={taken ? "already taken" : undefined}>
              <Input
                value={effectiveUsername}
                onChange={(e) => {
                  setUsernameTouched(true);
                  setUsername(e.target.value);
                }}
                placeholder="ada.l"
                className={taken ? "border-danger/60" : undefined}
              />
            </Field>
            <Field label="Password">
              <div className="flex gap-1.5">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button
                  variant="secondary"
                  size="icon"
                  type="button"
                  aria-label="Generate a new password"
                  onClick={() => setPassword(generatePassword())}
                >
                  <RefreshCw />
                </Button>
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Year group" hint="optional">
              <Input
                value={yearGroup}
                onChange={(e) => setYearGroup(e.target.value)}
                placeholder="Grade 11"
              />
            </Field>
            <Field label="Usual slot" hint="optional">
              <Input
                value={usualSlot}
                onChange={(e) => setUsualSlot(e.target.value)}
                placeholder="Tue & Thu · 5:00 PM"
              />
            </Field>
          </div>

          <p className="text-2xs leading-relaxed text-faint">
            Write the password down now — it is stored hashed and cannot be read back. You can reset
            it any time from the student&apos;s profile.
          </p>
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

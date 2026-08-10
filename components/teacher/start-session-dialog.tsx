"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Radio, Search } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Pick a student, press start. Nothing else is asked for — no subject, no
 * title, no plan. The teacher has another class in ten minutes.
 */
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

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setStudentId(presetStudentId ?? "");
  }, [open, presetStudentId]);

  const filtered = students.filter((s) =>
    `${s.name} ${s.username}`.toLowerCase().includes(query.toLowerCase())
  );

  const start = (id: string) => {
    const sessionId = startSession(id);
    onOpenChange(false);
    router.push(`/session/${sessionId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <DialogHeader title="Start a class" />

        <DialogBody className="space-y-3">
          {liveId ? (
            <div className="flex items-center gap-2 rounded border border-live/25 bg-live/[0.06] px-3 py-2 text-xs text-ink">
              <Radio className="size-3.5 shrink-0 text-live" />
              A class is already recording. Starting another will end it.
            </div>
          ) : null}

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length === 1) start(filtered[0].id);
              }}
              placeholder="Search students…"
              className="pl-8"
            />
          </div>

          <div className="max-h-64 space-y-px overflow-y-auto rounded border border-line p-1 scrollbar-thin">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setStudentId(s.id)}
                onDoubleClick={() => start(s.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors",
                  studentId === s.id ? "bg-accent/[0.1]" : "hover:bg-ink/[0.04]"
                )}
              >
                <Avatar name={s.name} color={s.color} src={s.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{s.name}</span>
                  {s.usualSlot ? (
                    <span className="block truncate text-2xs text-faint">{s.usualSlot}</span>
                  ) : null}
                </span>
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-faint">
                No students match “{query}”.
              </p>
            ) : null}
          </div>

          <p className="flex items-start gap-2 px-0.5 text-2xs leading-relaxed text-faint">
            <Mic className="mt-px size-3 shrink-0" />
            Next you&apos;ll be asked for your microphone and to share the audio from your call.
            Nothing is captured before you allow it.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!studentId} onClick={() => start(studentId)}>
            Start class
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

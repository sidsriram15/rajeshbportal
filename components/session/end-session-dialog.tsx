"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link2, MessageSquareQuote, Square, Tag } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { clock } from "@/lib/format";
import type { Session } from "@/lib/types";

export function EndSessionDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { endSession, elapsed } = useStore();
  const router = useRouter();

  const unanswered = session.qa.filter((q) => !q.answer).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <DialogHeader
          title="End this session?"
          description="Recording and transcription stop, and Cadence drafts a summary you can edit before the student sees it."
        />
        <DialogBody className="space-y-3">
          <div className="grid grid-cols-4 divide-x divide-line rounded border border-line bg-canvas">
            <Stat label="Length" value={clock(elapsed)} />
            <Stat label="Topics" value={String(session.topics.length)} icon={Tag} />
            <Stat label="Questions" value={String(session.qa.length)} icon={MessageSquareQuote} />
            <Stat label="Links" value={String(session.resources.length)} icon={Link2} />
          </div>

          {unanswered > 0 ? (
            <p className="rounded border border-question/25 bg-question/[0.05] px-3 py-2 text-xs leading-relaxed text-ink">
              {unanswered} question{unanswered > 1 ? "s are" : " is"} still unanswered. You can
              answer {unanswered > 1 ? "them" : "it"} afterwards — the student will not see the
              session until you publish it.
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep teaching
          </Button>
          <Button
            variant="solidDanger"
            onClick={() => {
              endSession();
              onOpenChange(false);
              router.push(`/teacher/sessions/${session.id}`);
            }}
          >
            <Square className="size-3 fill-current" />
            End session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="flex items-center gap-1 text-2xs text-faint">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </p>
      <p className="num mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}

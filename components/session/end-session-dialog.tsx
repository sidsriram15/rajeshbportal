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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <DialogHeader
          title="End this class?"
          description="Recording stops and the write-up happens on its own. You don't need to wait for it."
        />
        <DialogBody>
          <div className="grid grid-cols-4 divide-x divide-line rounded border border-line bg-canvas">
            <Stat label="Length" value={clock(elapsed)} />
            <Stat label="Topics" value={String(session.topics.length)} icon={Tag} />
            <Stat
              label="Questions"
              value={String(session.questions.length)}
              icon={MessageSquareQuote}
            />
            <Stat label="Links" value={String(session.resources.length)} icon={Link2} />
          </div>
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
              router.push("/teacher");
            }}
          >
            <Square className="size-3 fill-current" />
            End class
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

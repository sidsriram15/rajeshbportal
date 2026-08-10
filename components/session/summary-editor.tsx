"use client";

import * as React from "react";
import { Check, Pencil, Plus, RotateCcw, Sparkles, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import type { Session } from "@/lib/types";

/** The "AI is writing" state shown right after a session ends. */
export function GeneratingSummary() {
  const steps = [
    "Aligning transcript with captured topics",
    "Extracting questions and matching your answers",
    "Drafting the summary",
  ];
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 850);
    return () => window.clearInterval(t);
  }, [steps.length]);

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 animate-pulse text-accent" />
        <p className="text-[13px] font-medium text-ink">Writing the session summary</p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 text-xs transition-colors ${
              i <= step ? "text-muted" : "text-faint/60"
            }`}
          >
            {i < step ? (
              <Check className="size-3 text-answer" />
            ) : (
              <span className="size-3 rounded-full border border-line-strong border-t-accent" />
            )}
            {s}
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2">
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[78%]" />
        <div className="h-2" />
        <Skeleton className="h-3 w-[88%]" />
        <Skeleton className="h-3 w-[64%]" />
      </div>
    </div>
  );
}

export function SummaryEditor({ session }: { session: Session }) {
  const { setSummaryDraft, setHomework } = useStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(session.summaryDraft);
  const [homeworkDraft, setHomeworkDraft] = React.useState("");

  React.useEffect(() => setDraft(session.summaryDraft), [session.summaryDraft]);

  const dirty = session.status === "published" && session.summaryDraft !== session.summary;
  const paragraphs = session.summaryDraft.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <Sparkles className="size-3.5 text-accent" />
          <span className="eyebrow">Class summary</span>
          {dirty ? <Badge tone="question">Unpublished edits</Badge> : null}
          <div className="ml-auto flex items-center gap-1.5">
            {editing ? (
              <>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setDraft(session.summaryDraft);
                    setEditing(false);
                  }}
                >
                  <X className="size-3" />
                  Cancel
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => {
                    setSummaryDraft(session.id, draft);
                    setEditing(false);
                  }}
                >
                  <Check className="size-3" />
                  Save
                </Button>
              </>
            ) : (
              <>
                {session.summary && session.summaryDraft !== session.summary ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setSummaryDraft(session.id, session.summary)}
                  >
                    <Undo2 className="size-3" />
                    Revert
                  </Button>
                ) : null}
                <Button size="xs" variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="size-3" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="p-3">
            <Textarea
              autoFocus
              rows={16}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  setSummaryDraft(session.id, draft);
                  setEditing(false);
                }
              }}
              className="text-sm leading-[1.7]"
            />
            <p className="mt-2 flex items-center justify-between text-2xs text-faint">
              <span>Blank line separates paragraphs. The student sees this exactly as written.</span>
              <span>
                <span className="kbd">⌘</span> <span className="kbd">↵</span> to save
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 px-5 py-4">
            {paragraphs.length ? (
              paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-[1.7] text-ink/90">
                  {p}
                </p>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-faint">
                No summary yet. Write one, or end a live session to have Cadence draft it.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Homework */}
      <div className="panel">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <span className="eyebrow">Practice for next time</span>
          <span className="num ml-auto text-2xs text-faint">{session.homework.length}</span>
        </div>
        <ul className="divide-y divide-line">
          {session.homework.map((h, i) => (
            <li key={`${h}-${i}`} className="group flex items-center gap-2.5 px-4 py-2">
              <span className="num w-4 shrink-0 text-2xs text-faint">{i + 1}</span>
              <span className="flex-1 text-[13px] text-ink">{h}</span>
              <button
                onClick={() => setHomework(session.id, session.homework.filter((_, x) => x !== i))}
                className="text-faint opacity-0 transition-all hover:text-danger group-hover:opacity-100"
                aria-label={`Remove ${h}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex items-center gap-2 border-t border-line px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!homeworkDraft.trim()) return;
            setHomework(session.id, [...session.homework, homeworkDraft.trim()]);
            setHomeworkDraft("");
          }}
        >
          <Plus className="size-3 shrink-0 text-faint" />
          <Input
            value={homeworkDraft}
            onChange={(e) => setHomeworkDraft(e.target.value)}
            placeholder="Add a practice item"
            className="h-7 border-transparent bg-transparent px-0 text-xs hover:border-transparent focus:ring-0"
          />
        </form>
      </div>
    </div>
  );
}

export function RegenerateHint() {
  return (
    <p className="flex items-center gap-1.5 px-1 text-2xs text-faint">
      <RotateCcw className="size-3" />
      Summaries are drafts. Nothing reaches the student until you publish.
    </p>
  );
}

"use client";

import * as React from "react";
import { CornerDownLeft, CornerDownRight, Link2, MessageSquareQuote, Tag } from "lucide-react";
import { useStore } from "@/lib/store";
import { hostOf } from "@/lib/format";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "topic" | "question" | "answer" | "resource";

const modes: Array<{ id: Mode; label: string; icon: typeof Tag; accent: string }> = [
  { id: "topic", label: "Topic", icon: Tag, accent: "text-topic" },
  { id: "question", label: "Question", icon: MessageSquareQuote, accent: "text-question" },
  { id: "answer", label: "Answer", icon: CornerDownRight, accent: "text-answer" },
  { id: "resource", label: "Resource", icon: Link2, accent: "text-resource" },
];

/**
 * Always-available capture bar. The teacher is talking while using this, so it
 * is one field, four modes, and no dialogs.
 */
export function Composer({ session }: { session: Session }) {
  const { addTopic, addQuestion, updateQA, addResource } = useStore();
  const [mode, setMode] = React.useState<Mode>("topic");
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pendingQuestion = [...session.qa].reverse().find((q) => !q.answer);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        setMode(modes[Number(e.key) - 1].id);
        inputRef.current?.focus();
      }
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement;
        if (/input|textarea/i.test(t.tagName) || t.isContentEditable) return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;

    if (mode === "topic") addTopic(session.id, text);
    if (mode === "question") addQuestion(session.id, text);
    if (mode === "answer" && pendingQuestion)
      updateQA(session.id, pendingQuestion.id, { answer: text });
    if (mode === "resource") {
      const url = text.startsWith("http") ? text : `https://${text}`;
      addResource(session.id, { title: hostOf(url), url, kind: "link" });
    }
    setValue("");
  };

  const active = modes.find((m) => m.id === mode)!;
  const disabled = mode === "answer" && !pendingQuestion;

  const placeholder =
    mode === "topic"
      ? "What are you covering right now?"
      : mode === "question"
        ? "What did they ask?"
        : mode === "answer"
          ? pendingQuestion
            ? `Answering: “${pendingQuestion.question.slice(0, 46)}${pendingQuestion.question.length > 46 ? "…" : ""}”`
            : "No open question to answer"
          : "Paste a link to share";

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 border-t border-line bg-surface/90 px-3 py-2 backdrop-blur"
    >
      <div className="flex shrink-0 items-center gap-0.5 rounded border border-line bg-canvas p-0.5">
        {modes.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              inputRef.current?.focus();
            }}
            title={`${m.label} — ⌘${i + 1}`}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-sm px-2 text-2xs font-medium transition-all duration-150",
              mode === m.id
                ? "bg-surface text-ink shadow-card"
                : "text-faint hover:text-muted"
            )}
          >
            <m.icon className={cn("size-3", mode === m.id ? m.accent : "")} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="h-8 w-full rounded border border-transparent bg-transparent pr-10 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line disabled:opacity-50"
        />
        <span
          className={cn(
            "pointer-events-none absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 text-2xs text-faint transition-opacity",
            value ? "opacity-100" : "opacity-0"
          )}
        >
          <CornerDownLeft className="size-3" />
        </span>
      </div>

      <span className="hidden shrink-0 items-center gap-1 text-2xs text-faint lg:flex">
        <span className="kbd">C</span> to capture
      </span>
      <span className={cn("size-1.5 shrink-0 rounded-full", active.accent, "bg-current")} />
    </form>
  );
}

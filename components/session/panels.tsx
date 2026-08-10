"use client";

import * as React from "react";
import {
  Check,
  ExternalLink,
  Link2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Badge, EmptyState, Meter } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ResourceIcon } from "@/components/session/resource-icon";
import { useStore } from "@/lib/store";
import { hostOf, stamp } from "@/lib/format";
import type { Resource, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Topics */

export function TopicsPanel({ session, editable }: { session: Session; editable: boolean }) {
  const { addTopic, updateTopic, removeTopic } = useStore();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [adding, setAdding] = React.useState("");

  if (session.topics.length === 0 && !editable)
    return <EmptyState compact icon={Tag} title="No topics recorded" />;

  return (
    <div className="space-y-1">
      {session.topics.map((t) => (
        <div
          key={t.id}
          className="group rounded border border-transparent px-2 py-1.5 transition-colors hover:border-line hover:bg-surface"
        >
          {editingId === t.id ? (
            <div className="space-y-1.5">
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    updateTopic(session.id, t.id, { label: draft.trim() });
                    setEditingId(null);
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
              <div className="flex gap-1">
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => {
                    if (draft.trim()) updateTopic(session.id, t.id, { label: draft.trim() });
                    setEditingId(null);
                  }}
                >
                  <Check className="size-3" />
                </Button>
                <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-topic" />
                <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink">{t.label}</p>
                {editable ? (
                  <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="iconSm"
                      variant="ghost"
                      aria-label="Rename topic"
                      onClick={() => {
                        setDraft(t.label);
                        setEditingId(t.id);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="iconSm"
                      variant="ghost"
                      aria-label="Delete topic"
                      className="hover:text-danger"
                      onClick={() => removeTopic(session.id, t.id)}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2 pl-3.5">
                <span className="num text-2xs text-faint">{stamp(t.at)}</span>
                <Meter value={t.confidence} tone="topic" ticks={6} />
                <span className="text-2xs text-faint">
                  {t.source === "manual" ? "added by you" : `${Math.round(t.confidence * 100)}%`}
                </span>
              </div>
            </>
          )}
        </div>
      ))}

      {editable ? (
        <form
          className="pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!adding.trim()) return;
            addTopic(session.id, adding.trim());
            setAdding("");
          }}
        >
          <div className="relative">
            <Plus className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-faint" />
            <Input
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              placeholder="Add a topic"
              className="h-7 border-dashed pl-7 text-xs"
            />
          </div>
        </form>
      ) : null}

      {session.topics.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-faint">
          Topics will appear here as they come up.
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- Questions */

export function QuestionsPanel({ session, editable }: { session: Session; editable: boolean }) {
  const { updateQA, removeQA, addQuestion } = useStore();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = React.useState("");
  const [adding, setAdding] = React.useState("");

  if (session.qa.length === 0 && !editable)
    return <EmptyState compact icon={MessageSquareQuote} title="No questions asked" />;

  return (
    <div className="space-y-1.5">
      {session.qa.map((q) => {
        const open = openId === q.id;
        return (
          <div
            key={q.id}
            className={cn(
              "group rounded border px-2.5 py-2 transition-colors",
              q.answer ? "border-transparent hover:border-line" : "border-question/25 bg-question/[0.04]"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="num shrink-0 pt-px text-2xs text-faint">{stamp(q.at)}</span>
              <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink">{q.question}</p>
              {editable ? (
                <Button
                  size="iconSm"
                  variant="ghost"
                  aria-label="Delete question"
                  className="shrink-0 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  onClick={() => removeQA(session.id, q.id)}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>

            {q.answer && !open ? (
              <p className="mt-1.5 border-l-2 border-answer/30 pl-2 text-xs leading-relaxed text-muted">
                {q.answer}
              </p>
            ) : null}

            {editable ? (
              open ? (
                <div className="mt-1.5 space-y-1.5">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={answerDraft}
                    onChange={(e) => setAnswerDraft(e.target.value)}
                    placeholder="What did you tell them?"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        updateQA(session.id, q.id, { answer: answerDraft.trim() });
                        setOpenId(null);
                      }
                      if (e.key === "Escape") setOpenId(null);
                    }}
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="xs"
                      variant="primary"
                      disabled={!answerDraft.trim()}
                      onClick={() => {
                        updateQA(session.id, q.id, { answer: answerDraft.trim() });
                        setOpenId(null);
                      }}
                    >
                      Save answer
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setOpenId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  className={cn(
                    "mt-1.5 text-2xs transition-colors",
                    q.answer ? "text-faint hover:text-ink" : "text-question hover:underline"
                  )}
                  onClick={() => {
                    setAnswerDraft(q.answer ?? "");
                    setOpenId(q.id);
                  }}
                >
                  {q.answer ? "Edit answer" : "Add your answer →"}
                </button>
              )
            ) : null}
          </div>
        );
      })}

      {editable ? (
        <form
          className="pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!adding.trim()) return;
            addQuestion(session.id, adding.trim());
            setAdding("");
          }}
        >
          <div className="relative">
            <Plus className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-faint" />
            <Input
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              placeholder="Log a question"
              className="h-7 border-dashed pl-7 text-xs"
            />
          </div>
        </form>
      ) : null}

      {session.qa.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-faint">
          Questions your student asks will land here.
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- Resources */

const KINDS: Resource["kind"][] = ["link", "doc", "video", "practice"];

export function ResourcesPanel({ session, editable }: { session: Session; editable: boolean }) {
  const { addResource, removeResource } = useStore();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [kind, setKind] = React.useState<Resource["kind"]>("link");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const normalised = url.startsWith("http") ? url.trim() : `https://${url.trim()}`;
    addResource(session.id, {
      title: title.trim() || hostOf(normalised),
      url: normalised,
      kind,
    });
    setTitle("");
    setUrl("");
    setKind("link");
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      {session.resources.map((r) => (
        <div key={r.id} className="group flex items-center gap-2 rounded px-1.5 py-1.5 transition-colors hover:bg-surface">
          <ResourceIcon kind={r.kind} />
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1"
          >
            <span className="block truncate text-[13px] text-ink hover:underline">{r.title}</span>
            <span className="block truncate text-2xs text-faint">{hostOf(r.url)}</span>
          </a>
          {editable ? (
            <Button
              size="iconSm"
              variant="ghost"
              aria-label="Remove resource"
              className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              onClick={() => removeResource(session.id, r.id)}
            >
              <Trash2 />
            </Button>
          ) : (
            <ExternalLink className="size-3.5 shrink-0 text-faint" />
          )}
        </div>
      ))}

      {session.resources.length === 0 && !open ? (
        <p className="px-2 py-6 text-center text-xs text-faint">
          Links you share during the lesson show up here for the student.
        </p>
      ) : null}

      {editable ? (
        open ? (
          <form onSubmit={submit} className="space-y-1.5 rounded border border-line bg-surface p-2">
            <Input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a URL"
              className="h-7 text-xs"
            />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Label (optional)"
              className="h-7 text-xs"
            />
            <div className="flex flex-wrap gap-1">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "h-6 rounded border px-2 text-2xs capitalize transition-colors",
                    kind === k
                      ? "border-ink bg-ink text-canvas"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 pt-0.5">
              <Button size="xs" variant="primary" disabled={!url.trim()}>
                Add resource
              </Button>
              <Button size="xs" variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-1.5 rounded border border-dashed border-line px-2 py-1.5 text-xs text-faint transition-colors hover:border-resource/40 hover:text-resource"
          >
            <Link2 className="size-3" />
            Share a link
          </button>
        )
      ) : null}
    </div>
  );
}

export function PanelCount({ n, tone }: { n: number; tone: "topic" | "question" | "resource" }) {
  return (
    <Badge tone={tone} className="num">
      {n}
    </Badge>
  );
}

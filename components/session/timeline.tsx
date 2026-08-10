"use client";

import * as React from "react";
import {
  Check,
  CornerDownRight,
  ExternalLink,
  Link2,
  MessageSquareQuote,
  MoreHorizontal,
  Pencil,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useStore } from "@/lib/store";
import { buildTimeline, hostOf, stamp } from "@/lib/format";
import type { Session, TimelineEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindMeta = {
  topic: { label: "Topic", dot: "bg-topic", text: "text-topic", icon: Tag },
  question: {
    label: "Question",
    dot: "bg-question",
    text: "text-question",
    icon: MessageSquareQuote,
  },
  answer: { label: "Answer", dot: "bg-answer", text: "text-answer", icon: CornerDownRight },
  resource: { label: "Resource", dot: "bg-resource", text: "text-resource", icon: Link2 },
} as const;

export function Timeline({
  session,
  editable,
  autoScroll,
  filter,
}: {
  session: Session;
  editable: boolean;
  autoScroll?: boolean;
  filter?: Array<TimelineEntry["kind"]>;
}) {
  const endRef = React.useRef<HTMLDivElement>(null);
  const all = React.useMemo(() => buildTimeline(session), [session]);
  const entries = filter?.length ? all.filter((e) => filter.includes(e.kind)) : all;

  React.useEffect(() => {
    if (!autoScroll) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, autoScroll]);

  return (
    <ol className="relative pl-[52px]">
      <span
        className="absolute left-[52px] top-2 h-[calc(100%-16px)] w-px -translate-x-1/2 bg-line"
        aria-hidden
      />
      {entries.map((entry, i) => (
        <TimelineItem
          key={entry.id}
          entry={entry}
          session={session}
          editable={editable}
          fresh={autoScroll ? i >= entries.length - 1 : false}
        />
      ))}
      <div ref={endRef} />
    </ol>
  );
}

function TimelineItem({
  entry,
  session,
  editable,
  fresh,
}: {
  entry: TimelineEntry;
  session: Session;
  editable: boolean;
  fresh: boolean;
}) {
  const { updateTopic, removeTopic, updateQuestion, removeQuestion, removeResource } = useStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(entry.title);

  const meta = kindMeta[entry.kind];
  const topic = session.topics.find((t) => t.id === entry.refId);
  const question = session.questions.find((q) => q.id === entry.refId);
  const resource = session.resources.find((r) => r.id === entry.refId);

  const save = () => {
    const value = draft.trim();
    if (value) {
      if (entry.kind === "topic" && topic) updateTopic(session.id, topic.id, value);
      if (entry.kind === "question" && question)
        updateQuestion(session.id, question.id, { text: value });
      if (entry.kind === "answer" && question)
        updateQuestion(session.id, question.id, { answer: value });
    }
    setEditing(false);
  };

  const remove = () => {
    if (entry.kind === "topic" && topic) removeTopic(session.id, topic.id);
    else if (resource) removeResource(session.id, resource.id);
    else if (question) removeQuestion(session.id, question.id);
  };

  return (
    <li
      className={cn(
        "group relative -ml-[52px] flex gap-3 rounded-r py-2 pl-3 pr-2 transition-colors hover:bg-ink/[0.025]",
        fresh && "animate-fade-up"
      )}
    >
      <span className="num w-[30px] shrink-0 pt-[3px] text-right text-2xs text-faint">
        {stamp(entry.atMs)}
      </span>

      <span className="relative w-3 shrink-0 pt-[7px]">
        <span
          className={cn(
            "block size-[7px] rounded-full ring-4 ring-canvas transition-transform",
            meta.dot,
            entry.kind === "answer" && "size-[5px] opacity-70",
            fresh && "animate-pulse-ring"
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-2xs font-medium uppercase tracking-[0.07em]", meta.text)}>
            {meta.label}
          </span>
          {entry.editedByTeacher && entry.kind !== "resource" ? (
            <Badge tone="outline">edited</Badge>
          ) : null}
          {topic && topic.origin === "ai" && topic.confidence < 0.8 ? (
            <Badge tone="outline">low confidence</Badge>
          ) : null}
          {question?.withheld ? <Badge tone="question">withheld</Badge> : null}

          {editable ? (
            <div className="ml-auto opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="ghost" size="iconSm" aria-label="Edit entry">
                    <MoreHorizontal />
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  {entry.kind !== "resource" ? (
                    <MenuItem
                      onSelect={() => {
                        setDraft(entry.title);
                        setEditing(true);
                      }}
                    >
                      <Pencil />
                      Edit text
                    </MenuItem>
                  ) : null}
                  {entry.kind === "resource" && resource?.url ? (
                    <MenuItem onSelect={() => window.open(resource.url, "_blank")}>
                      <ExternalLink />
                      Open link
                    </MenuItem>
                  ) : null}
                  <MenuItem destructive onSelect={remove}>
                    <Trash2 />
                    Delete
                  </MenuItem>
                </MenuContent>
              </Menu>
            </div>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-1 space-y-1.5">
            <Textarea
              autoFocus
              rows={entry.kind === "answer" ? 4 : 2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <div className="flex items-center gap-1.5">
              <Button size="xs" variant="primary" onClick={save}>
                <Check className="size-3" />
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-3" />
                Cancel
              </Button>
              <span className="ml-auto text-2xs text-faint">
                <span className="kbd">⌘</span> <span className="kbd">↵</span> to save
              </span>
            </div>
          </div>
        ) : entry.kind === "resource" && resource ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-[13px] text-ink hover:underline"
          >
            <span className="truncate">{resource.title}</span>
            {resource.url ? (
              <span className="shrink-0 text-2xs text-faint">{hostOf(resource.url)}</span>
            ) : null}
            <ExternalLink className="size-3 shrink-0 text-faint" />
          </a>
        ) : (
          <p
            className={cn(
              "mt-0.5 text-[13px] leading-relaxed",
              entry.kind === "answer" ? "text-muted" : "text-ink"
            )}
          >
            {entry.title}
          </p>
        )}

        {entry.kind === "question" && question && !question.answer && editable ? (
          <AnswerInline sessionId={session.id} questionId={question.id} />
        ) : null}
      </div>
    </li>
  );
}

function AnswerInline({ sessionId, questionId }: { sessionId: string; questionId: string }) {
  const { updateQuestion } = useStore();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");

  const save = () => {
    if (!text.trim()) return;
    updateQuestion(sessionId, questionId, { answer: text.trim() });
    setOpen(false);
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 rounded border border-dashed border-line px-1.5 py-0.5 text-2xs text-faint transition-colors hover:border-answer/40 hover:text-answer"
      >
        <CornerDownRight className="size-3" />
        Add the answer
      </button>
    );

  return (
    <div className="mt-1.5 space-y-1.5">
      <Textarea
        autoFocus
        rows={3}
        value={text}
        placeholder="What did you tell them?"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="flex items-center gap-1.5">
        <Button size="xs" variant="primary" disabled={!text.trim()} onClick={save}>
          Save answer
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

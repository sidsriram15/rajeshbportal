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
  Radio,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useStore } from "@/lib/store";
import { hostOf, stamp } from "@/lib/format";
import type { Session, TimelineEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindMeta = {
  topic: { label: "Topic", dot: "bg-topic", text: "text-topic", icon: Tag },
  question: { label: "Question", dot: "bg-question", text: "text-question", icon: MessageSquareQuote },
  answer: { label: "Answer", dot: "bg-answer", text: "text-answer", icon: CornerDownRight },
  resource: { label: "Resource", dot: "bg-resource", text: "text-resource", icon: Link2 },
  system: { label: "Session", dot: "bg-faint", text: "text-faint", icon: Radio },
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
  filter?: Array<TimelineEvent["kind"]>;
}) {
  const endRef = React.useRef<HTMLDivElement>(null);
  const events = filter?.length
    ? session.events.filter((e) => filter.includes(e.kind))
    : session.events;

  React.useEffect(() => {
    if (!autoScroll) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length, autoScroll]);

  return (
    <ol className="relative pl-[52px]">
      {/* the rule */}
      <span
        className="absolute left-[52px] top-2 h-[calc(100%-16px)] w-px -translate-x-1/2 bg-line"
        aria-hidden
      />
      {events.map((event, i) => (
        <TimelineItem
          key={event.id}
          event={event}
          session={session}
          editable={editable}
          fresh={autoScroll ? i >= events.length - 1 : false}
        />
      ))}
      <div ref={endRef} />
    </ol>
  );
}

function TimelineItem({
  event,
  session,
  editable,
  fresh,
}: {
  event: TimelineEvent;
  session: Session;
  editable: boolean;
  fresh: boolean;
}) {
  const { updateTopic, removeTopic, updateQA, removeQA, removeResource } = useStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(event.title);

  const meta = kindMeta[event.kind];
  const topic = session.topics.find((t) => t.id === event.refId);
  const qa = session.qa.find((q) => q.id === event.refId);
  const resource = session.resources.find((r) => r.id === event.refId);

  const save = () => {
    const value = draft.trim();
    if (value) {
      if (event.kind === "topic" && topic) updateTopic(session.id, topic.id, { label: value });
      if (event.kind === "question" && qa) updateQA(session.id, qa.id, { question: value });
      if (event.kind === "answer" && qa) updateQA(session.id, qa.id, { answer: value });
    }
    setEditing(false);
  };

  const remove = () => {
    if (event.kind === "topic" && topic) removeTopic(session.id, topic.id);
    else if (resource) removeResource(session.id, resource.id);
    else if (qa) removeQA(session.id, qa.id);
  };

  return (
    <li
      className={cn(
        "group relative -ml-[52px] flex gap-3 rounded-r py-2 pl-3 pr-2 transition-colors hover:bg-ink/[0.025]",
        fresh && "animate-fade-up"
      )}
    >
      <span className="num w-[30px] shrink-0 pt-[3px] text-right text-2xs text-faint">
        {stamp(event.at)}
      </span>

      <span className="relative w-3 shrink-0 pt-[7px]">
        <span
          className={cn(
            "block size-[7px] rounded-full ring-4 ring-canvas transition-transform",
            meta.dot,
            event.kind === "answer" && "size-[5px] opacity-70",
            fresh && "animate-pulse-ring"
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-2xs font-medium uppercase tracking-[0.07em]", meta.text)}>
            {meta.label}
          </span>
          {topic?.source === "manual" || qa?.source === "manual" ? (
            <Badge tone="outline">manual</Badge>
          ) : null}
          {topic && topic.source === "detected" && topic.confidence < 0.8 ? (
            <Badge tone="outline">low confidence</Badge>
          ) : null}

          {editable && event.kind !== "system" ? (
            <div className="ml-auto opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="ghost" size="iconSm" aria-label="Edit entry">
                    <MoreHorizontal />
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  {event.kind !== "resource" ? (
                    <MenuItem
                      onSelect={() => {
                        setDraft(event.title);
                        setEditing(true);
                      }}
                    >
                      <Pencil />
                      Edit text
                    </MenuItem>
                  ) : null}
                  {event.kind === "resource" && resource ? (
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
              rows={event.kind === "answer" ? 4 : 2}
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
        ) : event.kind === "resource" && resource ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-[13px] text-ink hover:underline"
          >
            <span className="truncate">{resource.title}</span>
            <span className="shrink-0 text-2xs text-faint">{hostOf(resource.url)}</span>
            <ExternalLink className="size-3 shrink-0 text-faint" />
          </a>
        ) : (
          <p
            className={cn(
              "mt-0.5 text-[13px] leading-relaxed",
              event.kind === "answer" ? "text-muted" : "text-ink",
              event.kind === "system" && "text-faint"
            )}
          >
            {event.title}
          </p>
        )}

        {event.kind === "question" && qa && !qa.answer && editable ? (
          <AnswerInline sessionId={session.id} qaId={qa.id} />
        ) : null}

        {event.kind === "system" && event.detail ? (
          <p className="text-2xs text-faint">{event.detail}</p>
        ) : null}
      </div>
    </li>
  );
}

function AnswerInline({ sessionId, qaId }: { sessionId: string; qaId: string }) {
  const { updateQA } = useStore();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 rounded border border-dashed border-line px-1.5 py-0.5 text-2xs text-faint transition-colors hover:border-answer/40 hover:text-answer"
      >
        <CornerDownRight className="size-3" />
        Record your answer
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
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) {
            updateQA(sessionId, qaId, { answer: text.trim() });
            setOpen(false);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="flex items-center gap-1.5">
        <Button
          size="xs"
          variant="primary"
          disabled={!text.trim()}
          onClick={() => {
            updateQA(sessionId, qaId, { answer: text.trim() });
            setOpen(false);
          }}
        >
          Save answer
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { AiMark, Skeleton } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import type { NoteKind, Session } from "@/lib/types";

/** Shown while the class is still being written up in the background. */
export function ProcessingNotice() {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2">
        <Loader2 className="size-3.5 animate-spin text-accent" />
        <p className="text-[13px] font-medium text-ink">Writing this class up</p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        This runs on its own and reaches the student when it&apos;s done. You can close this page.
      </p>
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
  const { setSummary } = useStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(session.summary ?? "");

  React.useEffect(() => setDraft(session.summary ?? ""), [session.summary]);

  const paragraphs = (session.summary ?? "").split("\n\n").filter(Boolean);

  return (
    <div className="panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="eyebrow">Summary</span>
        {session.summary && !session.summaryEditedByTeacher ? <AiMark /> : null}
        <div className="ml-auto flex items-center gap-1.5">
          {editing ? (
            <>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setDraft(session.summary ?? "");
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
                  setSummary(session.id, draft);
                  setEditing(false);
                }}
              >
                <Check className="size-3" />
                Save
              </Button>
            </>
          ) : (
            <Button size="xs" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-3" />
              Edit
            </Button>
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
                setSummary(session.id, draft);
                setEditing(false);
              }
            }}
            className="text-sm leading-[1.7]"
          />
          <p className="mt-2 flex items-center justify-between text-2xs text-faint">
            <span>Your edit is kept — it won&apos;t be overwritten later.</span>
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
            <p className="py-6 text-center text-xs text-faint">No summary for this class.</p>
          )}
        </div>
      )}
    </div>
  );
}

const noteTitles: Record<NoteKind, string> = {
  key_point: "Key points",
  practice: "Practice / next steps",
};

export function NotesEditor({ session, kind }: { session: Session; kind: NoteKind }) {
  const { addNote, updateNote, removeNote } = useStore();
  const [adding, setAdding] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const items = session.notes.filter((n) => n.kind === kind);
  const anyAutomatic = items.some((n) => n.origin === "ai" && !n.editedByTeacher);

  return (
    <div className="panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="eyebrow">{noteTitles[kind]}</span>
        {anyAutomatic ? <AiMark /> : null}
        <span className="num ml-auto text-2xs text-faint">{items.length}</span>
      </div>

      <ul className="divide-y divide-line">
        {items.map((n, i) => (
          <li key={n.id} className="group flex items-start gap-2.5 px-4 py-2">
            <span className="num w-4 shrink-0 pt-px text-2xs text-faint">{i + 1}</span>
            {editingId === n.id ? (
              <div className="flex-1 space-y-1.5">
                <Textarea
                  autoFocus
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                      updateNote(session.id, n.id, draft.trim());
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    variant="primary"
                    disabled={!draft.trim()}
                    onClick={() => {
                      updateNote(session.id, n.id, draft.trim());
                      setEditingId(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 text-[13px] leading-snug text-ink">{n.text}</span>
                <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="iconSm"
                    variant="ghost"
                    aria-label="Edit"
                    onClick={() => {
                      setDraft(n.text);
                      setEditingId(n.id);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    aria-label="Remove"
                    className="hover:text-danger"
                    onClick={() => removeNote(session.id, n.id)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        className="flex items-center gap-2 border-t border-line px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!adding.trim()) return;
          addNote(session.id, kind, adding.trim());
          setAdding("");
        }}
      >
        <Plus className="size-3 shrink-0 text-faint" />
        <Input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          placeholder={kind === "practice" ? "Add a practice item" : "Add a key point"}
          className="h-7 border-transparent bg-transparent px-0 text-xs hover:border-transparent focus:ring-0"
        />
      </form>
    </div>
  );
}

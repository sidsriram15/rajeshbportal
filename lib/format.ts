import type { Session, TimelineEntry } from "./types";

export function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** mm:ss stamp from milliseconds, for transcript and timeline gutters. */
export function stamp(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const DAY = 86400000;

export function relativeDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < 0 && diff > -7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "Aug 9" — the short form sessions are identified by now that titles are gone. */
export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function durationLabel(seconds: number) {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} sec`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

export function totalTimeLabel(seconds: number) {
  const m = Math.round(seconds / 60);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (!h) return `${rest}m`;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------------------------------------------------------------- sessions */

/** "Aug 9 · 52 min" — how a session is named now that there are no titles. */
export function sessionLabel(session: Pick<Session, "startedAt" | "durationSeconds">) {
  return `${shortDate(session.startedAt)} · ${durationLabel(session.durationSeconds)}`;
}

/** "Recursion · Big-O · Complexity Analysis" */
export function topicLine(session: Pick<Session, "topics">, max = 3) {
  return session.topics
    .slice(0, max)
    .map((t) => t.label)
    .join(" · ");
}

/**
 * Merges topics, questions, answers and resources into one chronological feed.
 * Derived on read rather than stored, so an edit anywhere is reflected here
 * without a second write path to keep in sync.
 */
export function buildTimeline(session: Session): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  session.topics.forEach((t) =>
    entries.push({
      id: `tl_topic_${t.id}`,
      kind: "topic",
      atMs: t.firstAtMs,
      refId: t.id,
      title: t.label,
      origin: t.origin,
      editedByTeacher: t.editedByTeacher,
    })
  );

  session.questions.forEach((q) => {
    entries.push({
      id: `tl_q_${q.id}`,
      kind: "question",
      atMs: q.askedAtMs,
      refId: q.id,
      title: q.text,
      origin: q.origin,
      editedByTeacher: q.editedByTeacher,
    });
    if (q.answer) {
      entries.push({
        id: `tl_a_${q.id}`,
        kind: "answer",
        atMs: q.askedAtMs + 12000,
        refId: q.id,
        title: q.answer,
        origin: q.origin,
        editedByTeacher: q.editedByTeacher,
      });
    }
  });

  session.resources.forEach((r) =>
    entries.push({
      id: `tl_r_${r.id}`,
      kind: "resource",
      atMs: r.atMs ?? 0,
      refId: r.id,
      title: r.title,
      detail: r.url,
      origin: "teacher",
      editedByTeacher: true,
    })
  );

  return entries.sort((a, b) => a.atMs - b.atMs);
}

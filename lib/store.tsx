"use client";

import * as React from "react";
import {
  LIVE_SESSION_ID,
  buildEvents,
  generatedSummaryTemplate,
  liveScript,
  makeLiveSession,
  sessions as seedSessions,
  students as seedStudents,
} from "./mock-data";
import type {
  Portal,
  QA,
  Resource,
  Session,
  Student,
  Subject,
  TimelineEvent,
  Topic,
} from "./types";
import { uid } from "./format";

type SummaryPhase = "idle" | "generating" | "ready";

interface Store {
  students: Student[];
  sessions: Session[];
  portal: Portal;
  /** Which student the student portal is signed in as. */
  viewerId: string;
  liveId: string | null;
  elapsed: number;
  summaryPhase: SummaryPhase;

  setPortal: (p: Portal) => void;
  setViewer: (id: string) => void;

  addStudent: (s: Omit<Student, "id" | "joinedAt" | "color">) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;

  startSession: (studentId: string, subject: Subject, title: string) => string;
  endSession: () => void;
  clearSummaryPhase: () => void;

  addTopic: (sessionId: string, label: string) => void;
  updateTopic: (sessionId: string, topicId: string, patch: Partial<Topic>) => void;
  removeTopic: (sessionId: string, topicId: string) => void;

  addQuestion: (sessionId: string, question: string) => void;
  updateQA: (sessionId: string, qaId: string, patch: Partial<QA>) => void;
  removeQA: (sessionId: string, qaId: string) => void;

  addResource: (sessionId: string, r: Omit<Resource, "id" | "at">) => void;
  removeResource: (sessionId: string, id: string) => void;

  setSummaryDraft: (sessionId: string, text: string) => void;
  publishSummary: (sessionId: string) => void;
  unpublishSummary: (sessionId: string) => void;
  setHomework: (sessionId: string, items: string[]) => void;
}

const StoreContext = React.createContext<Store | null>(null);

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

const PORTAL_KEY = "cadence.portal";
const VIEWER_KEY = "cadence.viewer";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = React.useState<Student[]>(seedStudents);
  const [sessions, setSessions] = React.useState<Session[]>(seedSessions);
  const [portal, setPortalState] = React.useState<Portal>("teacher");
  const [viewerId, setViewerId] = React.useState<string>("s_maya");
  const [liveId, setLiveId] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [summaryPhase, setSummaryPhase] = React.useState<SummaryPhase>("idle");
  const playedRef = React.useRef<Set<number>>(new Set());

  /* Restore the lightweight demo preferences. */
  React.useEffect(() => {
    const p = window.localStorage.getItem(PORTAL_KEY) as Portal | null;
    const v = window.localStorage.getItem(VIEWER_KEY);
    if (p === "teacher" || p === "student") setPortalState(p);
    if (v) setViewerId(v);
  }, []);

  const setPortal = React.useCallback((p: Portal) => {
    setPortalState(p);
    window.localStorage.setItem(PORTAL_KEY, p);
  }, []);

  const setViewer = React.useCallback((id: string) => {
    setViewerId(id);
    window.localStorage.setItem(VIEWER_KEY, id);
  }, []);

  const patchSession = React.useCallback(
    (sessionId: string, fn: (s: Session) => Session) => {
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? fn(s) : s)));
    },
    []
  );

  const pushEvent = (s: Session, e: Omit<TimelineEvent, "id">): Session => ({
    ...s,
    events: [...s.events, { ...e, id: uid("e") }],
  });

  /* ------------------------------------------------------------ live clock */

  React.useEffect(() => {
    if (!liveId) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [liveId]);

  /* --------------------------------------- scripted stream into the session */

  React.useEffect(() => {
    if (!liveId) return;
    const due = liveScript.filter((step, i) => step.at <= elapsed && !playedRef.current.has(i));
    if (due.length === 0) return;

    liveScript.forEach((step, i) => {
      if (step.at > elapsed || playedRef.current.has(i)) return;
      playedRef.current.add(i);
      const at = step.at;

      patchSession(liveId, (s) => {
        switch (step.kind) {
          case "topic": {
            const topic: Topic = {
              id: uid("t"),
              label: String(step.payload.label),
              at,
              minutes: Number(step.payload.minutes ?? 8),
              confidence: Number(step.payload.confidence ?? 0.85),
              source: "detected",
            };
            return pushEvent({ ...s, topics: [...s.topics, topic] }, {
              kind: "topic",
              at,
              refId: topic.id,
              title: topic.label,
            });
          }
          case "question": {
            const q: QA = {
              id: uid("q"),
              at,
              question: String(step.payload.question),
              answer: null,
              topicId: s.topics.at(-1)?.id ?? null,
              source: "detected",
            };
            return pushEvent({ ...s, qa: [...s.qa, q] }, {
              kind: "question",
              at,
              refId: q.id,
              title: q.question,
            });
          }
          case "answer": {
            const target = [...s.qa].reverse().find((q) => !q.answer);
            if (!target) return s;
            const answer = String(step.payload.answer);
            return pushEvent(
              {
                ...s,
                qa: s.qa.map((q) => (q.id === target.id ? { ...q, answer } : q)),
              },
              { kind: "answer", at, refId: target.id, title: answer }
            );
          }
          case "resource": {
            const r: Resource = {
              id: uid("r"),
              at,
              title: String(step.payload.title),
              url: String(step.payload.url),
              kind: (step.payload.kind as Resource["kind"]) ?? "link",
            };
            return pushEvent({ ...s, resources: [...s.resources, r] }, {
              kind: "resource",
              at,
              refId: r.id,
              title: r.title,
              detail: r.url,
            });
          }
          case "transcript": {
            return {
              ...s,
              transcript: [
                ...s.transcript,
                {
                  at,
                  speaker: step.payload.speaker as "teacher" | "student",
                  text: String(step.payload.text),
                },
              ],
            };
          }
          default:
            return s;
        }
      });
    });
  }, [elapsed, liveId, patchSession]);

  /* --------------------------------------------------------------- actions */

  const value: Store = {
    students,
    sessions,
    portal,
    viewerId,
    liveId,
    elapsed,
    summaryPhase,
    setPortal,
    setViewer,

    addStudent(input) {
      const palette = [
        "226 52% 44%",
        "268 38% 46%",
        "166 44% 32%",
        "28 74% 40%",
        "4 68% 47%",
        "196 52% 36%",
      ];
      const student: Student = {
        ...input,
        id: uid("s"),
        joinedAt: new Date().toISOString(),
        color: palette[students.length % palette.length],
      };
      setStudents((prev) => [student, ...prev]);
      return student;
    },

    updateStudent(id, patch) {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },

    startSession(studentId, subject, title) {
      const s = makeLiveSession(studentId, subject, title);
      playedRef.current = new Set();
      setElapsed(0);
      setSummaryPhase("idle");
      setSessions((prev) => [s, ...prev.filter((x) => x.id !== LIVE_SESSION_ID)]);
      setLiveId(s.id);
      return s.id;
    },

    endSession() {
      const id = liveId;
      if (!id) return;
      const minutes = Math.max(1, Math.round(elapsed / 60));
      setSummaryPhase("generating");
      setLiveId(null);
      patchSession(id, (s) => ({
        ...s,
        status: "draft",
        durationMin: minutes,
        zoom: { connected: false, recording: false, participants: 0 },
      }));

      /* Simulated summary generation. */
      window.setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            const student = students.find((st) => st.id === s.studentId);
            const draft = generatedSummaryTemplate(
              student?.name ?? "the student",
              s.topics.map((t) => t.label)
            );
            return {
              ...s,
              summaryDraft: draft,
              homework: [
                "Rework the pulley problems from the homework set",
                "Write the constraint equation for a movable pulley",
              ],
            };
          })
        );
        setSummaryPhase("ready");
      }, 2600);
    },

    clearSummaryPhase() {
      setSummaryPhase("idle");
    },

    addTopic(sessionId, label) {
      patchSession(sessionId, (s) => {
        const topic: Topic = {
          id: uid("t"),
          label,
          at: s.status === "live" ? elapsed : (s.topics.at(-1)?.at ?? 0) + 60,
          minutes: 5,
          confidence: 1,
          source: "manual",
        };
        return pushEvent({ ...s, topics: [...s.topics, topic] }, {
          kind: "topic",
          at: topic.at,
          refId: topic.id,
          title: label,
        });
      });
    },

    updateTopic(sessionId, topicId, patch) {
      patchSession(sessionId, (s) => ({
        ...s,
        topics: s.topics.map((t) => (t.id === topicId ? { ...t, ...patch } : t)),
        events: s.events.map((e) =>
          e.kind === "topic" && e.refId === topicId && patch.label
            ? { ...e, title: patch.label }
            : e
        ),
      }));
    },

    removeTopic(sessionId, topicId) {
      patchSession(sessionId, (s) => ({
        ...s,
        topics: s.topics.filter((t) => t.id !== topicId),
        events: s.events.filter((e) => !(e.kind === "topic" && e.refId === topicId)),
      }));
    },

    addQuestion(sessionId, question) {
      patchSession(sessionId, (s) => {
        const q: QA = {
          id: uid("q"),
          at: s.status === "live" ? elapsed : (s.qa.at(-1)?.at ?? 0) + 60,
          question,
          answer: null,
          topicId: s.topics.at(-1)?.id ?? null,
          source: "manual",
        };
        return pushEvent({ ...s, qa: [...s.qa, q] }, {
          kind: "question",
          at: q.at,
          refId: q.id,
          title: question,
        });
      });
    },

    updateQA(sessionId, qaId, patch) {
      patchSession(sessionId, (s) => {
        const existing = s.qa.find((q) => q.id === qaId);
        const gainedAnswer = Boolean(patch.answer) && !existing?.answer;
        const next: Session = {
          ...s,
          qa: s.qa.map((q) => (q.id === qaId ? { ...q, ...patch } : q)),
          events: s.events.map((e) => {
            if (e.refId !== qaId) return e;
            if (e.kind === "question" && patch.question) return { ...e, title: patch.question };
            if (e.kind === "answer" && patch.answer) return { ...e, title: patch.answer };
            return e;
          }),
        };
        if (!gainedAnswer || !existing) return next;
        return pushEvent(next, {
          kind: "answer",
          at: s.status === "live" ? elapsed : existing.at + 15,
          refId: qaId,
          title: String(patch.answer),
        });
      });
    },

    removeQA(sessionId, qaId) {
      patchSession(sessionId, (s) => ({
        ...s,
        qa: s.qa.filter((q) => q.id !== qaId),
        events: s.events.filter((e) => e.refId !== qaId),
      }));
    },

    addResource(sessionId, r) {
      patchSession(sessionId, (s) => {
        const resource: Resource = { ...r, id: uid("r"), at: s.status === "live" ? elapsed : 0 };
        return pushEvent({ ...s, resources: [...s.resources, resource] }, {
          kind: "resource",
          at: resource.at,
          refId: resource.id,
          title: resource.title,
          detail: resource.url,
        });
      });
    },

    removeResource(sessionId, id) {
      patchSession(sessionId, (s) => ({
        ...s,
        resources: s.resources.filter((r) => r.id !== id),
        events: s.events.filter((e) => e.refId !== id),
      }));
    },

    setSummaryDraft(sessionId, text) {
      patchSession(sessionId, (s) => ({ ...s, summaryDraft: text }));
    },

    publishSummary(sessionId) {
      patchSession(sessionId, (s) => ({
        ...s,
        status: "published",
        summary: s.summaryDraft,
        events: s.events.length ? s.events : buildEvents(s),
      }));
    },

    unpublishSummary(sessionId) {
      patchSession(sessionId, (s) => ({ ...s, status: "draft" }));
    },

    setHomework(sessionId, items) {
      patchSession(sessionId, (s) => ({ ...s, homework: items }));
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/* ------------------------------------------------------------- selectors */

export function useStudent(id: string | undefined) {
  const { students } = useStore();
  return students.find((s) => s.id === id);
}

export function useSession(id: string | undefined) {
  const { sessions } = useStore();
  return sessions.find((s) => s.id === id);
}

export function useStudentSessions(studentId: string | undefined) {
  const { sessions } = useStore();
  return React.useMemo(
    () =>
      sessions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)),
    [sessions, studentId]
  );
}

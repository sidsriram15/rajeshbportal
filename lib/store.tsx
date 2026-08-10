"use client";

import * as React from "react";
import {
  goals as seedGoals,
  goalsByStudent as seedGoalsByStudent,
  makeLiveSession,
  sessions as seedSessions,
  snapshots as seedSnapshots,
  students as seedStudents,
  teacher as seedTeacher,
} from "./mock-data";
import type {
  Goal,
  Question,
  Resource,
  Session,
  SessionNote,
  Snapshot,
  Student,
  Teacher,
  Topic,
} from "./types";
import { uid } from "./format";

/**
 * TEMPORARY client store. Phase 1 keeps the UI on local state so the visual
 * direction can be reviewed before any backend exists. Phase 3 replaces this
 * entirely with server components + server actions over Postgres.
 */

type Viewer = "teacher" | "student";

interface Store {
  teacher: Teacher;
  students: Student[];
  sessions: Session[];
  snapshots: Record<string, Snapshot>;
  goals: Goal[];
  goalsByStudent: Record<string, string[]>;

  /** Preview-only, removed with Phase 2 auth. */
  viewer: Viewer;
  viewerStudentId: string;
  setViewer: (v: Viewer) => void;
  setViewerStudent: (id: string) => void;

  liveId: string | null;
  elapsed: number;

  addStudent: (input: {
    name: string;
    username: string;
    yearGroup?: string;
    usualSlot?: string;
    timezone: string;
  }) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  startSession: (studentId: string) => string;
  endSession: () => void;

  setSnapshot: (studentId: string, workingOn: string) => void;
  addGoal: (studentId: string, text: string) => void;
  updateGoal: (goalId: string, text: string) => void;
  removeGoal: (studentId: string, goalId: string) => void;

  addTopic: (sessionId: string, label: string) => void;
  updateTopic: (sessionId: string, topicId: string, label: string) => void;
  removeTopic: (sessionId: string, topicId: string) => void;

  addQuestion: (sessionId: string, text: string) => void;
  updateQuestion: (sessionId: string, id: string, patch: Partial<Question>) => void;
  removeQuestion: (sessionId: string, id: string) => void;

  addResource: (sessionId: string, r: { title: string; url: string }) => void;
  removeResource: (sessionId: string, id: string) => void;

  setSummary: (sessionId: string, text: string) => void;
  addNote: (sessionId: string, kind: SessionNote["kind"], text: string) => void;
  updateNote: (sessionId: string, id: string, text: string) => void;
  removeNote: (sessionId: string, id: string) => void;

  resolveAttention: (sessionId: string, itemId: string) => void;
}

const StoreContext = React.createContext<Store | null>(null);

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

const VIEWER_KEY = "preview.viewer";
const VIEWER_STUDENT_KEY = "preview.viewerStudent";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = React.useState<Student[]>(seedStudents);
  const [sessions, setSessions] = React.useState<Session[]>(seedSessions);
  const [snapshots, setSnapshots] = React.useState(seedSnapshots);
  const [goals, setGoals] = React.useState<Goal[]>(seedGoals);
  const [goalsByStudent, setGoalsByStudent] = React.useState(seedGoalsByStudent);
  const [viewer, setViewerState] = React.useState<Viewer>("teacher");
  const [viewerStudentId, setViewerStudentIdState] = React.useState("s_maya");
  const [liveId, setLiveId] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const v = window.localStorage.getItem(VIEWER_KEY) as Viewer | null;
    const s = window.localStorage.getItem(VIEWER_STUDENT_KEY);
    if (v === "teacher" || v === "student") setViewerState(v);
    if (s) setViewerStudentIdState(s);
  }, []);

  const setViewer = React.useCallback((v: Viewer) => {
    setViewerState(v);
    window.localStorage.setItem(VIEWER_KEY, v);
  }, []);

  const setViewerStudent = React.useCallback((id: string) => {
    setViewerStudentIdState(id);
    window.localStorage.setItem(VIEWER_STUDENT_KEY, id);
  }, []);

  const patch = React.useCallback((sessionId: string, fn: (s: Session) => Session) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? fn(s) : s)));
  }, []);

  /* Elapsed clock derives from the start time, so a re-render or a tab that
     was backgrounded cannot drift away from the real duration. */
  React.useEffect(() => {
    if (!liveId) return;
    const session = sessions.find((s) => s.id === liveId);
    if (!session) return;
    const startedAt = +new Date(session.startedAt);
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [liveId, sessions]);

  const nowMs = () => elapsed * 1000;

  const value: Store = {
    teacher: seedTeacher,
    students,
    sessions,
    snapshots,
    goals,
    goalsByStudent,
    viewer,
    viewerStudentId,
    setViewer,
    setViewerStudent,
    liveId,
    elapsed,

    addStudent(input) {
      const palette = [
        "226 52% 44%",
        "268 38% 46%",
        "166 44% 32%",
        "28 74% 40%",
        "196 52% 36%",
        "4 68% 47%",
      ];
      const student: Student = {
        id: uid("s"),
        name: input.name,
        username: input.username,
        yearGroup: input.yearGroup,
        usualSlot: input.usualSlot,
        timezone: input.timezone,
        joinedAt: new Date().toISOString(),
        color: palette[students.length % palette.length],
      };
      setStudents((prev) => [student, ...prev]);
      setSnapshots((prev) => ({
        ...prev,
        [student.id]: {
          workingOn: "No sessions yet.",
          origin: "ai",
          editedByTeacher: false,
          updatedAt: student.joinedAt,
        },
      }));
      setGoalsByStudent((prev) => ({ ...prev, [student.id]: [] }));
      return student;
    },

    updateStudent(id, p) {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
    },

    deleteStudent(id) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setSessions((prev) => prev.filter((s) => !s.participants.includes(id)));
      setSnapshots((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setGoalsByStudent((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },

    startSession(studentId) {
      const session = makeLiveSession(studentId);
      setSessions((prev) => [session, ...prev]);
      setLiveId(session.id);
      setElapsed(0);
      return session.id;
    },

    endSession() {
      const id = liveId;
      if (!id) return;
      const seconds = elapsed;
      setLiveId(null);
      patch(id, (s) => ({
        ...s,
        status: "processing",
        endedAt: new Date().toISOString(),
        durationSeconds: seconds,
        capture: { mic: "idle", shared: "idle", transcription: "idle" },
      }));
    },

    setSnapshot(studentId, workingOn) {
      setSnapshots((prev) => ({
        ...prev,
        [studentId]: {
          workingOn,
          origin: "teacher",
          editedByTeacher: true,
          updatedAt: new Date().toISOString(),
        },
      }));
    },

    addGoal(studentId, text) {
      const goal: Goal = {
        id: uid("g"),
        text,
        status: "active",
        origin: "teacher",
        editedByTeacher: true,
        createdAt: new Date().toISOString(),
      };
      setGoals((prev) => [...prev, goal]);
      setGoalsByStudent((prev) => ({
        ...prev,
        [studentId]: [...(prev[studentId] ?? []), goal.id],
      }));
    },

    updateGoal(goalId, text) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, text, origin: "teacher", editedByTeacher: true } : g
        )
      );
    },

    removeGoal(studentId, goalId) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      setGoalsByStudent((prev) => ({
        ...prev,
        [studentId]: (prev[studentId] ?? []).filter((id) => id !== goalId),
      }));
    },

    addTopic(sessionId, label) {
      patch(sessionId, (s) => {
        const topic: Topic = {
          id: uid("t"),
          label,
          firstAtMs: s.status === "recording" ? nowMs() : (s.topics.at(-1)?.firstAtMs ?? 0) + 60_000,
          confidence: 1,
          origin: "teacher",
          editedByTeacher: true,
        };
        return { ...s, topics: [...s.topics, topic] };
      });
    },

    updateTopic(sessionId, topicId, label) {
      patch(sessionId, (s) => ({
        ...s,
        topics: s.topics.map((t) =>
          t.id === topicId ? { ...t, label, origin: "teacher", editedByTeacher: true } : t
        ),
      }));
    },

    removeTopic(sessionId, topicId) {
      patch(sessionId, (s) => ({ ...s, topics: s.topics.filter((t) => t.id !== topicId) }));
    },

    addQuestion(sessionId, text) {
      patch(sessionId, (s) => {
        const q: Question = {
          id: uid("q"),
          askedAtMs:
            s.status === "recording" ? nowMs() : (s.questions.at(-1)?.askedAtMs ?? 0) + 60_000,
          text,
          answer: null,
          evidenceSegmentIds: [],
          withheld: false,
          origin: "teacher",
          editedByTeacher: true,
        };
        return { ...s, questions: [...s.questions, q] };
      });
    },

    updateQuestion(sessionId, id, p) {
      patch(sessionId, (s) => ({
        ...s,
        questions: s.questions.map((q) =>
          q.id === id ? { ...q, ...p, origin: "teacher", editedByTeacher: true } : q
        ),
      }));
    },

    removeQuestion(sessionId, id) {
      patch(sessionId, (s) => ({ ...s, questions: s.questions.filter((q) => q.id !== id) }));
    },

    addResource(sessionId, r) {
      patch(sessionId, (s) => {
        const resource: Resource = {
          id: uid("r"),
          kind: "link",
          title: r.title,
          url: r.url,
          atMs: s.status === "recording" ? nowMs() : undefined,
          createdAt: new Date().toISOString(),
        };
        return { ...s, resources: [...s.resources, resource] };
      });
    },

    removeResource(sessionId, id) {
      patch(sessionId, (s) => ({ ...s, resources: s.resources.filter((r) => r.id !== id) }));
    },

    setSummary(sessionId, text) {
      patch(sessionId, (s) => ({
        ...s,
        summary: text,
        summaryOrigin: "teacher",
        summaryEditedByTeacher: true,
      }));
    },

    addNote(sessionId, kind, text) {
      patch(sessionId, (s) => ({
        ...s,
        notes: [
          ...s.notes,
          { id: uid("n"), kind, text, origin: "teacher", editedByTeacher: true },
        ],
      }));
    },

    updateNote(sessionId, id, text) {
      patch(sessionId, (s) => ({
        ...s,
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, text, origin: "teacher", editedByTeacher: true } : n
        ),
      }));
    },

    removeNote(sessionId, id) {
      patch(sessionId, (s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
    },

    resolveAttention(sessionId, itemId) {
      patch(sessionId, (s) => {
        const attention = s.attention.map((a) =>
          a.id === itemId ? { ...a, resolvedAt: new Date().toISOString() } : a
        );
        const allResolved = attention.every((a) => a.resolvedAt);
        return {
          ...s,
          attention,
          status: allResolved && s.status === "needs_attention" ? "ready" : s.status,
          publishedAt:
            allResolved && s.status === "needs_attention"
              ? new Date().toISOString()
              : s.publishedAt,
        };
      });
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

/** The one student in a session. V1 sessions are always one-to-one. */
export function useSessionStudent(session: Session | undefined) {
  const { students } = useStore();
  return students.find((s) => s.id === session?.participants[0]);
}

export function useStudentSessions(studentId: string | undefined) {
  const { sessions } = useStore();
  return React.useMemo(
    () =>
      sessions
        .filter((s) => studentId !== undefined && s.participants.includes(studentId))
        .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)),
    [sessions, studentId]
  );
}

export function useStudentGoals(studentId: string | undefined) {
  const { goals, goalsByStudent } = useStore();
  return React.useMemo(() => {
    const ids = studentId ? (goalsByStudent[studentId] ?? []) : [];
    return ids
      .map((id) => goals.find((g) => g.id === id))
      .filter((g): g is Goal => Boolean(g) && g!.status === "active");
  }, [goals, goalsByStudent, studentId]);
}

/** Sessions a student is allowed to see: published and finished processing. */
export function useVisibleStudentSessions(studentId: string | undefined) {
  const all = useStudentSessions(studentId);
  return React.useMemo(
    () => all.filter((s) => s.publishedAt !== null && s.status === "ready"),
    [all]
  );
}

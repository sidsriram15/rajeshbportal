export type ID = string;

export type Subject =
  | "Mathematics"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "Computer Science"
  | "English";

export interface Student {
  id: ID;
  name: string;
  email: string;
  grade: string;
  subjects: Subject[];
  /** Short teacher-authored context shown on the live session rail. */
  focus: string;
  goals: string[];
  joinedAt: string;
  timezone: string;
  cadence: string;
  color: string;
  archived?: boolean;
}

export type SessionStatus = "live" | "draft" | "published";

export interface Topic {
  id: ID;
  label: string;
  /** Seconds from session start when it first appeared. */
  at: number;
  /** Seconds of lesson time spent on it. */
  minutes: number;
  /** 0–1 model confidence; manual entries are 1. */
  confidence: number;
  source: "detected" | "manual";
}

export interface QA {
  id: ID;
  at: number;
  question: string;
  answer: string | null;
  topicId: ID | null;
  source: "detected" | "manual";
  starred?: boolean;
}

export interface Resource {
  id: ID;
  at: number;
  title: string;
  url: string;
  note?: string;
  kind: "link" | "video" | "doc" | "practice";
}

export interface TranscriptLine {
  at: number;
  speaker: "teacher" | "student";
  text: string;
}

export type EventKind = "topic" | "question" | "answer" | "resource" | "system";

export interface TimelineEvent {
  id: ID;
  kind: EventKind;
  at: number;
  refId?: ID;
  title: string;
  detail?: string;
}

export interface Session {
  id: ID;
  studentId: ID;
  subject: Subject;
  title: string;
  status: SessionStatus;
  /** ISO start time. */
  startedAt: string;
  /** Minutes; for live sessions this is the elapsed target. */
  durationMin: number;
  topics: Topic[];
  qa: QA[];
  resources: Resource[];
  transcript: TranscriptLine[];
  events: TimelineEvent[];
  summary: string;
  summaryDraft: string;
  homework: string[];
  zoom: {
    connected: boolean;
    recording: boolean;
    participants: number;
  };
}

export type Portal = "teacher" | "student";

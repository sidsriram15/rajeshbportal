export type ID = string;

/* -------------------------------------------------------------- provenance */

/**
 * Where a piece of content came from. Everything the AI can write carries this
 * plus `editedByTeacher`; once a teacher has deliberately changed something the
 * AI is not allowed to touch it again.
 */
export type ContentOrigin = "ai" | "teacher";

export interface Provenance {
  origin: ContentOrigin;
  editedByTeacher: boolean;
}

/* ------------------------------------------------------------------ people */

export interface Student {
  id: ID;
  name: string;
  /** Login handle. Students never have an email address. */
  username: string;
  yearGroup?: string;
  /** Free text, e.g. "Tue & Thu · 5:00 PM". Never a scheduling system. */
  usualSlot?: string;
  timezone: string;
  joinedAt: string;
  /** Tint for the initials avatar when no photo is set. */
  color: string;
  avatarUrl?: string;
  archivedAt?: string;
}

export interface Teacher {
  id: ID;
  name: string;
  avatarUrl?: string;
}

/** The AI-maintained "what this student is working on right now" line. */
export interface Snapshot extends Provenance {
  workingOn: string;
  updatedAt: string;
}

export interface Goal extends Provenance {
  id: ID;
  text: string;
  status: "active" | "achieved" | "dismissed";
  createdAt: string;
}

/* ---------------------------------------------------------------- sessions */

export type SessionStatus =
  | "recording"
  | "processing"
  | "ready"
  | "needs_attention"
  | "failed";

/** Which physical audio source a segment came from. */
export type AudioChannel = "mic" | "shared";

/**
 * V1 is strictly one-to-one, so the channel *is* the speaker: the microphone is
 * the teacher and the shared system audio is the student. No inference.
 */
export type SpeakerKind = "teacher" | "student";

export interface Topic extends Provenance {
  id: ID;
  label: string;
  /** Milliseconds from session start. */
  firstAtMs: number;
  confidence: number;
}

export interface Question extends Provenance {
  id: ID;
  askedAtMs: number;
  text: string;
  answer: string | null;
  /** Transcript segments the answer was drawn from. Empty = ungrounded. */
  evidenceSegmentIds: ID[];
  /** Held back from the student until a teacher resolves it. */
  withheld: boolean;
}

export type NoteKind = "key_point" | "practice";

export interface SessionNote extends Provenance {
  id: ID;
  kind: NoteKind;
  text: string;
}

export type ResourceKind = "link" | "pdf";

export interface Resource {
  id: ID;
  kind: ResourceKind;
  title: string;
  /** Links only. */
  url?: string;
  /** PDFs only — a key in the private storage bucket, never a public URL. */
  storagePath?: string;
  byteSize?: number;
  /** Milliseconds from session start when it was shared, if during the class. */
  atMs?: number;
  createdAt: string;
}

export interface TranscriptSegment {
  id: ID;
  channel: AudioChannel;
  speaker: SpeakerKind;
  startMs: number;
  endMs: number;
  text: string;
}

export type AttentionKind =
  | "shared_audio_lost"
  | "thin_transcript"
  | "transcription_failed"
  | "ai_failed"
  | "empty_session";

export interface AttentionItem {
  id: ID;
  kind: AttentionKind;
  message: string;
  resolvedAt: string | null;
}

/* ------------------------------------------------------------------ capture */

export type MicState = "idle" | "connected" | "denied" | "unavailable" | "lost";
export type SharedAudioState =
  | "idle"
  | "connected"
  | "no_audio_track"
  | "cancelled"
  | "unavailable"
  | "lost";
export type TranscriptionState = "idle" | "ready" | "active" | "reconnecting" | "error";

export interface CaptureState {
  mic: MicState;
  shared: SharedAudioState;
  transcription: TranscriptionState;
}

export interface Session {
  id: ID;
  /**
   * Student ids. V1 always holds exactly one; it is a list so group sessions
   * can be added later without reshaping every consumer.
   */
  participants: ID[];
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;

  topics: Topic[];
  questions: Question[];
  notes: SessionNote[];
  resources: Resource[];
  transcript: TranscriptSegment[];

  summary: string | null;
  summaryOrigin: ContentOrigin;
  summaryEditedByTeacher: boolean;

  publishedAt: string | null;
  attention: AttentionItem[];
  capture: CaptureState;
}

/* ------------------------------------------------------------------ derived */

export type TimelineKind = "topic" | "question" | "answer" | "resource";

/** The merged chronological feed. Derived from the session, never stored. */
export interface TimelineEntry {
  id: ID;
  kind: TimelineKind;
  atMs: number;
  refId: ID;
  title: string;
  detail?: string;
  origin: ContentOrigin;
  editedByTeacher: boolean;
}

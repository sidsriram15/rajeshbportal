-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE content_origin   AS ENUM ('ai', 'teacher');
CREATE TYPE session_status   AS ENUM ('recording', 'processing', 'ready', 'needs_attention', 'failed');
CREATE TYPE audio_channel    AS ENUM ('mic', 'shared');
CREATE TYPE speaker_kind     AS ENUM ('teacher', 'student');
CREATE TYPE note_kind        AS ENUM ('key_point', 'practice');
CREATE TYPE resource_kind    AS ENUM ('link', 'pdf', 'video', 'image');
CREATE TYPE attention_kind   AS ENUM ('shared_audio_lost', 'thin_transcript', 'transcription_failed', 'ai_failed', 'empty_session');

-- ============================================================
-- Tables
-- ============================================================

-- Teachers: one row per teacher, id = auth.users id
CREATE TABLE teachers (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  avatar_url  text,
  timezone    text NOT NULL DEFAULT 'UTC',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Students: id = their auth.users id so RLS can use auth.uid() directly
CREATE TABLE students (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name        text NOT NULL,
  username    text NOT NULL,
  color       text NOT NULL DEFAULT 'gray',
  avatar_url  text,
  year_group  text,
  usual_slot  text,
  timezone    text NOT NULL DEFAULT 'UTC',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, username)
);

-- Snapshots: one per student, AI-writable with provenance
CREATE TABLE snapshots (
  student_id        uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  working_on        text NOT NULL DEFAULT '',
  origin            content_origin NOT NULL DEFAULT 'ai',
  edited_by_teacher boolean NOT NULL DEFAULT false,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Goals
CREATE TABLE goals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  text              text NOT NULL,
  origin            content_origin NOT NULL DEFAULT 'teacher',
  edited_by_teacher boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id                  uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  participants                uuid[] NOT NULL DEFAULT '{}',
  status                      session_status NOT NULL DEFAULT 'recording',
  started_at                  timestamptz NOT NULL DEFAULT now(),
  ended_at                    timestamptz,
  duration_seconds            integer NOT NULL DEFAULT 0,
  summary                     text,
  summary_origin              content_origin,
  summary_edited_by_teacher   boolean NOT NULL DEFAULT false,
  published_at                timestamptz,
  capture                     jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

-- Topics
CREATE TABLE topics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label             text NOT NULL,
  first_at_ms       integer NOT NULL DEFAULT 0,
  origin            content_origin NOT NULL DEFAULT 'ai',
  edited_by_teacher boolean NOT NULL DEFAULT false
);

-- Questions
CREATE TABLE questions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text                  text NOT NULL,
  answer                text,
  asked_at_ms           integer NOT NULL DEFAULT 0,
  answered_at_ms        integer,
  origin                content_origin NOT NULL DEFAULT 'ai',
  edited_by_teacher     boolean NOT NULL DEFAULT false,
  withheld              boolean NOT NULL DEFAULT false,
  evidence_segment_ids  uuid[] NOT NULL DEFAULT '{}'
);

-- Session notes (key points + practice items)
CREATE TABLE session_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind              note_kind NOT NULL,
  text              text NOT NULL,
  origin            content_origin NOT NULL DEFAULT 'ai',
  edited_by_teacher boolean NOT NULL DEFAULT false
);

-- Resources (links, PDFs, etc.)
CREATE TABLE resources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title      text NOT NULL,
  url        text,
  kind       resource_kind NOT NULL DEFAULT 'link',
  at_ms      integer
);

-- Transcript segments
CREATE TABLE transcript_segments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  start_ms   integer NOT NULL,
  end_ms     integer NOT NULL,
  text       text NOT NULL,
  channel    audio_channel NOT NULL,
  speaker    speaker_kind NOT NULL
);

-- Attention items
CREATE TABLE attention_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind        attention_kind NOT NULL,
  message     text NOT NULL,
  resolved_at timestamptz
);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE teachers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attention_items    ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller a teacher?
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())
$$;

-- Helper: which teacher owns a given student?
CREATE OR REPLACE FUNCTION student_teacher_id(sid uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT teacher_id FROM students WHERE id = sid
$$;

-- Helper: which teacher owns a given session?
CREATE OR REPLACE FUNCTION session_teacher_id(sid uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT teacher_id FROM sessions WHERE id = sid
$$;

-- ---- teachers ----
CREATE POLICY "teacher: own row"
  ON teachers FOR ALL
  USING (id = auth.uid());

-- ---- students ----
-- Teacher sees their own students
CREATE POLICY "teacher: own students"
  ON students FOR ALL
  USING (teacher_id = auth.uid());

-- Student sees their own row
CREATE POLICY "student: own row"
  ON students FOR SELECT
  USING (id = auth.uid());

-- ---- snapshots ----
CREATE POLICY "teacher: own student snapshots"
  ON snapshots FOR ALL
  USING (student_teacher_id(student_id) = auth.uid());

CREATE POLICY "student: own snapshot"
  ON snapshots FOR SELECT
  USING (student_id = auth.uid());

-- ---- goals ----
CREATE POLICY "teacher: own student goals"
  ON goals FOR ALL
  USING (student_teacher_id(student_id) = auth.uid());

CREATE POLICY "student: own goals"
  ON goals FOR SELECT
  USING (student_id = auth.uid());

-- ---- sessions ----
CREATE POLICY "teacher: own sessions"
  ON sessions FOR ALL
  USING (teacher_id = auth.uid());

-- Student sees sessions they're in, only when published
CREATE POLICY "student: sessions they participate in"
  ON sessions FOR SELECT
  USING (
    auth.uid() = ANY(participants)
    AND published_at IS NOT NULL
    AND status = 'ready'
  );

-- ---- topics, questions, session_notes, resources ----
-- Teacher: full access to their sessions' data
CREATE POLICY "teacher: topics"
  ON topics FOR ALL
  USING (session_teacher_id(session_id) = auth.uid());

CREATE POLICY "teacher: questions"
  ON questions FOR ALL
  USING (session_teacher_id(session_id) = auth.uid());

CREATE POLICY "teacher: session_notes"
  ON session_notes FOR ALL
  USING (session_teacher_id(session_id) = auth.uid());

CREATE POLICY "teacher: resources"
  ON resources FOR ALL
  USING (session_teacher_id(session_id) = auth.uid());

-- Student: read from published sessions they're in (no withheld questions)
CREATE POLICY "student: topics"
  ON topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND auth.uid() = ANY(s.participants)
        AND s.published_at IS NOT NULL
        AND s.status = 'ready'
    )
  );

CREATE POLICY "student: questions (not withheld)"
  ON questions FOR SELECT
  USING (
    withheld = false
    AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND auth.uid() = ANY(s.participants)
        AND s.published_at IS NOT NULL
        AND s.status = 'ready'
    )
  );

CREATE POLICY "student: session_notes"
  ON session_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND auth.uid() = ANY(s.participants)
        AND s.published_at IS NOT NULL
        AND s.status = 'ready'
    )
  );

CREATE POLICY "student: resources"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND auth.uid() = ANY(s.participants)
        AND s.published_at IS NOT NULL
        AND s.status = 'ready'
    )
  );

-- ---- transcript_segments: teacher only, never students ----
CREATE POLICY "teacher: transcript_segments"
  ON transcript_segments FOR ALL
  USING (session_teacher_id(session_id) = auth.uid());

-- ---- attention_items: teacher only ----
CREATE POLICY "teacher: attention_items"
  ON attention_items FOR ALL
  USING (session_teacher_id(session_id) = auth.uid());

# V1 Implementation Plan

Status: **approved 2026-08-09**, with the amendments in §0. Phase 1 in progress.

---

## 0. Approved amendments

**A. V1 is strictly 1-on-1.** One teacher, one student, per session. No multi-select, no group participants, no group visibility rules, no multi-speaker attribution. Attribution is therefore purely structural: **microphone = teacher, shared/system audio = student**, with zero inference and zero uncertainty. The schema keeps `session_participants` as a table and the types keep a participant *list*, so group sessions remain addable later — but no group code paths, UI, or policies are built now. Section 6's speaker-mapping chips and the `uncertain_attribution` attention kind are dropped from V1.

**B. Windows + Chrome is the primary target.** The production workflow to make excellent: Zoom desktop on Windows → Chrome → Start Session → mic + system audio → transcription. On Windows, "Entire screen" share with system audio works natively — no virtual device, no browser Zoom, no compromise. macOS is supported as a secondary path via Zoom in a Chrome tab with tab audio, and is never allowed to complicate or delay the Windows path. **No virtual audio device is required for normal V1 use** on any platform. Capability detection tells each platform the truth about what it can do.

**C. Supabase `pg_cron` + `pg_net`** for job dispatch and retry. No Vercel Pro, no paid queue. V1 infrastructure stays as close to free as practical.

**D. Mock data is deleted** once real equivalents work. No mock-data architecture survives into production.

**E. `git init`, one reviewable commit per phase.**

**Transcription streams — provider's choice, not a hard-coded pair.** Mic and shared audio stay separate *sources* with their `channel` metadata preserved end to end through segments, extraction and storage. Whether that becomes one transcription connection or two is a provider-level decision made on capability, accuracy, latency and cost — the `TranscriptionProvider` interface supports both, and a single-connection multichannel implementation must be possible without touching callers. Deepgram accepts interleaved multichannel audio with per-channel results on one socket, which is the cheaper default; the two-socket path stays available for providers that lack it.

**Priority above all else: zero admin work between lessons.** Select student → Start → Teach → End → move on. Everything downstream is automatic. Needs Attention is reserved for sessions that are genuinely broken.

---

## 1. What exists today

6,636 lines. Next.js 14.2 App Router, React 18, TS strict, Tailwind, Radix primitives styled in-repo, Lucide. No backend, no auth, no tests, no `.env`. Not a git repository.

### Routes

| Route | What it does today |
| --- | --- |
| `/` | Client redirect to `/teacher` or `/student` based on a localStorage flag |
| `/teacher` | Overview: live banner, 4 stat tiles, "needs your attention", recent sessions, regular schedule, "coverage" meters |
| `/teacher/students` | Search + subject filter + sort, table of students |
| `/teacher/students/[id]` | 4 tabs (Sessions / Topics / Questions / Resources) + rail (Working on, Goals, Details) |
| `/teacher/sessions` | All sessions grouped by day, filter all/draft/published |
| `/teacher/sessions/[id]` | Review-before-publish: Summary / Timeline / Transcript tabs + rail panels |
| `/session/[id]` | Active session, full-screen, 3 columns + capture bar |
| `/student` | Greeting, 3 vanity stats, lesson cards |
| `/student/sessions/[id]` | Summary, topics, Q&A, links, practice checklist, prev/next |
| `/not-found` | Branded 404 |

### State

Single React context in `lib/store.tsx` (461 lines) holding `students[]`, `sessions[]`, `portal`, `viewerId`, `liveId`, `elapsed`, `summaryPhase`. All mutations in-memory. A `setInterval` drives `elapsed`; a second effect replays `liveScript` from `lib/mock-data.ts` against `elapsed` to fake a live session. `endSession()` fakes AI with a 2.6s `setTimeout` and a string template.

### Data model (`lib/types.ts`)

`Student` (email, grade, `subjects: Subject[]`, focus, goals, cadence, color) · `Session` (**`studentId` singular**, `subject`, `title`, `status: live|draft|published`, topics, qa, resources, transcript, events, summary, summaryDraft, homework, **`zoom: {connected, recording, participants}`**) · `Topic` · `QA` · `Resource` · `TranscriptLine` · `TimelineEvent`.

Three things here are load-bearing and wrong for V1: singular `studentId`, the `Subject` union, and `zoom`.

### Verdict on each surface

**Keep the visual system as-is.** `globals.css` tokens, `tailwind.config.ts`, `components/ui/*`, `panel`/`eyebrow`/`num`/`row-hover`/`kbd` classes, `Avatar`, `Badge`, `Meter`, `EmptyState`, `Waveform`, `PageHeader`, `Section`, the timeline, the active-session three-column layout, the sidebar. None of this changes.

**Keep, rewire to real data:** active session screen, timeline, session panels, session row, students list, session list, student session view.

**Keep, repurpose:** `/teacher/sessions/[id]` stops being "review before publish" and becomes "view / edit". `SummaryEditor` loses the publish gate. `EndSessionDialog` loses the "student won't see it until you publish" copy.

**Remove:**

- `components/brand.tsx` (Mark + Wordmark), the `Cadence` metadata title, `cadence.*` localStorage keys, all product-name copy
- `components/portal-switcher.tsx` — replaced by real auth
- `lib/mock-data.ts` (729 lines) entirely
- `Subject` type, subject filter chips on `/teacher/students`, subject picker in add-student and start-session, subject badges in `SessionRow` / student cards
- `zoom` field, the Zoom status pill in the session header, "Cadence joins the Zoom call" copy, the fake meeting ID
- `session.title` as a required user input (AI-detected topics replace it; a title can be derived but is never asked for)
- Teacher-overview stat tiles ("Sessions this week", "Teaching time", "Questions captured") and the "Coverage" meter block — vanity
- Student-home stat bar (lessons / hours / questions) and the "Everything from your lessons…" line
- Student profile Topics tab, Resources tab, Questions tab → collapse to one page
- `mailto:` action and `email` field on students
- Publish / Unpublish / Re-publish buttons as a required step
- Manual capture bar's *necessity* — the composer stays as an optional tool, `homework` renames to practice

---

## 2. Product decisions this implies

1. **Sessions are participant-based.** `sessions` + `session_participants`. Nothing keys off a single student.
2. **No titles, no subjects, no forms.** Start Session = pick students, press start. A session displays as `Aug 9 · 52 min` + detected topics.
3. **Publishing is automatic** on `status = ready`. `needs_attention` and `failed` never auto-publish.
4. **Provenance is a first-class column.** Every AI-writable row carries `origin` (`ai` | `teacher`) and `edited_by_teacher`. The AI writer skips any row with `edited_by_teacher = true`. This is enforced in SQL (partial `WHERE` clauses), not in prompt text.
5. **Dark becomes the default theme** (you said you like the dark interface; today it defaults to light). The toggle moves into the account menu.
6. **Branding slot becomes the account menu.** Sidebar top and student header top become avatar + name + menu — which is also where profile picture, theme, and sign out live, satisfying "clicking the avatar should be enough".

---

## 3. Database schema

Postgres / Supabase. `citext` and `pgcrypto` extensions. All tables `public`, all RLS-enabled, no table readable without a policy.

```
profiles              id uuid pk → auth.users.id
                      role            profile_role not null        -- 'teacher' | 'student'
                      display_name    text not null
                      avatar_path     text                          -- storage key in `avatars`
                      timezone        text
                      accent_color    text                          -- keeps the existing initials-avatar tinting
                      created_at, updated_at

students              id uuid pk → profiles.id on delete cascade
                      teacher_id      uuid not null → profiles.id
                      username        citext not null unique
                      year_group      text
                      usual_slot      text                          -- free text, e.g. "Tue & Thu · 5:00 PM"
                      joined_at       timestamptz not null default now()
                      archived_at     timestamptz

sessions              id uuid pk
                      teacher_id      uuid not null → profiles.id
                      status          session_status not null       -- recording|processing|ready|needs_attention|failed
                      started_at      timestamptz not null
                      ended_at        timestamptz
                      duration_seconds int
                      summary         text
                      summary_origin  content_origin
                      summary_edited_by_teacher boolean not null default false
                      published_at    timestamptz
                      capture_notes   jsonb                         -- mic/shared-audio health events during capture
                      created_at, updated_at

session_participants  session_id uuid → sessions.id on delete cascade
                      student_id uuid → students.id on delete cascade
                      speaker_label text                            -- diarization label mapped to this student, nullable
                      primary key (session_id, student_id)

transcript_segments   id uuid pk
                      session_id      uuid not null → sessions.id on delete cascade
                      channel         audio_channel not null        -- 'mic' | 'shared'
                      speaker_kind    speaker_kind not null         -- 'teacher' | 'student' | 'unknown'
                      speaker_label   text                          -- diarization label within the shared channel
                      student_id      uuid → students.id            -- resolved attribution, nullable
                      start_ms        int not null
                      end_ms          int not null
                      text            text not null
                      created_at
                      index (session_id, start_ms)

session_topics        id, session_id, label, first_at_ms, confidence numeric(3,2),
                      origin content_origin, edited_by_teacher bool, position int

session_questions     id, session_id, asked_at_ms,
                      text, answer_text,
                      asked_by_student_id uuid → students.id,
                      attribution attribution_state not null        -- 'certain' | 'uncertain' | 'teacher_set'
                      evidence_segment_ids uuid[] not null          -- grounding: which transcript rows support this
                      origin, edited_by_teacher,
                      withheld boolean not null default false       -- true ⇒ not shown to students

session_notes         id, session_id, kind note_kind not null,      -- 'key_point' | 'practice'
                      text, position, origin, edited_by_teacher

resources             id, session_id, kind resource_kind,           -- 'link' | 'pdf'
                      title, url, storage_path, byte_size, mime_type,
                      created_by uuid, created_at

student_snapshots     student_id uuid pk → students.id
                      working_on text, origin, edited_by_teacher,
                      source_session_id uuid, updated_at

student_goals         id, student_id, text,
                      origin, edited_by_teacher,
                      status goal_status not null default 'active', -- 'active' | 'achieved' | 'dismissed'
                      source_session_id, created_at, updated_at

processing_jobs       id, session_id, kind job_kind,                -- 'extract_chunk' | 'finalize' | 'update_student'
                      status job_status, attempts int, max_attempts int,
                      run_after timestamptz, payload jsonb,
                      last_error text, created_at, updated_at
                      index (status, run_after)

attention_items       id, session_id,
                      kind attention_kind,                          -- 'uncertain_attribution' | 'shared_audio_lost'
                                                                    -- | 'thin_transcript' | 'transcription_failed'
                                                                    -- | 'ai_failed' | 'empty_session'
                      message text, related_question_id uuid,
                      resolved_at timestamptz, created_at
```

No `subjects` table. No `events` table — the timeline is derived by merging topics + questions + resources ordered by `*_ms`, exactly as `buildEvents()` does today, so the existing `Timeline` component keeps working.

### Row Level Security

A `SECURITY DEFINER STABLE` helper avoids policy recursion:

```sql
create function public.viewer_role() returns profile_role
  language sql security definer stable set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create function public.owns_student(sid uuid) returns boolean ...
create function public.attends_session(sid uuid) returns boolean ...   -- student is a participant
```

| Table | Teacher | Student |
| --- | --- | --- |
| `profiles` | self + own students | self only |
| `students` | full, `teacher_id = auth.uid()` | select self |
| `sessions` | full, own | select where participant **and** `published_at is not null` **and** `status = 'ready'` |
| `session_participants` | full, own sessions | select own row only — a student cannot enumerate classmates |
| `transcript_segments` | full, own | **no policy at all** |
| `session_topics`, `session_notes`, `resources` | full, own | select where session visible |
| `session_questions` | full, own | select where session visible **and** `withheld = false` (+ ownership rule, see decision A) |
| `student_snapshots`, `student_goals` | full, own students | select own |
| `processing_jobs`, `attention_items` | select own | none |

Storage: two **private** buckets, `avatars` and `resources`. Object-level policies keyed on path prefix (`avatars/{profile_id}/…`, `resources/{session_id}/…`). Reads always go through a server route that re-checks authorization and returns a short-TTL signed URL — never a public URL.

Verification: a `scripts/rls-check.ts` that signs in as student A and asserts 401/empty on every one of student B's rows and on transcript segments. Run in CI-style as an npm script.

---

## 4. Authentication

Supabase Auth, cookie sessions via `@supabase/ssr`, enforced in `middleware.ts` plus a per-request server check (middleware alone is not authorization).

**Teacher** — real email + password. V1 signup is gated by `TEACHER_SIGNUP_CODE`; after the first teacher exists, `/signup` closes.

**Student** — username + password, no email anywhere in the UI.

- Teacher creates the student. Server action (service-role, server-only) calls `auth.admin.createUser({ email: \`${username}@${STUDENT_EMAIL_DOMAIN}\`, password, email_confirm: true })` with `STUDENT_EMAIL_DOMAIN` a non-routable internal domain. Inserts `profiles` + `students` in one transaction (RPC) so a half-created student is impossible.
- Login: one field labelled "Username or email". Contains `@` → teacher path. Otherwise → `POST /api/auth/student-login` resolves username → internal email server-side, calls `signInWithPassword`, sets cookies, returns. The synthetic address never reaches the browser, never appears in any UI.
- Rate limit that endpoint (in-Postgres counter keyed on username + IP, 10/15min) and return one generic error for both "no such user" and "wrong password" — otherwise it is a username oracle.
- Password reset: teacher-only server action → `auth.admin.updateUserById`. Shows the new password **once**, never stores it. Passwords only ever exist as Supabase's bcrypt hashes.
- Delete student: server action → delete `profiles` row (cascades) then `auth.admin.deleteUser` (revokes access). Sessions the student attended are retained but the participant row goes; a session left with zero participants is soft-archived rather than deleted, so the teacher does not silently lose history. Confirmation dialog with the exact copy you specified, placed in the profile `⋯` menu — not next to Start Session.

**Profile pictures** — client-side square crop on a `<canvas>` (drag to reposition, scroll to zoom, ~150 lines, no dependency), re-encode to WebP ≤ 512px ≤ 200 KB, upload to `avatars/{profile_id}/{uuid}.webp`, write `avatar_path`. Accepts JPG/PNG/WebP, validated by magic bytes server-side, not just MIME. Upload / Replace / Remove live in the avatar menu. Falls back to the existing initials `Avatar`.

---

## 5. Audio capture

On **Start Session**:

1. `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })` → teacher microphone.
2. `getDisplayMedia({ video: true, audio: true })` → remote audio. `video: true` is mandatory in Chrome to even offer the audio checkbox; the video track is stopped immediately and never read.
3. Inspect `displayStream.getAudioTracks()`. **If empty, say so plainly** — "You shared a screen but not its audio. Your students won't be transcribed." with a Retry that re-prompts, and a "continue with microphone only" escape.

Both streams stay in memory: `AudioContext` → `AudioWorkletNode` downsampling to 16 kHz mono PCM → WebSocket. Nothing is written to disk, no `MediaRecorder`, no blob, no upload. Raw audio never exists outside the tab's memory.

Keeping the two streams **separate** is the key design choice: the mic channel is definitionally the teacher and the shared channel is definitionally the remote side. Teacher/student separation is therefore structural, not inferred. It costs two concurrent transcription connections instead of one.

### Browser limitations — read this one carefully

This is the biggest real-world risk in the whole project and it is not solvable in code:

| Platform | Entire-screen audio | Window audio | Chrome-tab audio |
| --- | --- | --- | --- |
| **Windows** | ✅ | ❌ | ✅ |
| **ChromeOS** | ✅ | ❌ | ✅ |
| **macOS** | ❌ | ❌ | ✅ only |

So on macOS, **Chrome cannot capture audio from the Zoom desktop app at all.** Three honest paths, and the app should detect the platform and show the right one:

- **A.** Teacher runs Zoom in a Chrome tab (Zoom Web Client) and shares *that tab* with "Share tab audio". No install, works today, some Zoom features are reduced in the web client.
- **B.** Teacher installs a virtual audio device (BlackHole, free) once, routes Zoom's output into it, and our app opens it as a **second `getUserMedia` input device**. We add a "Remote audio source: shared audio ▾ / input device ▾" picker to the setup panel. One-time setup, then invisible.
- **C.** Windows / ChromeOS: share entire screen with system audio. Works out of the box.

Other detections handled up front, each with a specific message rather than a generic failure: no `getDisplayMedia` (non-Chromium, iOS), insecure context (must be HTTPS or localhost), no `AudioWorklet`, mic permission `denied` at the policy level, and a `track.onended` handler for shared audio dying mid-class (→ toast + `attention_items` row + the session continues on mic).

### Setup panel

A compact state between pressing Start and the session going live — three rows, as specified: **Microphone** connected/not · **Shared audio** connected/not available · **Transcription** ready/active/error. Two clicks (mic prompt, screen picker) and it auto-advances the moment both are green. It never advances claiming shared audio works when the track list is empty.

---

## 6. Transcription

```ts
interface TranscriptionProvider {
  start(opts: { channel: 'mic' | 'shared'; diarize: boolean;
                onSegment(s: Segment): void; onError(e: ProviderError): void;
                onStateChange(s: 'connecting'|'active'|'reconnecting'|'closed'): void }): Promise<Handle>;
}
interface Handle { sendAudio(pcm: Int16Array): void; stop(): Promise<void>; }
interface Segment { startMs; endMs; text; isFinal: boolean; speakerLabel?: string; confidence?: number }
```

Two instances per session, one per channel. `lib/transcription/index.ts` picks the implementation from `TRANSCRIPTION_PROVIDER`; `deepgram.ts` is the only one in V1.

**Deepgram nova-3 streaming** is the V1 choice: real-time, native diarization on the shared channel, punctuation, and — decisively — it supports **server-minted short-lived scoped keys**, so the browser can hold a WebSocket without the account key ever leaving the server. `GET /api/transcription/token` checks the caller owns a live session and mints a ~60s-TTL, `usage:write`-scoped key. The long-lived `DEEPGRAM_API_KEY` stays server-side. (AssemblyAI has the same token pattern and would be a drop-in second implementation.)

Persistence: the browser buffers finalized segments and `POST`s them in ~4 s batches to `/api/sessions/{id}/segments`. Worst case a tab crash loses the last few seconds, not the class. Interim (non-final) results render in the live transcript drawer but are never persisted.

**Speaker attribution:**

- **1:1 session** — shared channel = that one student. `attribution = 'certain'`. No diarization ambiguity possible.
- **Group session** — diarization yields `Speaker 0/1/2…` within the shared channel. We *cannot* know which name that is. The active-session UI shows an unobtrusive chip on each speaker's first appearance ("Speaker 1 — who is this? [Dev] [Ana] [skip]"). One optional tap maps it for the whole session, writing `session_participants.speaker_label`. Unmapped at end of session → every question from that speaker gets `attribution = 'uncertain'`, `withheld = true`, and one `attention_items` row. **We never guess a name.**

---

## 7. AI processing

OpenRouter, server-only, one abstraction:

```
lib/ai/provider.ts     complete<T>({ schema: ZodSchema<T>, system, user, model? }): Promise<Result<T>>
lib/ai/schemas.ts      Zod schemas — one per task, mirrored as JSON Schema for response_format
lib/ai/tasks/          extract-chunk.ts · finalize-session.ts · update-student.ts
lib/ai/prompts/        plain .ts string templates
```

`AI_MODEL` from env, referenced in exactly one place. Structured outputs via `response_format: { type: 'json_schema', strict: true }`, then parsed with Zod anyway — a malformed or refused response is a caught error, never a crash, and never a partially-written session.

**Batching.** Transcription streams continuously; the LLM does not. A `extract_chunk` job is enqueued when the unprocessed transcript crosses ~1,500 words or 6 minutes, whichever first. Each chunk sees a short rolling summary of prior chunks plus its own segments — not the whole transcript, so cost stays roughly linear. `finalize` runs once at end: consolidates chunk outputs, dedupes topics, writes summary / key points / practice, then enqueues `update_student` per participant. A 60-minute class is roughly 10 chunk calls + 1 finalize + N student updates.

**Anti-fabrication, enforced mechanically.** Every extracted question and every teacher answer must return the `segment_id`s it came from. Server-side we then: (a) reject any item whose cited IDs don't exist or aren't in the chunk; (b) require the answer's content to overlap the cited segments above a token-overlap floor; (c) drop items that fail, and log them. The model is allowed to tighten grammar, cut filler and compress — it is not allowed to produce an answer with no transcript behind it. Prompts state this too, but the check is what enforces it.

**Provenance on write.** Every AI write is `UPDATE … WHERE edited_by_teacher = false`. A teacher edit sets `origin='teacher', edited_by_teacher=true` and is thereafter untouchable by AI. Goals are additive-only from AI (never deleted or reworded by AI once the teacher has touched them).

**Status transitions.** `recording` → (End) `processing` → `ready` (auto-publish) *or* `needs_attention` *or* `failed`. Escalation to `needs_attention` for: uncertain attribution, transcript under ~200 words for a >5-minute session, shared audio lost mid-session, a transcription connection that never recovered, or `finalize` exhausting retries. Everything that *did* succeed is still saved and still visible to the teacher — one failure never voids the session.

---

## 8. Background processing

End Session must return in well under a second.

```
End Session  →  stop capture, flush final segments, set status='processing',
                enqueue finalize job, redirect away.  Teacher is free.
                     ↓
                fire-and-forget POST /api/jobs/run  (immediate, unawaited)
                     ↓
                worker: claim job with SELECT … FOR UPDATE SKIP LOCKED,
                        run task, write results, update status
                     ↓
                Supabase Realtime pushes the status change → dashboard updates live
```

The immediate kick makes the common case instant. A **cron every minute** hitting the same endpoint is the safety net: it picks up anything the kick missed (cold start, crash, network) and retries failures with exponential backoff via `run_after`. Two hosting options for the cron, both real:

- **Vercel Cron** — zero extra vendor, but per-minute schedules need a Pro plan (Hobby is daily only).
- **Supabase `pg_cron` + `pg_net`** — free, in-database, calls the same endpoint. Works on any host.

The endpoint is protected by a `JOB_RUNNER_SECRET` bearer token and is idempotent. Jobs have `max_attempts`; exhausting them sets the session to `failed` + an attention item, never an infinite loop.

Nothing here is simulated — no `setTimeout`, no fake progress. The processing UI reflects actual job rows.

---

## 9. External services and environment

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only, never imported into a client component

# Transcription
TRANSCRIPTION_PROVIDER=deepgram
DEEPGRAM_API_KEY=                   # server only; browser gets 60s scoped keys
DEEPGRAM_MODEL=nova-3

# AI
OPENROUTER_API_KEY=                 # server only
AI_MODEL=                           # e.g. anthropic/claude-sonnet-4.5
OPENROUTER_SITE_URL=                # OpenRouter attribution headers
OPENROUTER_APP_NAME=

# App
NEXT_PUBLIC_APP_URL=
STUDENT_EMAIL_DOMAIN=students.internal    # never displayed anywhere
TEACHER_SIGNUP_CODE=
JOB_RUNNER_SECRET=
MAX_PDF_BYTES=20971520
```

`.env.example` documents each one. `.gitignore` already covers `.env*.local`; I'll widen it to `.env`.

**New dependencies — three, all load-bearing:** `@supabase/supabase-js`, `@supabase/ssr`, `zod`. Deepgram and OpenRouter are plain `fetch`/`WebSocket`, no SDKs. Image cropping and PDF validation are hand-rolled rather than pulling in libraries.

Running cost is dominated by transcription (two concurrent streams per class) and is on the order of cents per teaching hour; LLM cost depends on `AI_MODEL`. I'd rather you verify current published rates than quote numbers from memory.

---

## 10. Phased implementation

Each phase leaves the app running and typechecking.

**Phase 1 — Strip and simplify (UI only, still on mock data).**
Remove branding, `Subject`, Zoom, portal switcher, vanity stats. Collapse the student profile to one page. Rewrite `types.ts` around participants. Simplify student home. Rename homework → practice. Dark by default. *You can look at the result and correct the visual direction before any backend exists.*

**Phase 2 — Supabase foundation.**
Migrations (schema, enums, RLS, helpers, RPCs), storage buckets + policies, generated types, server/browser/admin clients, `middleware.ts`, login page, teacher signup, student create/reset/delete, avatar upload + crop, account menu. `scripts/rls-check.ts` green.

**Phase 3 — Real data.**
Delete `lib/mock-data.ts` and the store. Pages become server components; mutations become server actions. Students list/profile, sessions list, session view/edit, student home and student session view all read from Postgres through RLS.

**Phase 4 — Capture and transcription.**
Capability detection, setup panel, dual `AudioWorklet` pipelines, `TranscriptionProvider` + Deepgram, ephemeral key route, batched segment persistence, live transcript, elapsed clock from `started_at`, speaker mapping chips, End Session. Full error matrix wired: denied, cancelled, no audio track, track ended, socket drop with reconnect, offline queueing.

**Phase 5 — AI pipeline.**
`processing_jobs` + worker + cron, OpenRouter provider, Zod schemas, chunk extraction, finalize, grounding validation, statuses, auto-publish, `attention_items`, Realtime status updates on the dashboard, per-item retry from Needs Attention.

**Phase 6 — Snapshot, goals, resources.**
`update_student` job with provenance rules, Working On + Goals with the subtle AI marker and teacher override, link resources, PDF upload with magic-byte validation + size cap + signed-URL delivery, student session view finalized.

**Phase 7 — Hardening and docs.**
Expired-session handling, empty-transcript path, malformed-AI path, retry surfaces, a `<AppError>` boundary per route group, README (install → Supabase project → migrations → buckets → auth config → env → run → deploy), `.env.example`, seed script for a demo teacher.

---

## 11. Decisions I need from you

**A. Group-session question visibility.** In a group class every student heard every question. Two readings of your spec:
- **A1 (recommended):** questions asked aloud in a group class are visible to all participants of *that* class, tagged "your question" for the asker. Everything else — profiles, snapshots, goals, other classes — stays private.
- **A2 (stricter):** a student sees only questions attributed to them; others' questions are hidden entirely.

**B. macOS remote audio.** Section 5. Which do we build for first — Zoom-in-a-tab (A), virtual audio device (B), or both with a source picker? This changes the setup panel.

**C. Cron host.** Vercel Cron (needs Pro for per-minute) or Supabase `pg_cron` (free, host-agnostic)?

**D. Existing sessions/students.** All mock. Confirm nothing needs migrating — I delete it.

**E. Not a git repo.** I'd like to `git init` and commit per phase so you can review and revert. Confirm.

# Tutoring app

An automatic record of what happened in each tutoring class. The teacher picks a
student, presses start, teaches, presses end, and moves on — topics, questions,
answers, the summary and next steps are produced from the class itself.

Currently at **end of Phase 1**. See [PLAN.md](PLAN.md) for the full V1 plan and
the remaining phases.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Status

| | |
| --- | --- |
| UI | Real |
| Data | Local React state over `lib/mock-data.ts` — deleted in Phase 3 |
| Auth | None yet — Phase 2 |
| Audio capture | None yet — Phase 4 |
| Transcription | None yet — Phase 4 |
| AI write-up | None yet — Phase 5 |

Nothing here fakes a backend. There is no simulated recording, no scripted
lesson playback and no pretend AI: a class you start now records elapsed time
and accepts anything you note yourself, and that is all it claims to do.

Until sign-in exists there is a **Viewing as** control in the bottom-right
corner for switching between the teacher and student views. It is temporary and
is removed in Phase 2.

## Routes

| Route | What it is |
| --- | --- |
| `/teacher` | Overview — recording banner, needs attention, recent classes |
| `/teacher/students` | Searchable student list, add student |
| `/teacher/sessions` | All classes grouped by day |
| `/teacher/sessions/[id]` | View / edit a class — write-up, timeline, transcript |
| `/teacher/students/[id]` | One page: working on, goals, recent classes, details |
| `/session/[id]` | Active class — full screen, its own chrome |
| `/student` | Student home — their classes |
| `/student/sessions/[id]` | One class: summary, topics, Q&A, key points, practice |

## Shortcuts

| Key | Action |
| --- | --- |
| `N` | Start a class |
| `/` | Jump to student search |
| `C` | Focus the capture bar during a class |
| `T` | Toggle the live transcript |
| `⌘↵` | Save an inline edit |

## Design notes

Dark by default, with a light theme available from the account menu. Hairline
borders, small dense interface type, larger and more generously leaded reading
type for the things a student actually reads.

Four semantic colours carry the product: topics indigo, questions amber, answers
green, resources violet. They stay consistent across the timeline, the panels,
the badges and the student view.

No charts and no vanity statistics. Where density needs showing there are tick
meters. Numbers are monospaced and tabular so columns line up and the session
clock doesn't jitter.

Anything the AI produced and the teacher hasn't touched carries a small `AI`
mark. A teacher edit takes that mark away and, from Phase 5 onward, prevents the
AI from overwriting it.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Radix
primitives styled in-repo · Lucide icons.

Supabase, transcription and OpenRouter arrive in Phases 2, 4 and 5.

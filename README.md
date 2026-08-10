# Cadence

A UI prototype for a tutoring management platform. Frontend only — no backend, no auth, no Zoom, no AI. Every interaction runs on local React state over mock data.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Switching portals

Bottom-right of every screen there is a **Viewing as** control. Use it to jump between the teacher portal and the student portal, sign in as any of the eight mock students, and toggle light/dark. It is a prototype affordance and is hidden during a live session.

## Routes

| Route | What it is |
| --- | --- |
| `/teacher` | Overview — live session banner, week metrics, what needs review |
| `/teacher/students` | Searchable, filterable, sortable student list + add student |
| `/teacher/students/[id]` | Profile: sessions, aggregated topics, every question, every resource |
| `/teacher/sessions` | All sessions, grouped by day, filterable by review state |
| `/teacher/sessions/[id]` | Review: edit the summary, publish it, fix topics/questions/links |
| `/session/[id]` | **Active session** — full-screen, its own chrome |
| `/student` | Student home — published lessons only |
| `/student/sessions/[id]` | Lesson review: summary, topics, Q&A, links, practice |

## The active session screen

Start one with **Start session** (or press `N`) from anywhere in the teacher portal.

Once running, a scripted stream plays into the session over the first ~2.5 minutes: topics get detected, the student asks questions, answers land, links are shared, and the transcript fills in. It is fake, obviously, but it makes the screen behave the way the real thing would.

Three columns: student context on the left, the live timeline in the middle, capture panels on the right. The capture bar along the bottom is the primary input — one field, four modes.

**Shortcuts**

| Key | Action |
| --- | --- |
| `N` | Start a session (teacher portal) |
| `/` | Jump to student search |
| `C` | Focus the capture bar |
| `⌘1`–`⌘4` | Topic / Question / Answer / Resource mode |
| `T` | Toggle the live transcript |
| `⌘↵` | Save an inline edit |

Ending a session runs a simulated summary generation, then drops you on the review screen with a draft. Nothing reaches the student until you press **Publish**.

## Design notes

Warm paper background, hairline borders, near-black ink for primary actions. Interface type is small and dense; reading type (the summary a student actually reads) is larger and generously leaded — the two are deliberately different.

Four semantic colours carry the whole product: topics are indigo, questions amber, answers green, resources violet. They stay consistent across the timeline, the panels, the badges and the student view, so you learn them once.

No charts. Where density needed showing — topic confidence, time per student — there are tick meters instead. Numbers are monospaced and tabular so columns line up and the session clock doesn't jitter.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Radix primitives styled in-repo (shadcn/ui conventions) · Lucide icons.

State lives in `lib/store.tsx` — one context, mock data in `lib/mock-data.ts`. Mutations are real; persistence is not.

/**
 * TEMPORARY. Phase 1 runs the UI on this so the visual direction can be
 * reviewed before any backend exists. Phase 3 deletes this file outright and
 * every consumer reads from Postgres instead — nothing here should be treated
 * as an architecture worth preserving.
 */
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
  TranscriptSegment,
} from "./types";

function daysAgo(n: number, hour = 17, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const min = (m: number) => m * 60_000;

export const teacher: Teacher = { id: "t_1", name: "Rajesh B." };

export const students: Student[] = [
  {
    id: "s_maya",
    name: "Siddharth Sriram",
    username: "siddharth.s",
    yearGroup: "Grade 11",
    usualSlot: "Tue & Thu · 5:00 PM",
    timezone: "America/Chicago",
    joinedAt: daysAgo(214),
    color: "226 52% 44%",
  },
  {
    id: "s_dev",
    name: "Rhea Sriram",
    username: "rhea.s",
    yearGroup: "Grade 12",
    usualSlot: "Mon · 7:30 PM",
    timezone: "Europe/London",
    joinedAt: daysAgo(158),
    color: "268 38% 46%",
  },
  {
    id: "s_ana",
    name: "Vihaan Karthick",
    username: "vihaan.k",
    yearGroup: "Grade 10",
    usualSlot: "Wed · 6:00 PM",
    timezone: "America/Mexico_City",
    joinedAt: daysAgo(96),
    color: "166 44% 32%",
  },
  {
    id: "s_theo",
    name: "Anoushka Madhusudhan",
    username: "anoushka.m",
    yearGroup: "Grade 9",
    usualSlot: "Sat · 10:00 AM",
    timezone: "Europe/Stockholm",
    joinedAt: daysAgo(61),
    color: "28 74% 40%",
  },
  {
    id: "s_priya",
    name: "Akshara Madhusudhan",
    username: "akshara.m",
    yearGroup: "Grade 12",
    timezone: "Asia/Kolkata",
    joinedAt: daysAgo(24),
    color: "196 52% 36%",
  },
];

export const snapshots: Record<string, Snapshot> = {
  s_maya: {
    workingOn:
      "Rotational dynamics. Sets up torque equations correctly once an axis is chosen, but picks the axis almost at random.",
    origin: "ai",
    editedByTeacher: false,
    updatedAt: daysAgo(3),
  },
  s_dev: {
    workingOn:
      "Recursion and complexity analysis. Writes correct code but cannot justify runtime.",
    origin: "teacher",
    editedByTeacher: true,
    updatedAt: daysAgo(6),
  },
  s_ana: {
    workingOn:
      "Stoichiometry. Arithmetic is solid; the failure point is turning a word problem into a mole ratio.",
    origin: "ai",
    editedByTeacher: false,
    updatedAt: daysAgo(5),
  },
  s_theo: {
    workingOn: "Algebra foundations — sign errors when distributing across parentheses.",
    origin: "ai",
    editedByTeacher: false,
    updatedAt: daysAgo(9),
  },
  s_priya: {
    workingOn: "No sessions yet.",
    origin: "ai",
    editedByTeacher: false,
    updatedAt: daysAgo(24),
  },
};

export const goals: Goal[] = [
  {
    id: "g_1",
    text: "Score 700+ on the physics exam",
    status: "active",
    origin: "ai",
    editedByTeacher: false,
    createdAt: daysAgo(180),
  },
  {
    id: "g_2",
    text: "Stop skipping free-body diagrams",
    status: "active",
    origin: "teacher",
    editedByTeacher: true,
    createdAt: daysAgo(90),
  },
  {
    id: "g_3",
    text: "Finish CS coursework portfolio",
    status: "active",
    origin: "ai",
    editedByTeacher: false,
    createdAt: daysAgo(120),
  },
  {
    id: "g_4",
    text: "Get comfortable with Big-O proofs",
    status: "active",
    origin: "ai",
    editedByTeacher: false,
    createdAt: daysAgo(60),
  },
  {
    id: "g_5",
    text: "Raise chemistry grade from B− to A",
    status: "active",
    origin: "ai",
    editedByTeacher: false,
    createdAt: daysAgo(80),
  },
];

/** studentId → goal ids. */
export const goalsByStudent: Record<string, string[]> = {
  s_maya: ["g_1", "g_2"],
  s_dev: ["g_3", "g_4"],
  s_ana: ["g_5"],
  s_theo: [],
  s_priya: [],
};

/* ------------------------------------------------------------- builders */

let seq = 0;
const nid = (p: string) => `${p}_${++seq}`;

const topic = (label: string, atMin: number, confidence = 0.9): Topic => ({
  id: nid("t"),
  label,
  firstAtMs: min(atMin),
  confidence,
  origin: "ai",
  editedByTeacher: false,
});

const question = (atMin: number, text: string, answer: string | null): Question => ({
  id: nid("q"),
  askedAtMs: min(atMin),
  text,
  answer,
  evidenceSegmentIds: [],
  withheld: false,
  origin: "ai",
  editedByTeacher: false,
});

const note = (kind: SessionNote["kind"], text: string): SessionNote => ({
  id: nid("n"),
  kind,
  text,
  origin: "ai",
  editedByTeacher: false,
});

const link = (title: string, url: string, atMin?: number): Resource => ({
  id: nid("r"),
  kind: "link",
  title,
  url,
  atMs: atMin === undefined ? undefined : min(atMin),
  createdAt: new Date().toISOString(),
});

const line = (
  speaker: TranscriptSegment["speaker"],
  atMin: number,
  text: string
): TranscriptSegment => ({
  id: nid("seg"),
  channel: speaker === "teacher" ? "mic" : "shared",
  speaker,
  startMs: min(atMin),
  endMs: min(atMin) + 4000,
  text,
});

interface Draft {
  id: string;
  studentId: string;
  startedAt: string;
  durationSeconds: number;
  status?: Session["status"];
  published?: boolean;
  topics: Topic[];
  questions: Question[];
  notes: SessionNote[];
  resources?: Resource[];
  transcript?: TranscriptSegment[];
  summary: string | null;
  attention?: Session["attention"];
}

function build(d: Draft): Session {
  const status = d.status ?? "ready";
  const endedAt = +new Date(d.startedAt) + d.durationSeconds * 1000;
  const isPublished = d.published ?? status === "ready";
  return {
    id: d.id,
    participants: [d.studentId],
    status,
    startedAt: d.startedAt,
    endedAt: new Date(endedAt).toISOString(),
    durationSeconds: d.durationSeconds,
    topics: d.topics,
    questions: d.questions,
    notes: d.notes,
    resources: d.resources ?? [],
    transcript: d.transcript ?? [],
    summary: d.summary,
    summaryOrigin: "ai",
    summaryEditedByTeacher: false,
    publishedAt: isPublished ? new Date(endedAt + 120_000).toISOString() : null,
    attention: d.attention ?? [],
    capture: { mic: "idle", shared: "idle", transcription: "idle" },
  };
}

/* ------------------------------------------------------------- sessions */

export const sessions: Session[] = [
  build({
    id: "ses_maya_3",
    studentId: "s_maya",
    startedAt: daysAgo(3, 17),
    durationSeconds: 58 * 60,
    topics: [
      topic("Moment of inertia for point masses", 2, 0.94),
      topic("Parallel axis theorem", 13, 0.97),
      topic("Choosing a rotation axis", 31, 0.71),
      topic("Torque as r × F", 42, 0.88),
    ],
    questions: [
      question(
        15,
        "Why do we add md² and not subtract it when the axis moves off the centre of mass?",
        "Because the centre of mass is the axis that minimises inertia. Any shift away from it puts more mass farther from the axis, so the term can only add. If subtracting ever worked, you'd have found an axis easier to spin than the centre of mass — which does not exist."
      ),
      question(
        33,
        "How do I pick the axis when the problem doesn't tell me?",
        "Pick the point where an unknown force acts — usually a pivot or contact point. Torque from that force becomes zero, and the unknown drops out of the equation before you ever solve for it."
      ),
      question(
        44,
        "Does the r in r × F go to where the force is applied or where it points?",
        "To where it's applied. r runs from your chosen axis to the application point; the direction the force points is F's job, not r's."
      ),
    ],
    notes: [
      note("key_point", "The centre of mass always gives the smallest moment of inertia."),
      note("key_point", "Choosing the pivot as your axis eliminates the unknown pivot force."),
      note("practice", "Six parallel-axis problems from the worksheet, axis stated each time"),
      note("practice", "Redo question 4 choosing a different axis and check you get the same answer"),
    ],
    resources: [
      link(
        "Parallel axis theorem worked examples",
        "https://openstax.org/books/university-physics-volume-1/pages/10-5",
        14
      ),
    ],
    transcript: [
      line("teacher", 0, "Let's start with where the homework broke down."),
      line("student", 0.2, "Question two — I couldn't tell which axis to use."),
      line("teacher", 1, "Right. Before any equation, name the axis out loud."),
    ],
    summary:
      "We spent the session on rotational inertia, and the recurring failure was axis choice rather than algebra. Once an axis was named, the torque equations came out correctly every time.\n\nThe parallel axis theorem clicked after reframing it: the centre of mass is the easiest axis to spin about, so moving away from it can only ever add inertia. That made the sign of the md² term feel inevitable instead of memorised.\n\nStill unsettled: picking an axis unprompted. The heuristic of choosing the point where an unknown force acts was introduced late and only used once.",
  }),

  build({
    id: "ses_dev_2",
    studentId: "s_dev",
    startedAt: daysAgo(6, 19, 30),
    durationSeconds: 52 * 60,
    topics: [
      topic("Recursion", 1, 0.96),
      topic("Big-O notation", 18, 0.93),
      topic("Complexity analysis of divide and conquer", 34, 0.85),
    ],
    questions: [
      question(
        22,
        "Why is merge sort O(n log n)?",
        "Two things multiply. Splitting the array in half repeatedly gives you log n levels. At every level you touch all n elements once during the merge. n work per level, log n levels, so n log n."
      ),
      question(
        38,
        "Does the recursion depth count towards space complexity?",
        "Yes — the call stack is real memory. Merge sort is O(n) space for the temporary arrays and O(log n) for the stack, so the n term dominates."
      ),
    ],
    notes: [
      note("key_point", "Count levels of recursion, then count work per level, then multiply."),
      note("practice", "Write the recurrence for binary search and solve it"),
    ],
    resources: [link("Recursion tree method", "https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture3.pdf")],
    summary:
      "Worked through recursive functions and compared their runtimes. The code was never the problem — Dev writes correct recursion comfortably — but the justification of why a runtime is what it is was missing.\n\nThe useful reframe was separating depth from width: how many levels does the recursion have, and how much work happens across each level. Merge sort fell out of that immediately once it was drawn as a tree.\n\nSpace complexity came up at the end and is worth revisiting; the distinction between stack space and allocated space is still fuzzy.",
  }),

  build({
    id: "ses_ana_1",
    studentId: "s_ana",
    startedAt: daysAgo(5, 18),
    durationSeconds: 45 * 60,
    topics: [
      topic("Mole ratios", 3, 0.92),
      topic("Limiting reagents", 20, 0.89),
      topic("Percent yield", 36, 0.8),
    ],
    questions: [
      question(
        24,
        "How do I know which reactant is limiting without guessing?",
        "Convert both to moles, then divide each by its coefficient. The smaller number is the limiting one. It works every time because you are comparing how many full reactions each reactant can support."
      ),
    ],
    notes: [
      note("key_point", "Divide moles by coefficient — the smaller result is the limiting reagent."),
      note("practice", "Five limiting-reagent problems, writing the mole ratio before any arithmetic"),
    ],
    summary:
      "Stoichiometry, focused on the translation step rather than the arithmetic. Ana's calculations are reliable; the difficulty is deciding what to calculate.\n\nThe divide-by-coefficient rule for limiting reagents landed well and was applied unaided by the end of the session. Percent yield was introduced but we ran out of time before practising it.",
  }),

  build({
    id: "ses_theo_1",
    studentId: "s_theo",
    startedAt: daysAgo(9, 10),
    durationSeconds: 40 * 60,
    status: "needs_attention",
    topics: [topic("Distributing across parentheses", 4, 0.83)],
    questions: [],
    notes: [],
    summary: null,
    attention: [
      {
        id: "att_1",
        kind: "shared_audio_lost",
        message:
          "Shared audio stopped 12 minutes in. Only your microphone was transcribed after that, so the student's side of the lesson is missing.",
        resolvedAt: null,
      },
    ],
  }),

  build({
    id: "ses_maya_2",
    studentId: "s_maya",
    startedAt: daysAgo(10, 17),
    durationSeconds: 55 * 60,
    topics: [
      topic("Free-body diagrams", 2, 0.95),
      topic("Inclined planes", 19, 0.91),
      topic("Static vs kinetic friction", 38, 0.87),
    ],
    questions: [
      question(
        27,
        "Why does the normal force get smaller on a steeper slope?",
        "Only the component of gravity perpendicular to the surface presses into it, and that component is mg cos θ. Steeper slope, bigger θ, smaller cosine, smaller normal force."
      ),
    ],
    notes: [
      note("key_point", "Normal force is mg cos θ on an incline, not mg."),
      note("practice", "Draw free-body diagrams for the first six problems without solving them"),
    ],
    summary:
      "Forces on inclined planes. Maya reliably reaches the right answer when the diagram is drawn and reliably does not when it isn't, which made the case for diagrams better than any argument could.\n\nThe normal force decomposition was the main gain — treating mg cos θ as something derived rather than memorised.",
  }),
];

/** Session currently being recorded, if any. Empty until Start Session. */
export function makeLiveSession(studentId: string): Session {
  return {
    id: `ses_live_${Date.now().toString(36)}`,
    participants: [studentId],
    status: "recording",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSeconds: 0,
    topics: [],
    questions: [],
    notes: [],
    resources: [],
    transcript: [],
    summary: null,
    summaryOrigin: "ai",
    summaryEditedByTeacher: false,
    publishedAt: null,
    attention: [],
    capture: { mic: "connected", shared: "connected", transcription: "active" },
  };
}

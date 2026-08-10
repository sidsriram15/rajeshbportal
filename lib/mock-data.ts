import type { QA, Resource, Session, Student, Subject, TimelineEvent, Topic } from "./types";

function daysAgo(n: number, hour = 17, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const students: Student[] = [
  {
    id: "s_maya",
    name: "Maya Krishnan",
    email: "maya.k@northfield.edu",
    grade: "Grade 11",
    subjects: ["Physics", "Mathematics"],
    focus: "Rotational dynamics — struggles to pick the right axis before writing torque equations.",
    goals: ["Score 700+ on the physics subject test", "Stop skipping free-body diagrams"],
    joinedAt: daysAgo(214),
    timezone: "America/Chicago",
    cadence: "Tue & Thu · 5:00 PM",
    color: "226 52% 44%",
  },
  {
    id: "s_daniel",
    name: "Daniel Okafor",
    email: "d.okafor@gmail.com",
    grade: "Grade 12",
    subjects: ["Computer Science", "Mathematics"],
    focus: "Recursion and complexity analysis. Writes correct code but cannot justify runtime.",
    goals: ["Finish CS coursework portfolio", "Get comfortable with Big-O proofs"],
    joinedAt: daysAgo(158),
    timezone: "Europe/London",
    cadence: "Mon · 7:30 PM",
    color: "268 38% 46%",
  },
  {
    id: "s_ana",
    name: "Ana Beltrán",
    email: "ana.beltran@liceo.mx",
    grade: "Grade 10",
    subjects: ["Chemistry"],
    focus: "Stoichiometry. Strong arithmetic, weak at translating word problems into mole ratios.",
    goals: ["Raise chemistry grade from B− to A", "Build a reliable problem-setup routine"],
    joinedAt: daysAgo(96),
    timezone: "America/Mexico_City",
    cadence: "Wed · 6:00 PM",
    color: "166 44% 32%",
  },
  {
    id: "s_theo",
    name: "Theo Lindqvist",
    email: "theo.l@nordskolan.se",
    grade: "Grade 9",
    subjects: ["Mathematics"],
    focus: "Algebra foundations — sign errors when distributing across parentheses.",
    goals: ["Confidence with linear systems", "Fewer careless mistakes on tests"],
    joinedAt: daysAgo(61),
    timezone: "Europe/Stockholm",
    cadence: "Sat · 10:00 AM",
    color: "28 74% 40%",
  },
  {
    id: "s_priya",
    name: "Priya Raman",
    email: "priya.raman@dpsr.in",
    grade: "Grade 12",
    subjects: ["Biology", "Chemistry"],
    focus: "Genetics. Memorises vocabulary but loses the thread on multi-step crosses.",
    goals: ["Medical entrance exam prep", "Reason through dihybrid crosses unaided"],
    joinedAt: daysAgo(132),
    timezone: "Asia/Kolkata",
    cadence: "Sun · 9:00 AM",
    color: "4 68% 47%",
  },
  {
    id: "s_jonah",
    name: "Jonah Weiss",
    email: "jonah.weiss@ps231.org",
    grade: "Grade 11",
    subjects: ["English"],
    focus: "Argumentative essays. Good instincts, thin evidence, weak topic sentences.",
    goals: ["Write a defensible thesis in one pass", "Cite text without summarising"],
    joinedAt: daysAgo(44),
    timezone: "America/New_York",
    cadence: "Thu · 4:00 PM",
    color: "222 40% 40%",
  },
  {
    id: "s_lin",
    name: "Lin Wei",
    email: "lin.wei@shsid.org",
    grade: "Grade 10",
    subjects: ["Mathematics", "Physics"],
    focus: "Trigonometric identities — fast, but skips verification steps.",
    goals: ["Olympiad qualifier round", "Show complete reasoning"],
    joinedAt: daysAgo(27),
    timezone: "Asia/Shanghai",
    cadence: "Fri · 8:00 PM",
    color: "196 52% 36%",
  },
  {
    id: "s_amara",
    name: "Amara Diallo",
    email: "amara.d@lyceebc.sn",
    grade: "Grade 12",
    subjects: ["Physics", "Chemistry"],
    focus: "Thermodynamics. Confuses system boundaries and sign conventions for work.",
    goals: ["Pass final exams with distinction"],
    joinedAt: daysAgo(11),
    timezone: "Africa/Dakar",
    cadence: "Not scheduled",
    color: "268 30% 42%",
  },
];

let seq = 0;
const nid = (p: string) => `${p}_${++seq}`;

function topic(label: string, at: number, minutes: number, confidence = 0.9): Topic {
  return { id: nid("t"), label, at, minutes, confidence, source: "detected" };
}
function qa(at: number, question: string, answer: string | null, topicId: string | null = null): QA {
  return { id: nid("q"), at, question, answer, topicId, source: "detected" };
}
function res(
  at: number,
  title: string,
  url: string,
  kind: Resource["kind"] = "link",
  note?: string
): Resource {
  return { id: nid("r"), at, title, url, kind, note };
}

/** Builds the merged chronological feed the session timeline renders. */
export function buildEvents(s: {
  topics: Topic[];
  qa: QA[];
  resources: Resource[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  s.topics.forEach((t) =>
    events.push({ id: nid("e"), kind: "topic", at: t.at, refId: t.id, title: t.label })
  );
  s.qa.forEach((q) => {
    events.push({ id: nid("e"), kind: "question", at: q.at, refId: q.id, title: q.question });
    if (q.answer)
      events.push({ id: nid("e"), kind: "answer", at: q.at + 12, refId: q.id, title: q.answer });
  });
  s.resources.forEach((r) =>
    events.push({
      id: nid("e"),
      kind: "resource",
      at: r.at,
      refId: r.id,
      title: r.title,
      detail: r.url,
    })
  );
  return events.sort((a, b) => a.at - b.at);
}

interface Draft {
  id: string;
  studentId: string;
  subject: Subject;
  title: string;
  startedAt: string;
  durationMin: number;
  topics: Topic[];
  qa: QA[];
  resources: Resource[];
  summary: string;
  homework: string[];
  transcript?: Session["transcript"];
  status?: Session["status"];
}

function session(d: Draft): Session {
  return {
    id: d.id,
    studentId: d.studentId,
    subject: d.subject,
    title: d.title,
    status: d.status ?? "published",
    startedAt: d.startedAt,
    durationMin: d.durationMin,
    topics: d.topics,
    qa: d.qa,
    resources: d.resources,
    transcript: d.transcript ?? [],
    events: buildEvents(d),
    summary: d.summary,
    summaryDraft: d.summary,
    homework: d.homework,
    zoom: { connected: false, recording: false, participants: 0 },
  };
}

export const sessions: Session[] = [
  session({
    id: "ses_maya_3",
    studentId: "s_maya",
    subject: "Physics",
    title: "Rotational inertia & the parallel axis theorem",
    startedAt: daysAgo(3, 17),
    durationMin: 58,
    topics: [
      topic("Moment of inertia for point masses", 120, 11, 0.94),
      topic("Parallel axis theorem", 780, 16, 0.97),
      topic("Choosing a rotation axis", 1860, 9, 0.71),
      topic("Torque as r × F", 2520, 14, 0.88),
    ],
    qa: [
      qa(
        920,
        "Why do we add md² and not subtract it when the axis moves off the centre of mass?",
        "Because the centre of mass is the axis that minimises inertia. Any shift away from it puts more mass farther from the axis, so the term can only add. If subtracting ever worked, you'd have found an axis easier to spin than the centre of mass — which does not exist."
      ),
      qa(
        1980,
        "How do I pick the axis when the problem doesn't tell me?",
        "Pick the point where an unknown force acts — usually a pivot or contact point. Torque from that force becomes zero, and the unknown drops out of the equation before you ever solve for it."
      ),
      qa(
        2660,
        "Does the r in r × F go to where the force is applied or where it points?",
        "To where it's applied. r runs from your chosen axis to the application point; the direction the force points is F's job, not r's.",
        undefined as unknown as string | null
      ),
      qa(3120, "Is torque a vector or a scalar in 2D problems?", null),
    ],
    resources: [
      res(1040, "Parallel axis theorem — worked derivation", "https://openstax.org/books/university-physics-volume-1/pages/10-5", "doc"),
      res(2100, "Axis selection drill set (12 problems)", "https://phet.colorado.edu/en/simulations/torque", "practice", "Do 1–6 before Thursday."),
      res(3200, "Walter Lewin — torque intuition", "https://www.youtube.com/watch?v=t9C-yEHOxUw", "video"),
    ],
    transcript: [
      { at: 118, speaker: "teacher", text: "Let's start where you got stuck on the homework — problem 4, the rod with two masses." },
      { at: 131, speaker: "student", text: "Yeah, I set up the sum of mr squared but the answer key has an extra term." },
      { at: 150, speaker: "teacher", text: "That extra term is the giveaway that they moved the axis. Where did you put yours?" },
      { at: 164, speaker: "student", text: "At the middle of the rod." },
      { at: 176, speaker: "teacher", text: "And they put it at the end. So the difference is exactly md squared — that's the parallel axis theorem." },
      { at: 920, speaker: "student", text: "Why do we add md squared and not subtract it when the axis moves off the centre of mass?" },
    ],
    summary:
      "We rebuilt moment of inertia from point masses upward, then used that to motivate the parallel axis theorem rather than memorising it. Maya could apply I = Σmr² comfortably, so the session focused on the harder skill: deciding what to rotate about before writing anything down.\n\nThe key breakthrough was reframing axis choice as a strategy rather than a given. Placing the axis at an unknown force kills that force's torque term, which removed the algebra she had been fighting through on homework problems 4 and 7. She applied this unaided on the last two problems.\n\nStill shaky: the direction of r in r × F. She is reaching for the force's direction instead of the displacement from the axis. Worth five minutes of drilling at the start of next session before moving into angular momentum.",
    homework: [
      "Axis selection drill set, problems 1–6",
      "Redo homework problems 4 and 7 with the axis at the pivot",
      "Write one sentence explaining why md² is always positive",
    ],
  }),
  session({
    id: "ses_maya_2",
    studentId: "s_maya",
    subject: "Physics",
    title: "Free-body diagrams on inclined planes",
    startedAt: daysAgo(10, 17),
    durationMin: 55,
    topics: [
      topic("Decomposing weight on an incline", 90, 18, 0.96),
      topic("Static vs kinetic friction", 1320, 15, 0.92),
      topic("Normal force is not always mg", 2400, 12, 0.89),
    ],
    qa: [
      qa(
        1400,
        "Why is the normal force smaller on a steeper ramp?",
        "Only the component of gravity perpendicular to the surface presses into it — mg·cos θ. Steepen the ramp and cos θ shrinks, so the surface pushes back less. At 90° the ramp is vertical and there's nothing to press against at all."
      ),
      qa(
        2480,
        "If the block isn't moving, is friction always at its maximum?",
        "No — static friction is whatever it needs to be to hold things still, up to a ceiling of μₛN. Treat μₛN as a limit, not a value."
      ),
    ],
    resources: [
      res(1500, "Incline plane simulator", "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html", "practice"),
    ],
    summary:
      "Focused entirely on diagram discipline. Maya had been solving inclines algebraically without drawing, which worked until friction entered and the sign errors started.\n\nWe made one rule: no equation before the diagram is labelled, including the angle. With that constraint she solved four problems in a row without an error, including the two she had marked as impossible last week.\n\nThe misconception worth flagging: she believed N = mg universally. Once we showed N shrinking as the ramp steepens, the friction problems resolved themselves.",
    homework: ["Chapter 6, problems 12–18", "Redraw last week's failed problems with labelled angles"],
  }),
  session({
    id: "ses_maya_1",
    studentId: "s_maya",
    subject: "Mathematics",
    title: "Trigonometric substitution in integrals",
    startedAt: daysAgo(18, 17),
    durationMin: 60,
    topics: [
      topic("Recognising √(a²−x²) patterns", 60, 20, 0.93),
      topic("Back-substituting with a reference triangle", 1500, 22, 0.9),
    ],
    qa: [
      qa(
        1620,
        "How do I get back to x at the end without guessing?",
        "Draw the reference triangle from your substitution. Label the sides once and every trig function of θ reads straight off it — no guessing, no identities to recall."
      ),
    ],
    resources: [res(1700, "Reference triangle cheat sheet", "https://tutorial.math.lamar.edu/classes/calcii/trigsubstitutions.aspx", "doc")],
    summary:
      "Trig substitution went smoothly once we anchored it to reference triangles instead of memorised identity tables. Maya's algebra is strong; the bottleneck was the return trip from θ back to x.\n\nShe finished the session solving two problems unaided, both with clean back-substitution.",
    homework: ["Six trig-sub integrals from the practice sheet"],
  }),
  session({
    id: "ses_daniel_2",
    studentId: "s_daniel",
    subject: "Computer Science",
    title: "Recursion trees and amortised analysis",
    startedAt: daysAgo(2, 19, 30),
    durationMin: 62,
    topics: [
      topic("Drawing the recursion tree", 150, 14, 0.95),
      topic("Master theorem cases", 1100, 18, 0.91),
      topic("Amortised cost of dynamic arrays", 2300, 16, 0.87),
      topic("Why append is O(1) on average", 3000, 8, 0.79),
    ],
    qa: [
      qa(
        1240,
        "How do I know which master theorem case I'm in without memorising all three?",
        "Compare the work at the leaves against the work at the root. Leaves dominate → case 1. Root dominates → case 3. Neither → case 2, and you pick up the log factor. You're comparing two numbers, not recalling three rules."
      ),
      qa(
        2420,
        "If one append costs O(n) when the array resizes, how is the average still O(1)?",
        "Because doubling means the expensive resize happens exponentially rarely. Copying n elements buys you n more cheap appends, so you spread that cost across them — roughly two operations per append, forever."
      ),
      qa(3140, "Does amortised mean the same thing as average case?", null),
    ],
    resources: [
      res(1350, "Master theorem visual guide", "https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture3.pdf", "doc"),
      res(2500, "CPython list resize source", "https://github.com/python/cpython/blob/main/Objects/listobject.c", "link", "Read the growth factor comment."),
    ],
    summary:
      "Daniel writes correct recursive code but could not defend its runtime, which is what the coursework is actually graded on. We spent the session translating code into recursion trees before touching any formula.\n\nThe master theorem clicked once framed as a comparison between leaf work and root work rather than three memorised cases. He classified five recurrences correctly and unaided by the end.\n\nAmortised analysis is still fragile. He accepted the doubling argument but conflated amortised with average case at the very end of the session — that distinction is the first thing to address next Monday.",
    homework: [
      "Classify recurrences 1–8 with a drawn tree for each",
      "Write a one-paragraph explanation of amortised vs average case",
    ],
  }),
  session({
    id: "ses_daniel_1",
    studentId: "s_daniel",
    subject: "Computer Science",
    title: "Graph traversal — BFS, DFS and when each wins",
    startedAt: daysAgo(9, 19, 30),
    durationMin: 57,
    topics: [
      topic("Queue vs stack mechanics", 100, 16, 0.94),
      topic("Shortest path on unweighted graphs", 1200, 19, 0.93),
      topic("Cycle detection with DFS colouring", 2400, 14, 0.85),
    ],
    qa: [
      qa(
        1300,
        "Why does BFS give shortest paths but DFS doesn't?",
        "BFS finishes every node at distance k before touching distance k+1, so the first time it reaches a node is necessarily the shortest way. DFS commits to one branch and may arrive at a node the long way round first."
      ),
    ],
    resources: [res(1400, "Traversal visualiser", "https://visualgo.net/en/dfsbfs", "link")],
    summary:
      "BFS and DFS were already familiar as code; the session was about choosing between them. Framing the difference as queue-versus-stack, then tracing both by hand on the same graph, made the shortest-path guarantee obvious rather than memorised.\n\nCycle detection with three-colour DFS is new to him and needs another pass.",
    homework: ["Implement cycle detection on the provided directed graph"],
  }),
  session({
    id: "ses_ana_2",
    studentId: "s_ana",
    subject: "Chemistry",
    title: "Limiting reagents from word problems",
    startedAt: daysAgo(4, 18),
    durationMin: 50,
    topics: [
      topic("Translating a word problem into a balanced equation", 120, 15, 0.92),
      topic("Mole ratio bookkeeping", 1080, 18, 0.95),
      topic("Identifying the limiting reagent", 2200, 13, 0.9),
    ],
    qa: [
      qa(
        1160,
        "How do I know which number in the problem is the one that runs out?",
        "Convert both to moles, then divide each by its coefficient. The smaller result is your limiting reagent. Comparing raw grams is the trap — grams don't account for the recipe."
      ),
      qa(
        2320,
        "Do I always have to balance the equation first?",
        "Yes. The coefficients are the recipe, and without them the mole ratio is meaningless. Balancing first also catches transcription errors before they cost you the whole problem."
      ),
    ],
    resources: [
      res(1250, "Limiting reagent practice set", "https://www.khanacademy.org/science/chemistry/chemical-reactions-stoichiome", "practice"),
    ],
    summary:
      "Ana's arithmetic was never the problem — setup was. We built a fixed four-step routine: balance, convert to moles, divide by coefficients, compare.\n\nWith that routine written on the board she solved six problems consecutively without help, including two she had abandoned on last week's worksheet.\n\nShe still hesitates to balance before reading the full question. Worth reinforcing, but the trajectory here is good.",
    homework: ["Practice set problems 1–10 using the four-step routine"],
  }),
  session({
    id: "ses_ana_1",
    studentId: "s_ana",
    subject: "Chemistry",
    title: "Moles, mass and Avogadro's number",
    startedAt: daysAgo(11, 18),
    durationMin: 48,
    topics: [
      topic("What a mole actually counts", 90, 17, 0.96),
      topic("Molar mass from the periodic table", 1150, 16, 0.94),
    ],
    qa: [
      qa(
        980,
        "Why do we need a unit that big?",
        "Because atoms are that small. A mole is just a counting word, like a dozen — chosen so that one mole of a substance weighs its atomic mass in grams. That coincidence is the whole point."
      ),
    ],
    resources: [res(1200, "Periodic table with molar masses", "https://ptable.com", "link")],
    summary:
      "Foundational session. Ana had been treating the mole as an arbitrary constant to plug in; reframing it as a counting word made the gram/atomic-mass relationship intuitive rather than magical.\n\nGood grasp by the end. Ready for stoichiometry.",
    homework: ["Convert 12 given masses to moles"],
  }),
  session({
    id: "ses_theo_1",
    studentId: "s_theo",
    subject: "Mathematics",
    title: "Distributing negatives without sign errors",
    startedAt: daysAgo(5, 10),
    durationMin: 45,
    topics: [
      topic("The minus sign as multiply-by-negative-one", 80, 18, 0.93),
      topic("Nested parentheses", 1200, 15, 0.88),
    ],
    qa: [
      qa(
        900,
        "Why does the sign flip on the second term too?",
        "Because the minus multiplies everything inside the bracket, not just the first thing it touches. Write it as (−1) × the bracket for a few problems and the flip stops being surprising."
      ),
    ],
    resources: [res(1000, "Sign error drill — 30 problems", "https://www.mathsisfun.com/algebra/expanding.html", "practice")],
    summary:
      "Theo's algebra errors were almost entirely sign errors on distribution. Rewriting every leading minus as (−1)× removed them immediately — he made zero sign errors in the last twenty minutes after making six in the first ten.\n\nThis is a habit fix, not a concept gap. Repetition over the next two weeks should lock it in.",
    homework: ["Sign error drill, all 30 problems"],
  }),
  session({
    id: "ses_priya_2",
    studentId: "s_priya",
    subject: "Biology",
    title: "Dihybrid crosses and independent assortment",
    startedAt: daysAgo(6, 9),
    durationMin: 65,
    topics: [
      topic("Punnett squares beyond 2×2", 140, 20, 0.94),
      topic("Independent assortment", 1500, 17, 0.91),
      topic("The 9:3:3:1 ratio and where it comes from", 2600, 19, 0.96),
    ],
    qa: [
      qa(
        1680,
        "Do I have to draw all sixteen boxes every time?",
        "No. Once you trust independent assortment you can multiply the two monohybrid probabilities instead — 3/4 × 3/4 gives you 9/16 directly. Draw the grid until it feels obvious, then stop."
      ),
      qa(
        2740,
        "Does 9:3:3:1 ever break?",
        "Yes — when the genes sit close together on the same chromosome they're linked and don't assort independently. You'll see ratios skewed toward the parental combinations, and that deviation is exactly how linkage was discovered."
      ),
    ],
    resources: [
      res(1800, "Dihybrid cross practice", "https://www.biologycorner.com/worksheets/dihybrid_practice.html", "practice"),
      res(2800, "Linkage and recombination primer", "https://www.nature.com/scitable/topicpage/genetic-linkage-and-recombination-534/", "doc"),
    ],
    summary:
      "Priya could recite the 9:3:3:1 ratio but could not derive it, which is what the exam actually tests. We built it from two monohybrid crosses multiplied together, which also gave her the shortcut for exam speed.\n\nShe asked a genuinely good unprompted question about when the ratio breaks down — that led into linkage, which is beyond her syllabus but sharpened her understanding of why independent assortment is an assumption rather than a law.\n\nStrong session. She is ready for pedigree analysis.",
    homework: ["Dihybrid practice sheet, all problems", "Derive 9:3:3:1 from scratch without notes"],
  }),
  session({
    id: "ses_priya_1",
    studentId: "s_priya",
    subject: "Chemistry",
    title: "Reaction rates and catalysts",
    startedAt: daysAgo(13, 9),
    durationMin: 55,
    topics: [
      topic("Collision theory", 110, 18, 0.92),
      topic("Activation energy", 1300, 20, 0.95),
      topic("How catalysts lower Ea", 2500, 12, 0.89),
    ],
    qa: [
      qa(
        2600,
        "Does a catalyst make the reaction release more energy?",
        "No — it only lowers the barrier between start and finish. The energy difference between reactants and products is untouched. A catalyst changes the route, never the destination."
      ),
    ],
    resources: [res(2700, "Energy profile diagrams", "https://www.chemguide.co.uk/physical/basicrates/introduction.html", "doc")],
    summary:
      "Solid coverage of collision theory into activation energy. The catalyst misconception — that catalysts add energy — surfaced and was corrected with energy profile diagrams.\n\nPriya's vocabulary recall is excellent; the gap is always in multi-step reasoning, and this topic had few steps so it went quickly.",
    homework: ["Sketch energy profiles for three given reactions, with and without catalyst"],
  }),
  session({
    id: "ses_jonah_1",
    studentId: "s_jonah",
    subject: "English",
    title: "Thesis statements that can be argued against",
    startedAt: daysAgo(7, 16),
    durationMin: 52,
    topics: [
      topic("Claim vs observation", 120, 19, 0.9),
      topic("Topic sentences that carry the argument", 1400, 16, 0.87),
      topic("Evidence integration without summarising", 2400, 14, 0.83),
    ],
    qa: [
      qa(
        1000,
        "How do I tell if my thesis is actually arguable?",
        "Try writing the opposite. If the reverse sounds absurd, you've written an observation, not a claim. A real thesis has an intelligent opponent."
      ),
      qa(
        2500,
        "How much of the quote should I explain?",
        "Explain the part you're leaning on, not the whole quote. If your analysis restates what a reader could see for themselves, cut it."
      ),
    ],
    resources: [
      res(1500, "Thesis workshop handout", "https://writingcenter.unc.edu/tips-and-tools/thesis-statements/", "doc"),
    ],
    summary:
      "Jonah's essays read as well-written summaries rather than arguments. The reversal test — write the opposite of your thesis and see if anyone would defend it — gave him a concrete filter he could apply on his own.\n\nHe rewrote his Gatsby thesis three times during the session, and the third was genuinely arguable.\n\nEvidence integration remains the weak point. He still explains quotes rather than using them.",
    homework: ["Rewrite the Gatsby introduction with the new thesis", "Apply the reversal test to three old essays"],
  }),
  session({
    id: "ses_lin_1",
    studentId: "s_lin",
    subject: "Mathematics",
    title: "Proving trig identities systematically",
    startedAt: daysAgo(1, 20),
    durationMin: 60,
    topics: [
      topic("Start from the messier side", 100, 15, 0.91),
      topic("Pythagorean identity substitutions", 1200, 20, 0.95),
      topic("Converting everything to sine and cosine", 2500, 18, 0.93),
    ],
    qa: [
      qa(
        1300,
        "Is it cheating to work on both sides at once?",
        "It's not cheating, but it's risky — you can accidentally assume what you're proving. Work one side down to the other and the proof stays airtight."
      ),
      qa(
        2600,
        "When should I convert to sine and cosine instead of using an identity?",
        "When you're stuck for more than a minute. It's the slow, reliable route — it always works, it's just longer. Reach for it when pattern matching fails."
      ),
    ],
    resources: [res(2700, "Identity proof practice", "https://tutorial.math.lamar.edu/classes/alg/trigidentities.aspx", "practice")],
    summary:
      "Lin is fast and pattern-matches well, so the session targeted rigour rather than speed. Two rules: start from the messier side, and never work both sides simultaneously.\n\nHe resisted the second rule until we constructed a false proof that worked both sides at once and 'proved' something untrue. That was persuasive.\n\nHis written work is now complete enough for competition marking.",
    homework: ["Eight identity proofs, one side only, full working"],
  }),
  session({
    id: "ses_lin_2",
    studentId: "s_lin",
    subject: "Physics",
    title: "Projectile motion with drag — qualitative",
    startedAt: daysAgo(8, 20),
    durationMin: 47,
    topics: [
      topic("Why the trajectory stops being symmetric", 130, 20, 0.88),
      topic("Terminal velocity", 1600, 16, 0.92),
    ],
    qa: [
      qa(
        900,
        "Why does the projectile fall more steeply than it rose?",
        "Drag removes horizontal speed throughout the flight, so by the time it's coming down there's less horizontal motion left to carry it forward. The descent is steeper because the horizontal component has been eaten away."
      ),
    ],
    resources: [res(1700, "Projectile with drag simulation", "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html", "practice")],
    summary:
      "A qualitative session, deliberately. Lin can do the algebra for drag-free projectiles; the goal was building physical intuition for what drag does to the shape of a trajectory.\n\nHe predicted the asymmetry correctly before we ran the simulation, which is exactly the reasoning we were after.",
    homework: ["Sketch three trajectories with increasing drag and annotate the differences"],
  }),
  session({
    id: "ses_amara_1",
    studentId: "s_amara",
    subject: "Physics",
    title: "First law of thermodynamics — sign conventions",
    startedAt: daysAgo(2, 15),
    durationMin: 54,
    status: "draft",
    topics: [
      topic("Defining the system boundary", 110, 17, 0.9),
      topic("Work done on vs by the gas", 1300, 21, 0.94),
      topic("ΔU = Q − W bookkeeping", 2500, 13, 0.86),
    ],
    qa: [
      qa(
        1420,
        "How do I know if W is positive or negative?",
        "Decide the boundary first, then ask which way energy crossed it. Energy leaving the system is negative, entering is positive. The formula only makes sense after the boundary is drawn."
      ),
      qa(2600, "Does the sign convention change between textbooks?", null),
    ],
    resources: [res(1500, "Thermodynamics sign convention reference", "https://www.grc.nasa.gov/www/k-12/airplane/thermo1.html", "doc")],
    summary:
      "Amara's difficulty with the first law is entirely a bookkeeping problem, not a conceptual one. She understands energy conservation; she loses track of which direction energy is moving.\n\nWe established that the system boundary gets drawn and labelled before any equation is written. With that in place her error rate dropped noticeably in the second half.\n\nShe asked whether textbooks disagree on conventions — they do, and that is worth an explicit answer next session since her school text and her exam board differ.",
    homework: ["Ten first-law problems with the boundary drawn on each"],
  }),
];

export const LIVE_SESSION_ID = "ses_live_maya";

/** The session the demo drops you into when you press "Start session". */
export function makeLiveSession(studentId: string, subject: Subject, title: string): Session {
  return {
    id: LIVE_SESSION_ID,
    studentId,
    subject,
    title,
    status: "live",
    startedAt: new Date().toISOString(),
    durationMin: 0,
    topics: [],
    qa: [],
    resources: [],
    transcript: [],
    events: [
      {
        id: "e_start",
        kind: "system",
        at: 0,
        title: "Session started",
        detail: "Zoom connected · transcription active",
      },
    ],
    summary: "",
    summaryDraft: "",
    homework: [],
    zoom: { connected: true, recording: true, participants: 2 },
  };
}

/**
 * Scripted stream that plays into a live session so the demo feels alive.
 * `at` is seconds after the session's local start.
 */
export const liveScript: Array<{
  at: number;
  kind: "topic" | "question" | "answer" | "resource" | "transcript";
  payload: Record<string, unknown>;
}> = [
  { at: 4, kind: "transcript", payload: { speaker: "teacher", text: "Alright — where did the homework fall apart?" } },
  { at: 9, kind: "transcript", payload: { speaker: "student", text: "Problem three. The pulley one with two blocks." } },
  { at: 14, kind: "topic", payload: { label: "Atwood machine setup", minutes: 6, confidence: 0.88 } },
  { at: 20, kind: "transcript", payload: { speaker: "teacher", text: "Good. Draw both blocks separately before you write anything." } },
  {
    at: 26,
    kind: "question",
    payload: { question: "Is the tension the same on both sides of the pulley?" },
  },
  {
    at: 34,
    kind: "answer",
    payload: {
      answer:
        "For an ideal massless, frictionless pulley, yes — it just redirects the rope. The moment the pulley has real mass, the tensions differ, because a net torque is what spins it up.",
    },
  },
  { at: 44, kind: "topic", payload: { label: "Tension in ideal vs massive pulleys", minutes: 8, confidence: 0.93 } },
  {
    at: 52,
    kind: "resource",
    payload: {
      title: "Atwood machine walkthrough",
      url: "https://openstax.org/books/university-physics-volume-1/pages/6-2",
      kind: "doc",
    },
  },
  {
    at: 62,
    kind: "question",
    payload: { question: "Why does the heavier block's acceleration not just equal g?" },
  },
  {
    at: 71,
    kind: "answer",
    payload: {
      answer:
        "Because the rope is holding some of its weight back. It only reaches g if the other side weighs nothing — then there's no tension left to resist it.",
    },
  },
  { at: 82, kind: "topic", payload: { label: "Constraint equations for connected bodies", minutes: 9, confidence: 0.76 } },
  { at: 90, kind: "transcript", payload: { speaker: "student", text: "So the accelerations are the same size but opposite?" } },
  { at: 96, kind: "transcript", payload: { speaker: "teacher", text: "Exactly — that's your constraint. The rope doesn't stretch." } },
  {
    at: 104,
    kind: "question",
    payload: { question: "How do I write the constraint when the pulley itself is moving?" },
  },
  {
    at: 116,
    kind: "resource",
    payload: {
      title: "Movable pulley constraint problems",
      url: "https://phet.colorado.edu/en/simulations/pendulum-lab",
      kind: "practice",
    },
  },
  { at: 128, kind: "topic", payload: { label: "Movable pulleys", minutes: 7, confidence: 0.69 } },
  {
    at: 138,
    kind: "answer",
    payload: {
      answer:
        "Track total rope length. Write it as a sum of the segments, then differentiate twice. Whatever relationship falls out is your constraint — no intuition required.",
    },
  },
];

/** AI summary the demo "generates" when a live session ends. */
export const generatedSummaryTemplate = (studentName: string, topics: string[]) =>
  `We worked through connected-body problems, starting from the pulley question that stalled ${studentName.split(" ")[0]} on the homework. ${
    topics[0] ? `The session opened on ${topics[0].toLowerCase()} and` : "The session"
  } stayed on setup rather than algebra, since the algebra was never the failing step.\n\nThe useful reframe was treating tension as a redirection rather than a force with its own agenda — that made the ideal-pulley assumption feel like a simplification instead of a rule. ${
    topics[2] ? `Constraint equations came up next, and ${studentName.split(" ")[0]} arrived at the equal-and-opposite acceleration relationship without prompting.` : ""
  }\n\nStill unsettled: writing constraints when the pulley itself moves. The rope-length method was introduced but not practised. Open that up next session before moving on.`;

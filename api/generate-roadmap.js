import roadmaps from "../data/roadmaps.json" with { type: "json" };

function normalize(str = "") {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[_]/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");
}

const ALIASES = {
  "front end developer": "frontend-developer",
  "frontend dev": "frontend-developer",
  "front-end developer": "frontend-developer",
  "react developer": "frontend-developer",
  "reactjs developer": "frontend-developer",

  "back end developer": "backend-developer",
  "backend dev": "backend-developer",
  "node developer": "backend-developer",
  "nodejs developer": "backend-developer",

  "full stack developer": "fullstack-developer",
  "fullstack developer": "fullstack-developer",
  "mern stack developer": "fullstack-developer",

  "devops": "devops-engineer",
  "sre": "site-reliability-engineer",

  "pentester": "penetration-tester",
  "penetration testing": "penetration-tester",

  "ui ux designer": "ui-ux-designer",
  "ux designer": "ui-ux-designer",
  "ui designer": "ui-ux-designer",

  "ml engineer": "machine-learning-engineer",
  "machine learning": "machine-learning-engineer",
  "ai": "ai-engineer",
};

function jobToPhases(job) {
  const steps = Array.isArray(job.roadmap) ? job.roadmap : [];
  const topics = steps.map((s) => String(s).replace(/^learn\s+/i, "").trim());

  const n = topics.length;
  const a = Math.ceil(n / 3);

  const p1 = topics.slice(0, a);
  const p2 = topics.slice(a, 2 * a);
  const p3 = topics.slice(2 * a);

  return [
    {
      phase_name: "Foundations",
      duration: "Weeks 1–2",
      topics: p1.length ? p1 : topics,
    },
    {
      phase_name: "Build Skills",
      duration: "Weeks 3–6",
      topics: p2.length ? p2 : topics,
    },
    {
      phase_name: "Projects & Mastery",
      duration: "Weeks 7–12",
      topics: p3.length ? p3 : topics,
    },
  ];
}

function findJob(jobTitleRaw) {
  const q = normalize(jobTitleRaw);
  if (!q) return null;

  // 1) Alias exact match
  const aliasId = ALIASES[q];
  if (aliasId) {
    return roadmaps.jobs.find((j) => j.id === aliasId) || null;
  }

  // 2) Match by id exact
  const byId = roadmaps.jobs.find((j) => normalize(j.id) === q);
  if (byId) return byId;

  // 3) Match by title exact
  const byTitle = roadmaps.jobs.find((j) => normalize(j.title) === q);
  if (byTitle) return byTitle;

  // 4) Loose match
  const loose = roadmaps.jobs.find((j) => {
    const t = normalize(j.title);
    return t.includes(q) || q.includes(t);
  });
  if (loose) return loose;

  return null;
}

export default function handler(req, res) {
  // CORS for GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { jobTitle } = req.body || {};
    const job = findJob(jobTitle);

    if (!job) {
      return res.status(404).json({
        error: "No roadmap found for that job title.",
        hint: "Try: Frontend Developer, Backend Developer, DevOps Engineer, Data Analyst, etc.",
      });
    }

    return res.status(200).json({
      job: {
        id: job.id,
        title: job.title,
        category: job.category,
        skills: job.skills,
      },
      phases: jobToPhases(job), // <-- this is what your roadmap.html needs
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
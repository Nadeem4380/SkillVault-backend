const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Load jobs from JSON file
const JOBS_PATH = path.join(__dirname, "real_roadmap_jobs.json");
let JOBS = [];
try {
    JOBS = JSON.parse(fs.readFileSync(JOBS_PATH, "utf8")).jobs || [];
} catch (err) {
    console.error("ERROR loading jobs JSON:", err);
    JOBS = [];
}

// Fuzzy and flexible match for job search
function findJob(query) {
    if (!query) return null;
    const input = query.trim().toLowerCase();
    let found =
        JOBS.find(j => j.id.toLowerCase() === input) ||
        JOBS.find(j => j.title.toLowerCase() === input) ||
        JOBS.find(j => input.includes(j.title.toLowerCase()) || j.title.toLowerCase().includes(input)) ||
        JOBS.find(j => input.includes(j.id.toLowerCase()) || j.id.toLowerCase().includes(input)) ||
        JOBS.find(j => input.split(/\s+/).some(word => j.title.toLowerCase().includes(word) || j.id.toLowerCase().includes(word)));
    return found || null;
}

app.post("/generate-roadmap", (req, res) => {
    const { jobTitle } = req.body;
    if (!jobTitle || typeof jobTitle !== "string") {
        return res.status(400).json({ error: "Missing jobTitle" });
    }
    const job = findJob(jobTitle);
    if (!job) {
        return res.status(404).json({ error: "No roadmap found for this job", requested: jobTitle });
    }

    // === DYNAMIC PHASES ASSEMBLY BLOCK ===
    const phases = [];
    // If job.phases is present and not empty, include those phases
    if (Array.isArray(job.phases) && job.phases.length > 0) {
        phases.push(...job.phases);
    }
    if (Array.isArray(job.skills) && job.skills.length > 0) {
        phases.push({ phase_name: "Key Skills", topics: job.skills });
    }
    if (Array.isArray(job.courses) && job.courses.length > 0) {
        phases.push({ phase_name: "Courses", topics: job.courses.map(c => c.name) });
    }
    if (Array.isArray(job.books) && job.books.length > 0) {
        phases.push({ phase_name: "Books", topics: job.books.map(b => b.title) });
    }
    if (Array.isArray(job.projects) && job.projects.length > 0) {
        phases.push({ phase_name: "Projects", topics: job.projects });
    }
    if (phases.length === 0) {
        phases.push({ phase_name: "General Steps", topics: ["Explore courses", "Build projects", "Apply for jobs"] });
    }
    // === END BLOCK ===

    res.json({
        id: job.id,
        title: job.title,
        category: job.category,
        phases
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});
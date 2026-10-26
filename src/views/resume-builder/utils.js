import { DEFAULT_SANJAY_RESUME } from "./constants";

export const RESUME_DRAFT_KEY = "portfolio-magic-resume-draft-v4";
export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_RESUME_TEXT_LENGTH = 100000;

const IMAGE_MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function createGeminiImagePart(file) {
  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = IMAGE_MIME_TYPES[extension];
  if (!mimeType || (file.type && file.type !== mimeType)) {
    throw new Error("Choose a JPG, PNG, or WEBP resume image.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return {
    inlineData: {
      mimeType,
      data: window.btoa(binary),
    },
  };
}

export function createEmptyResume(details = {}) {
  return {
    template: "modern",
    themeColor: "#0db760",
    fontFamily: "sans",
    baseFontSize: 14,
    lineHeight: 1.5,
    sectionSpacing: 16,
    pagePadding: 28,
    autoOnePage: false,
    personal: {
      name: details.name || "",
      title: details.title || "",
      phone: details.phone || "",
      email: details.email || "",
      location: details.location || "",
      linkedin: details.linkedin || "",
      github: details.github || "",
      portfolio: details.portfolio || "",
      photo: details.photo || "",
      photoConfig: {
        visible: Boolean(details.photo),
        size: 90,
        shape: "rounded",
      },
    },
    summary: details.summary || "",
    skills: {
      programming: [],
      frameworks: [],
      webTechnologies: [],
      tools: [],
      cloud: [],
      ai: [],
      databases: [],
    },
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
    customSections: [],
    sectionOrder: ["personal", "summary", "skills", "experience", "education", "projects", "certifications", "languages"],
    visibleSections: {
      personal: true,
      summary: true,
      skills: true,
      experience: true,
      education: true,
      projects: true,
      certifications: true,
      languages: true,
    },
  };
}

const STOP_WORDS = new Set(
  `a an and are as at be been being by can did do does for from had has have he her hers him his i if in into is it its may me my of on or our ours position required requirement requiring role she should so than that the their theirs them they this those through to was we were what when where which who will with would you your yours`.split(" "),
);

export function getTerms(text) {
  if (!text || typeof text !== "string") return [];
  const matches = text.toLowerCase().match(/[a-z][a-z0-9+#.-]*/g) || [];
  return matches
    .flatMap((match) => match.split(/[.-]/))
    .filter((word) => word.length >= 3 || ["c#", "c++", "go", "ai", "ui", "ux", "js", "ts"].includes(word));
}

export async function extractResumeText(file) {
  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new Error("Choose a resume file smaller than 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  let text;

  if (extension === "txt" || extension === "md") {
    text = await file.text();
  } else if (extension === "docx") {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { configurePdfWorker } = await import("./pdfWorker");
    configurePdfWorker(pdfjs);

    const document = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
    }).promise;
    if (document.numPages > 80) {
      throw new Error("This resume has more than 80 pages. Choose a shorter document.");
    }

    const pageTexts = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => item.str).join(" "));
    }
    text = pageTexts.join("\n");
  } else {
    throw new Error("Choose a PDF, DOCX, TXT, or MD file.");
  }

  const cleanedText = text.split(String.fromCharCode(0)).join("").trim();
  if (!cleanedText) {
    throw new Error("No readable text was found. For a scanned document, upload an image.");
  }
  if (cleanedText.length > MAX_RESUME_TEXT_LENGTH) {
    throw new Error("The extracted resume is too long. Keep it under 100,000 characters.");
  }
  return cleanedText;
}

export function getKeywordMatch(jobDescription, resumeText) {
  if (!jobDescription || !jobDescription.trim()) {
    return { keywords: [], matchedCount: 0, score: 0 };
  }
  const words = getTerms(jobDescription);
  const frequencies = new Map();
  words.forEach((word) => {
    if (!STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
  });

  const resumeWords = new Set(getTerms(resumeText));
  const keywords = [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 24)
    .map(([word]) => ({ word, matched: resumeWords.has(word) }));
  const matchedCount = keywords.filter((keyword) => keyword.matched).length;

  return {
    keywords,
    matchedCount,
    score: keywords.length ? Math.round((matchedCount / keywords.length) * 100) : 0,
  };
}

const SKILL_GROUPS = [
  "programming",
  "frameworks",
  "webTechnologies",
  "tools",
  "cloud",
  "ai",
  "databases",
];

export function getAtsAnalysis(jobDescription, resume, sourceText = "") {
  if (!jobDescription || !jobDescription.trim()) {
    return {
      score: 75,
      matchedKeywords: [],
      missingKeywords: [],
      recommendations: ["Paste a target job description to calculate live ATS keyword matching."],
      breakdown: { keywordScore: 75, skillScore: 80, experienceScore: 75, structureScore: 90 },
    };
  }

  const resumeText = `${sourceText} ${JSON.stringify(resume || {})}`;
  const keywordMatch = getKeywordMatch(jobDescription, resumeText);
  const matchedKeywords = keywordMatch.keywords.filter((item) => item.matched).map((item) => item.word);
  const missingKeywords = keywordMatch.keywords.filter((item) => !item.matched).map((item) => item.word);

  const skills = SKILL_GROUPS.flatMap((group) => resume?.skills?.[group] || []);
  const jobTerms = new Set(getTerms(jobDescription));
  const skillTerms = skills.flatMap(getTerms);
  const matchedSkills = new Set(skillTerms.filter((term) => jobTerms.has(term)));
  const skillScore = jobTerms.size
    ? Math.min(100, Math.round((matchedSkills.size / Math.max(Math.min(jobTerms.size, 5), 1)) * 100))
    : 0;

  const experienceText = JSON.stringify({
    experience: resume?.experience || [],
    projects: resume?.projects || [],
  });
  const relevantTerms = keywordMatch.keywords.map((item) => item.word);
  const experienceMatches = relevantTerms.filter((term) => getTerms(experienceText).includes(term)).length;
  const experienceScore = relevantTerms.length
    ? Math.round((experienceMatches / relevantTerms.length) * 100)
    : 0;

  const contentText = `${sourceText} ${JSON.stringify(resume || {})}`.toLowerCase();
  const structureChecks = [
    Boolean(resume?.personal?.email || /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(contentText)),
    Boolean(resume?.summary || /professional (profile|summary)|summary/i.test(contentText)),
    Boolean(resume?.experience?.length || /experience|career history/i.test(contentText)),
    skills.length > 0 || /\bskills\b/i.test(contentText),
    Boolean(resume?.education?.length || /\beducation\b/i.test(contentText)),
  ];

  const structureScore = Math.round(
    (structureChecks.filter(Boolean).length / structureChecks.length) * 100,
  );
  const score = Math.max(0, Math.min(100, Math.round(
    keywordMatch.score * 0.45 + skillScore * 0.25 + experienceScore * 0.2 + structureScore * 0.1,
  )));

  const recommendations = [];
  if (!resume?.summary) recommendations.push("Add a concise professional profile summary.");
  if (!resume?.experience?.length) recommendations.push("Include your career experience with quantifiable achievements.");
  if (!skills.length) recommendations.push("Categorize technical skills matching the job description.");
  if (missingKeywords.length) {
    recommendations.push(`Target missing keywords in your bullets: ${missingKeywords.slice(0, 6).join(", ")}`);
  }

  return {
    score,
    matchedKeywords,
    missingKeywords,
    recommendations,
    breakdown: {
      keywordScore: keywordMatch.score,
      skillScore,
      experienceScore,
      structureScore,
    },
  };
}

// ── Bi-directional Markdown Conversion ──
export function resumeToMarkdown(resume) {
  if (!resume) return "";
  const lines = [];
  const p = resume.personal || {};

  lines.push(`# ${p.name || "Untitled Resume"}`);
  if (p.title) lines.push(`**${p.title}**\n`);

  const contacts = [];
  if (p.phone) contacts.push(`- Phone: ${p.phone}`);
  if (p.email) contacts.push(`- Email: ${p.email}`);
  if (p.location) contacts.push(`- Location: ${p.location}`);
  if (p.linkedin) contacts.push(`- LinkedIn: ${p.linkedin}`);
  if (p.github) contacts.push(`- GitHub: ${p.github}`);
  if (p.portfolio) contacts.push(`- Portfolio: ${p.portfolio}`);
  if (contacts.length) lines.push(contacts.join("\n") + "\n");

  if (resume.summary) {
    lines.push(`## Professional Summary\n${resume.summary}\n`);
  }

  const skillEntries = Object.entries(resume.skills || {}).filter(([_, list]) => list && list.length);
  if (skillEntries.length) {
    lines.push("## Technical Skills");
    skillEntries.forEach(([category, list]) => {
      const cap = category.charAt(0).toUpperCase() + category.slice(1);
      lines.push(`- **${cap}:** ${list.join(", ")}`);
    });
    lines.push("");
  }

  if (resume.experience && resume.experience.length) {
    lines.push("## Experience");
    resume.experience.forEach((exp) => {
      lines.push(`### ${exp.role || "Role"} | ${exp.company || "Company"}`);
      const dates = [exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ");
      const meta = [dates, exp.location].filter(Boolean).join(" | ");
      if (meta) lines.push(`*${meta}*`);
      if (exp.bullets && exp.bullets.length) {
        exp.bullets.forEach((b) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  if (resume.education && resume.education.length) {
    lines.push("## Education");
    resume.education.forEach((edu) => {
      lines.push(`### ${edu.school || "Institution"}`);
      const degreeLine = [edu.degree, edu.field].filter(Boolean).join(" in ");
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      const meta = [degreeLine, dates, edu.gpa].filter(Boolean).join(" | ");
      if (meta) lines.push(`*${meta}*`);
      if (edu.bullets && edu.bullets.length) {
        edu.bullets.forEach((b) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  if (resume.projects && resume.projects.length) {
    lines.push("## Projects");
    resume.projects.forEach((proj) => {
      lines.push(`### ${proj.name || "Project"}`);
      const meta = [proj.role, proj.date].filter(Boolean).join(" | ");
      if (meta) lines.push(`*${meta}*`);
      if (proj.description) lines.push(proj.description);
      if (proj.techStack) lines.push(`**Technologies:** ${proj.techStack}`);
      if (proj.link) lines.push(`**Link:** ${proj.link}`);
      lines.push("");
    });
  }

  if (resume.certifications && resume.certifications.length) {
    lines.push("## Certifications");
    resume.certifications.forEach((c) => {
      if (typeof c === "string") {
        lines.push(`- ${c}`);
      } else {
        const meta = [c.issuer, c.date].filter(Boolean).join(", ");
        lines.push(`- **${c.name}**${meta ? ` (${meta})` : ""}`);
      }
    });
    lines.push("");
  }

  if (resume.languages && resume.languages.length) {
    lines.push("## Languages");
    resume.languages.forEach((l) => {
      if (typeof l === "string") {
        lines.push(`- ${l}`);
      } else {
        lines.push(`- **${l.name}**${l.level ? ` (${l.level})` : ""}`);
      }
    });
    lines.push("");
  }

  return lines.join("\n");
}

export function markdownToResume(markdownText, baseResume = {}) {
  const resume = JSON.parse(JSON.stringify(baseResume?.personal ? baseResume : DEFAULT_SANJAY_RESUME));
  if (!markdownText) return resume;

  const lines = markdownText.split("\n");
  let currentSection = "";
  let currentItem = null;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    if (line.startsWith("# ")) {
      resume.personal.name = line.replace("# ", "").trim();
      return;
    }

    if (!currentSection) {
      if (line.startsWith("**") && line.endsWith("**")) {
        resume.personal.title = line.replace(/\*\*/g, "").trim();
        return;
      }
      if (line.toLowerCase().startsWith("- email:")) {
        resume.personal.email = line.replace(/^-\s*email:\s*/i, "").trim();
        return;
      }
      if (line.toLowerCase().startsWith("- phone:")) {
        resume.personal.phone = line.replace(/^-\s*phone:\s*/i, "").trim();
        return;
      }
      if (line.toLowerCase().startsWith("- location:")) {
        resume.personal.location = line.replace(/^-\s*location:\s*/i, "").trim();
        return;
      }
      if (line.toLowerCase().startsWith("- portfolio:")) {
        resume.personal.portfolio = line.replace(/^-\s*portfolio:\s*/i, "").trim();
        return;
      }
      if (line.toLowerCase().startsWith("- linkedin:")) {
        resume.personal.linkedin = line.replace(/^-\s*linkedin:\s*/i, "").trim();
        return;
      }
      if (line.toLowerCase().startsWith("- github:")) {
        resume.personal.github = line.replace(/^-\s*github:\s*/i, "").trim();
        return;
      }
    }

    if (line.startsWith("## ")) {
      const heading = line.replace("## ", "").toLowerCase().trim();
      if (heading.includes("summary") || heading.includes("profile")) {
        currentSection = "summary";
        resume.summary = "";
      } else if (heading.includes("skill")) {
        currentSection = "skills";
      } else if (heading.includes("experience") || heading.includes("career")) {
        currentSection = "experience";
        resume.experience = [];
      } else if (heading.includes("education")) {
        currentSection = "education";
        resume.education = [];
      } else if (heading.includes("project")) {
        currentSection = "projects";
        resume.projects = [];
      } else if (heading.includes("certification")) {
        currentSection = "certifications";
        resume.certifications = [];
      } else if (heading.includes("language")) {
        currentSection = "languages";
        resume.languages = [];
      } else {
        currentSection = heading;
      }
      return;
    }

    if (currentSection === "summary") {
      resume.summary = (resume.summary ? resume.summary + " " : "") + line;
      return;
    }

    if (currentSection === "skills" && line.startsWith("- ")) {
      const content = line.replace("- ", "").trim();
      const match = content.match(/\*\*([^*]+):\*\*\s*(.+)/);
      if (match) {
        const catName = match[1].toLowerCase().replace(/\s+/g, "");
        const skillsList = match[2].split(",").map((s) => s.trim()).filter(Boolean);
        const groupKey = SKILL_GROUPS.find((g) => g.toLowerCase() === catName) || "webTechnologies";
        resume.skills[groupKey] = skillsList;
      }
      return;
    }

    if (currentSection === "experience") {
      if (line.startsWith("### ")) {
        const parts = line.replace("### ", "").split("|").map((s) => s.trim());
        currentItem = {
          role: parts[0] || "",
          company: parts[1] || "",
          startDate: "",
          endDate: "",
          current: false,
          location: "",
          bullets: [],
        };
        resume.experience.push(currentItem);
        return;
      }
      if (currentItem && line.startsWith("*") && line.endsWith("*")) {
        const meta = line.replace(/\*/g, "").split("|").map((s) => s.trim());
        if (meta[0]) {
          const dates = meta[0].split(/[–-]/).map((s) => s.trim());
          currentItem.startDate = dates[0] || "";
          currentItem.endDate = dates[1] || "";
          if (dates[1]?.toLowerCase() === "present") currentItem.current = true;
        }
        if (meta[1]) currentItem.location = meta[1];
        return;
      }
      if (currentItem && line.startsWith("- ")) {
        currentItem.bullets.push(line.replace("- ", "").trim());
        return;
      }
    }

    if (currentSection === "education") {
      if (line.startsWith("### ")) {
        currentItem = {
          school: line.replace("### ", "").trim(),
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          gpa: "",
          bullets: [],
        };
        resume.education.push(currentItem);
        return;
      }
      if (currentItem && line.startsWith("*") && line.endsWith("*")) {
        const meta = line.replace(/\*/g, "").split("|").map((s) => s.trim());
        if (meta[0]) {
          const degParts = meta[0].split(" in ").map((s) => s.trim());
          currentItem.degree = degParts[0] || "";
          currentItem.field = degParts[1] || "";
        }
        if (meta[1]) {
          const dates = meta[1].split(/[–-]/).map((s) => s.trim());
          currentItem.startDate = dates[0] || "";
          currentItem.endDate = dates[1] || "";
        }
        if (meta[2]) currentItem.gpa = meta[2];
        return;
      }
      if (currentItem && line.startsWith("- ")) {
        currentItem.bullets.push(line.replace("- ", "").trim());
        return;
      }
    }

    if (currentSection === "projects") {
      if (line.startsWith("### ")) {
        currentItem = {
          name: line.replace("### ", "").trim(),
          role: "",
          date: "",
          description: "",
          techStack: "",
          link: "",
        };
        resume.projects.push(currentItem);
        return;
      }
      if (currentItem && line.startsWith("*") && line.endsWith("*")) {
        const parts = line.replace(/\*/g, "").split("|").map((s) => s.trim());
        if (parts[0]) currentItem.role = parts[0];
        if (parts[1]) currentItem.date = parts[1];
        return;
      }
      if (currentItem) {
        if (line.startsWith("**Technologies:**")) {
          currentItem.techStack = line.replace("**Technologies:**", "").trim();
        } else if (line.startsWith("**Link:**")) {
          currentItem.link = line.replace("**Link:**", "").trim();
        } else {
          currentItem.description = (currentItem.description ? currentItem.description + " " : "") + line;
        }
        return;
      }
    }

    if (currentSection === "certifications" && line.startsWith("- ")) {
      const text = line.replace("- ", "").trim();
      resume.certifications.push(text);
      return;
    }

    if (currentSection === "languages" && line.startsWith("- ")) {
      const text = line.replace("- ", "").trim();
      resume.languages.push(text);
      return;
    }

    // Contact info matching
    if (line.toLowerCase().includes("phone:")) resume.personal.phone = line.split(/phone:/i)[1]?.trim();
    if (line.toLowerCase().includes("email:")) resume.personal.email = line.split(/email:/i)[1]?.trim();
    if (line.toLowerCase().includes("location:")) resume.personal.location = line.split(/location:/i)[1]?.trim();
    if (line.toLowerCase().includes("linkedin:")) resume.personal.linkedin = line.split(/linkedin:/i)[1]?.trim();
    if (line.toLowerCase().includes("github:")) resume.personal.github = line.split(/github:/i)[1]?.trim();
    if (line.toLowerCase().includes("portfolio:")) resume.personal.portfolio = line.split(/portfolio:/i)[1]?.trim();
    if (line.startsWith("**") && line.endsWith("**") && !resume.personal.title) {
      resume.personal.title = line.replace(/\*\*/g, "").trim();
    }
  });

  return resume;
}

// ── AI Bullet Polisher (Action-Verb + Impact Formula) ──
const POWER_VERBS = [
  "Spearheaded",
  "Architected",
  "Orchestrated",
  "Engineered",
  "Optimized",
  "Automated",
  "Pioneered",
  "Streamlined",
  "Delivered",
  "Revamped",
];

export function polishBullet(bullet) {
  if (!bullet || !bullet.trim()) return bullet;
  let text = bullet.trim();

  // Strip leading bullet dash or asterisk
  text = text.replace(/^[-*•]\s*/, "");

  const weakStarters = [
    /^(i\s+)?(worked on|helped with|responsible for|assisted in|participated in|was involved in)\s+/i,
    /^(i\s+)?(handled|managed|created|made|did|built)\s+/i,
  ];

  let replaced = false;
  for (const regex of weakStarters) {
    if (regex.test(text)) {
      const verb = POWER_VERBS[Math.floor(Math.random() * POWER_VERBS.length)];
      text = text.replace(regex, `${verb} `);
      replaced = true;
      break;
    }
  }

  if (!replaced && !/^[A-Z][a-z]+ed\b/.test(text)) {
    const verb = POWER_VERBS[Math.floor(Math.random() * POWER_VERBS.length)];
    text = `${verb} ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }

  // Capitalize first letter and ensure terminating period
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text.endsWith(".")) text += ".";

  return text;
}

export function exportResumeJson(resume) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(resume, null, 2))}`;
  const downloadAnchor = document.createElement("a");
  const fileName = `${(resume.personal?.name || "resume").toLowerCase().replace(/\s+/g, "_")}_resume.json`;
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importResumeJson(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid resume JSON format.");
  }
  return {
    ...DEFAULT_SANJAY_RESUME,
    ...parsed,
    personal: { ...DEFAULT_SANJAY_RESUME.personal, ...(parsed.personal || parsed.basic || {}) },
    skills: { ...DEFAULT_SANJAY_RESUME.skills, ...(parsed.skills || {}) },
  };
}

export function getDraftFromStorage() {
  if (typeof window === "undefined") return DEFAULT_SANJAY_RESUME;
  try {
    const value = window.localStorage.getItem(RESUME_DRAFT_KEY);
    if (!value) return DEFAULT_SANJAY_RESUME;
    const parsed = JSON.parse(value);
    return parsed?.personal?.name ? parsed : DEFAULT_SANJAY_RESUME;
  } catch {
    return DEFAULT_SANJAY_RESUME;
  }
}

export function saveDraftToStorage(resume) {
  if (typeof window === "undefined" || !resume) return;
  try {
    window.localStorage.setItem(RESUME_DRAFT_KEY, JSON.stringify(resume));
  } catch (err) {
    console.warn("Could not save resume draft:", err);
  }
}

export function validateGeneratedResume(resume) {
  const isStringArray = (value) => Array.isArray(value)
    && value.every((item) => typeof item === "string");
  const isObjectArray = (value, requiredStringFields, arrayFields = []) => (
    Array.isArray(value)
    && value.every((item) => (
      item
      && typeof item === "object"
      && requiredStringFields.every((field) => typeof item[field] === "string")
      && arrayFields.every((field) => isStringArray(item[field]))
    ))
  );

  return Boolean(
    resume
    && typeof resume === "object"
    && resume.personal
    && [
      "name", "title", "phone", "email", "location", "linkedin", "github", "portfolio",
    ].every((field) => typeof resume.personal[field] === "string")
    && typeof resume.summary === "string"
    && resume.skills
    && SKILL_GROUPS.every((group) => isStringArray(resume.skills[group]))
    && isObjectArray(
      resume.experience,
      ["company", "role", "location", "startDate", "endDate"],
      ["bullets"],
    )
    && isObjectArray(
      resume.projects,
      ["name", "description", "role"],
      ["technologies", "bullets"],
    )
    && isObjectArray(
      resume.education,
      ["degree", "institution", "location", "startDate", "endDate"],
    )
    && isStringArray(resume.achievements)
    && isStringArray(resume.certifications)
    && isStringArray(resume.languages),
  );
}

export async function generateResumeWithGemini({
  apiKey,
  resumeText,
  resumeImage,
  jobDescription,
  details,
}) {
  const prompt = `You are an expert technical resume writer and ATS optimization specialist.
Use candidate details and the existing resume as sources of truth, and tailor emphasis to the job description.

Rules:
- Read the uploaded resume image carefully when one is provided. Extract the candidate's name, contact details, skills, employment, projects, education, and achievements into the supplied schema.
- If no target job description is provided, extract and organize the resume faithfully without tailoring it to an assumed role.
- Never invent experience, companies, job titles, technologies, certifications, education, achievements, dates, or metrics.
- Include a job-description skill or keyword only when it is explicitly supported by the resume, candidate details, or supplied manual resume content. Never claim a skill just to raise an ATS score.
- Identify transferable skills only when concrete source evidence supports them; include those skills and matching job-description language in the relevant resume section.
- Rephrase supported content for clarity, concise impact, and relevant terminology without changing facts or overstating results.
- Preserve the original meaning of accomplishments and keep metrics exactly as supplied.
- Separate each employer, project, degree, award, certification, and language into its own item.
- Omit unsupported data using empty strings or empty arrays.
- Return JSON that exactly follows the supplied schema. Do not return Markdown, HTML, or CSS.

Candidate details and any manually entered resume content:
${JSON.stringify(details)}

Existing resume text (source of truth, if provided):
${resumeText || "(Resume is provided as an image.)"}

Target job description:
${jobDescription || "(No target job description provided. Extract and organize the resume without targeting a role.)"}`;
  const parts = [{ text: prompt }];
  if (resumeImage) parts.push(resumeImage);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts,
        }],
      }),
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.error?.message || `Gemini request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  const text = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");
  if (!text) throw new Error("Gemini returned no resume content. Try again.");
  try {
    const resume = JSON.parse(text);
    return resume;
  } catch {
    throw new Error("Gemini returned an invalid resume format. Try again.");
  }
}


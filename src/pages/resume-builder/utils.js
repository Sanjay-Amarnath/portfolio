export const RESUME_DRAFT_KEY = "portfolio-resume-builder-draft";
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
    personal: {
      name: details.name || "",
      title: details.title || "",
      phone: details.phone || "",
      email: details.email || "",
      location: details.location || "",
      linkedin: details.linkedin || "",
      github: details.github || "",
      portfolio: details.portfolio || "",
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
    achievements: [],
    certifications: [],
    languages: [],
  };
}

const STOP_WORDS = new Set(
  `a an and are as at be been being by can did do does for from had has have he her hers him his i if in into is it its may me my of on or our ours position required requirement requiring role she should so than that the their theirs them they this those through to was we were what when where which who will with would you your yours`.split(" "),
);

function getTerms(text) {
  const matches = text.toLowerCase().match(/[a-z][a-z0-9+#.-]*/g) || [];
  return matches
    .flatMap((match) => match.split(/[.-]/))
    .filter((word) => word.length >= 3 || ["c#", "c++", "go"].includes(word));
}

export async function extractResumeText(file) {
  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new Error("Choose a resume file smaller than 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  let text;

  if (extension === "txt") {
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
    throw new Error("Choose a PDF, DOCX, or TXT file.");
  }

  const cleanedText = text.split(String.fromCharCode(0)).join("").trim();
  if (!cleanedText) {
    throw new Error("No readable text was found. For a scanned resume, upload a JPG, PNG, or WEBP image and use Gemini.");
  }
  if (cleanedText.length > MAX_RESUME_TEXT_LENGTH) {
    throw new Error("The extracted resume is too long. Keep it under 100,000 characters.");
  }
  return cleanedText;
}

export function getKeywordMatch(jobDescription, resumeText) {
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
    .slice(0, 20)
    .map(([word]) => ({ word, matched: resumeWords.has(word) }));
  const matchedCount = keywords.filter((keyword) => keyword.matched).length;

  return {
    keywords,
    matchedCount,
    score: keywords.length
      ? Math.round((matchedCount / keywords.length) * 100)
      : 0,
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
  const resumeText = `${sourceText} ${JSON.stringify(resume || {})}`;
  const keywordMatch = getKeywordMatch(jobDescription, resumeText);
  const matchedKeywords = keywordMatch.keywords
    .filter((item) => item.matched)
    .map((item) => item.word);
  const missingKeywords = keywordMatch.keywords
    .filter((item) => !item.matched)
    .map((item) => item.word);

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
  const experienceMatches = relevantTerms.filter((term) => (
    getTerms(experienceText).includes(term)
  )).length;
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
    keywordMatch.score * 0.45
      + skillScore * 0.25
      + experienceScore * 0.2
      + structureScore * 0.1,
  )));

  const recommendations = [];
  if (!resume?.summary) recommendations.push("Add a concise professional profile.");
  if (!resume?.experience?.length) recommendations.push("Include your relevant career history.");
  if (!skills.length) recommendations.push("Add technical skills that match your actual experience.");
  if (missingKeywords.length) {
    recommendations.push("Consider missing job terms only when they accurately reflect your experience.");
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

const RESUME_SCHEMA = {
  type: "OBJECT",
  properties: {
    personal: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        title: { type: "STRING" },
        phone: { type: "STRING" },
        email: { type: "STRING" },
        location: { type: "STRING" },
        linkedin: { type: "STRING" },
        github: { type: "STRING" },
        portfolio: { type: "STRING" },
      },
      required: ["name", "title", "phone", "email", "location", "linkedin", "github", "portfolio"],
    },
    summary: { type: "STRING" },
    skills: {
      type: "OBJECT",
      properties: Object.fromEntries(SKILL_GROUPS.map((group) => [
        group,
        { type: "ARRAY", items: { type: "STRING" } },
      ])),
      required: SKILL_GROUPS,
    },
    experience: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          role: { type: "STRING" },
          location: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
          current: { type: "BOOLEAN" },
          bullets: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["company", "role", "location", "startDate", "endDate", "current", "bullets"],
      },
    },
    projects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          role: { type: "STRING" },
          technologies: { type: "ARRAY", items: { type: "STRING" } },
          bullets: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["name", "description", "role", "technologies", "bullets"],
      },
    },
    education: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          degree: { type: "STRING" },
          institution: { type: "STRING" },
          location: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
        },
        required: ["degree", "institution", "location", "startDate", "endDate"],
      },
    },
    achievements: { type: "ARRAY", items: { type: "STRING" } },
    certifications: { type: "ARRAY", items: { type: "STRING" } },
    languages: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "personal",
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "achievements",
    "certifications",
    "languages",
  ],
};

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
    && resume.experience.every((item) => typeof item.current === "boolean")
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
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESUME_SCHEMA,
        },
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
    if (!validateGeneratedResume(resume)) {
      throw new Error("Gemini returned an invalid resume format. Try again.");
    }
    return resume;
  } catch {
    throw new Error("Gemini returned an invalid resume format. Try again.");
  }
}

export function getDraftFromStorage() {
  try {
    const value = window.localStorage.getItem(RESUME_DRAFT_KEY);
    if (!value) return null;
    const draft = JSON.parse(value);
    if (!draft || typeof draft !== "object") {
      throw new Error("Saved draft has an invalid format.");
    }
    const isCurrentVersion = draft.version === 3;
    return {
      details: draft.details,
      resumeText: typeof draft.resumeText === "string" ? draft.resumeText : "",
      jobDescription: typeof draft.jobDescription === "string" ? draft.jobDescription : "",
      generatedResume: (isCurrentVersion || draft.version === 2)
        && validateGeneratedResume(draft.generatedResume)
        ? draft.generatedResume
        : null,
      manualResume: isCurrentVersion && validateGeneratedResume(draft.manualResume)
        ? draft.manualResume
        : null,
      migrated: !isCurrentVersion,
    };
  } catch (error) {
    console.error("Could not load the saved resume draft:", error);
    return { storageError: "Could not read the saved draft from this browser." };
  }
}

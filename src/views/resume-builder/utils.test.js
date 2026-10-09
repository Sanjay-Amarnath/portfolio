import {
  createGeminiImagePart,
  generateResumeWithGemini,
  getAtsAnalysis,
  getKeywordMatch,
  validateGeneratedResume,
} from "./utils";

test("estimates job keyword coverage without matching substrings", () => {
  const result = getKeywordMatch(
    "React React JavaScript TypeScript",
    "React developer with JavaScript experience",
  );

  expect(result).toEqual({
    keywords: [
      { word: "react", matched: true },
      { word: "javascript", matched: true },
      { word: "typescript", matched: false },
    ],
    matchedCount: 2,
    score: 67,
  });
});

test("returns no score when no job keywords are available", () => {
  expect(getKeywordMatch("and the role", "Experienced developer")).toEqual({
    keywords: [],
    matchedCount: 0,
    score: 0,
  });
});

test("encodes supported resume images for Gemini inline image input", async () => {
  const bytes = new Uint8Array([137, 80, 78, 71]);
  const imagePart = await createGeminiImagePart({
    name: "resume.png",
    type: "image/png",
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer,
  });

  expect(imagePart).toEqual({
    inlineData: {
      mimeType: "image/png",
      data: window.btoa(String.fromCharCode(...bytes)),
    },
  });
});

test("rejects unsupported image types before sending them to Gemini", async () => {
  await expect(createGeminiImagePart({
    name: "resume.gif",
    type: "image/gif",
    size: 10,
    arrayBuffer: async () => new ArrayBuffer(10),
  })).rejects.toThrow("Choose a JPG, PNG, or WEBP resume image.");
});

test("calculates a weighted ATS estimate and separates matched terms", () => {
  const result = getAtsAnalysis(
    "React Redux TypeScript",
    {
      personal: { email: "candidate@example.com" },
      summary: "Experienced frontend engineer",
      skills: {
        programming: ["TypeScript"],
        frameworks: ["React", "Redux"],
      },
      experience: [{
        company: "Example",
        role: "Frontend Engineer",
        bullets: ["Built React interfaces"],
      }],
      projects: [],
      education: [{ degree: "BS", institution: "Example University" }],
    },
  );

  expect(result.matchedKeywords).toEqual(["react", "redux", "typescript"]);
  expect(result.missingKeywords).toEqual([]);
  expect(result.breakdown.structureScore).toBe(100);
  expect(result.score).toBeGreaterThan(0);
  expect(result.score).toBeLessThanOrEqual(100);
});

test("accepts structured resume content and rejects unstructured AI output", () => {
  const resume = {
    personal: {
      name: "Sanjay",
      title: "Engineer",
      phone: "",
      email: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "Frontend engineer",
    skills: {
      programming: ["JavaScript"],
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

  expect(validateGeneratedResume(resume)).toBe(true);
  expect(validateGeneratedResume({ headline: "A paragraph only" })).toBe(false);
});

test("sends an uploaded resume image to Gemini with source-grounding instructions", async () => {
  const resume = {
    personal: {
      name: "Sanjay",
      title: "",
      phone: "",
      email: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "",
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
  const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(resume) }] } }],
    }),
  });

  try {
    await generateResumeWithGemini({
      apiKey: "test-key",
      resumeText: "",
      resumeImage: { inlineData: { mimeType: "image/png", data: "aW1hZ2U=" } },
      jobDescription: "",
      details: {},
    });
    const request = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(request.contents[0].parts[1]).toEqual({
      inlineData: { mimeType: "image/png", data: "aW1hZ2U=" },
    });
    expect(request.contents[0].parts[0].text).toContain("Never claim a skill just to raise an ATS score");
    expect(request.contents[0].parts[0].text).toContain("No target job description provided");
  } finally {
    fetchSpy.mockRestore();
  }
});

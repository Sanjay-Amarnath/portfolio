"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyResume,
  createGeminiImagePart,
  extractResumeText,
  generateResumeWithGemini,
  getAtsAnalysis,
  getDraftFromStorage,
  MAX_RESUME_FILE_SIZE,
  MAX_RESUME_TEXT_LENGTH,
  RESUME_DRAFT_KEY,
} from "./utils";
import { downloadResumePdf } from "./downloadResumePdf";
import ResumeDocument from "./ResumeDocument";
import "./resume-builder.scss";

const DEFAULT_DETAILS = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  portfolio: "",
};

const SKILL_EDITOR_GROUPS = [
  ["programming", "Programming"],
  ["frameworks", "Frameworks"],
  ["webTechnologies", "Web technologies"],
  ["tools", "Tools"],
  ["cloud", "Cloud"],
  ["ai", "AI"],
  ["databases", "Databases"],
];
const PERSONAL_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "location",
  "linkedin",
  "github",
  "portfolio",
]);

function ResumeBuilder() {
  const initialDraft = useMemo(() => getDraftFromStorage(), []);
  const [details, setDetails] = useState({ ...DEFAULT_DETAILS, ...initialDraft?.details });
  const [manualResume, setManualResume] = useState(
    initialDraft?.manualResume || createEmptyResume(initialDraft?.details),
  );
  const [resumeText, setResumeText] = useState(initialDraft?.resumeText || "");
  const [jobDescription, setJobDescription] = useState(initialDraft?.jobDescription || "");
  const [generatedResume, setGeneratedResume] = useState(initialDraft?.generatedResume || null);
  const [saveDraft, setSaveDraft] = useState(Boolean(
    initialDraft && !initialDraft.storageError && !initialDraft.migrated,
  ));
  const [apiKey, setApiKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [resumeImage, setResumeImage] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(initialDraft?.storageError || "");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Resume Lab | Sanjay Amarnath";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const ats = useMemo(
    () => getAtsAnalysis(jobDescription, generatedResume || manualResume),
    [generatedResume, jobDescription, manualResume],
  );

  useEffect(() => {
    if (!saveDraft) {
      try {
        window.localStorage.removeItem(RESUME_DRAFT_KEY);
      } catch (storageError) {
        setError(`Could not remove the saved draft from this browser: ${storageError.message}`);
      }
      return;
    }
    try {
      window.localStorage.setItem(RESUME_DRAFT_KEY, JSON.stringify({
        version: 3,
        details,
        manualResume,
        resumeText,
        jobDescription,
        generatedResume,
      }));
    } catch (storageError) {
      setError(`Could not save this draft in your browser: ${storageError.message}`);
      setSaveDraft(false);
    }
  }, [details, generatedResume, jobDescription, manualResume, resumeText, saveDraft]);

  const updateDetails = (event) => {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
    if (PERSONAL_FIELDS.has(name)) {
      setManualResume((current) => ({
        ...current,
        personal: { ...current.personal, [name]: value },
      }));
      setGeneratedResume((current) => current ? ({
        ...current,
        personal: { ...current.personal, [name]: value },
      }) : current);
    }
    setError("");
  };

  const handleFileSelection = async (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!["pdf", "docx", "txt", ...imageExtensions].includes(extension)) {
      setError("Choose a PDF, DOCX, TXT, JPG, PNG, or WEBP resume.");
      return;
    }
    if (file.size > MAX_RESUME_FILE_SIZE) {
      setError("Choose a resume file smaller than 5 MB.");
      return;
    }

    setIsReading(true);
    setError("");
    setNotice("");
    setGeneratedResume(null);
    setResumeText("");
    setResumeImage(null);
    setFileName("");
    try {
      if (imageExtensions.includes(extension)) {
        const imagePart = await createGeminiImagePart(file);
        setResumeImage(imagePart);
        setFileName(file.name);
        setNotice("Resume image ready. To fill the form, enter your Gemini API key below and choose Extract details with Gemini. The image is sent only after you choose that action.");
        return;
      }

      const text = await extractResumeText(file);
      setResumeText(text);
      setFileName(file.name);
      setNotice("Resume text extracted locally. To fill the form, enter your Gemini API key below and choose Extract details with Gemini. The resume is sent only after you choose that action.");
    } catch (readError) {
      setError(readError.message);
    } finally {
      setIsReading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    void handleFileSelection(event.dataTransfer.files?.[0]);
  };

  const handleGenerate = async (requireJobDescription = true) => {
    setError("");
    setNotice("");
    if (!resumeText.trim() && !resumeImage) {
      setError("Add a resume file or paste your resume text first.");
      return;
    }
    if (requireJobDescription && !jobDescription.trim()) {
      setError("Paste the job description you want to target.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Enter your own Gemini API key to generate a tailored resume.");
      return;
    }
    const sourceText = `${resumeText}\n${JSON.stringify(details)}\n${JSON.stringify(manualResume)}`;
    if (sourceText.length + jobDescription.length > 45000) {
      setError("Resume and job description together must be under 45,000 characters for this request.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateResumeWithGemini({
        apiKey: apiKey.trim(),
        resumeText: sourceText,
        resumeImage,
        jobDescription,
        details,
      });
      result.personal = {
        ...result.personal,
        name: result.personal.name || details.name,
        phone: result.personal.phone || details.phone,
        email: result.personal.email || details.email,
        location: result.personal.location || details.location,
        linkedin: result.personal.linkedin || details.linkedin,
        github: result.personal.github || details.github,
        portfolio: result.personal.portfolio || details.portfolio,
      };
      setGeneratedResume(result);
      setDetails((current) => ({
        ...current,
        name: result.personal.name,
        email: result.personal.email,
        phone: result.personal.phone,
        location: result.personal.location,
        linkedin: result.personal.linkedin,
        github: result.personal.github,
        portfolio: result.personal.portfolio,
      }));
      setNotice(jobDescription.trim()
        ? "Resume details extracted and tailored. Review every detail for accuracy before using it."
        : "Resume details extracted into the form. Add a job description and generate a tailored version when ready.");
    } catch (generationError) {
      setError(`Could not generate the resume: ${generationError.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(RESUME_DRAFT_KEY);
      setSaveDraft(false);
      setDetails(DEFAULT_DETAILS);
      setResumeText("");
      setResumeImage(null);
      setJobDescription("");
      setGeneratedResume(null);
      setManualResume(createEmptyResume());
      setFileName("");
      setError("");
      setNotice("Draft cleared from this browser.");
      if (fileInput.current) fileInput.current.value = "";
    } catch (clearError) {
      setError(`Could not clear the saved draft: ${clearError.message}`);
    }
  };

  const addFiles = (event) => {
    const file = event.target.files?.[0];
    void handleFileSelection(file);
    event.target.value = "";
  };

  const renderedResume = generatedResume || manualResume;
  const hasResumeData = Boolean(
    renderedResume.personal.name
    || renderedResume.personal.title
    || renderedResume.personal.email
    || renderedResume.personal.phone
    || renderedResume.summary
    || Object.values(renderedResume.skills).some((items) => items.length)
    || renderedResume.experience.length
    || renderedResume.projects.length
    || renderedResume.education.length
    || renderedResume.achievements.length
    || renderedResume.certifications.length
    || renderedResume.languages.length,
  );
  const handleManualField = (field, value) => {
    setManualResume((current) => ({ ...current, [field]: value }));
    setGeneratedResume(null);
  };
  const handleManualPersonal = (field, value) => {
    setManualResume((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
    setGeneratedResume(null);
  };
  const handleManualSkill = (group, value) => {
    setManualResume((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [group]: value.split(",").map((item) => item.trim()).filter(Boolean),
      },
    }));
    setGeneratedResume(null);
  };
  const handleManualEntry = (section, index, field, value, list = false) => {
    setManualResume((current) => ({
      ...current,
      [section]: current[section].map((entry, entryIndex) => (
        entryIndex === index
          ? {
            ...entry,
            [field]: list
              ? value.split("\n").map((item) => item.trim()).filter(Boolean)
              : value,
          }
          : entry
      )),
    }));
    setGeneratedResume(null);
  };
  const addManualEntry = (section, entry) => {
    setManualResume((current) => ({ ...current, [section]: [...current[section], entry] }));
    setGeneratedResume(null);
  };
  const removeManualEntry = (section, index) => {
    setManualResume((current) => ({
      ...current,
      [section]: current[section].filter((_, entryIndex) => entryIndex !== index),
    }));
    setGeneratedResume(null);
  };
  const handleDownloadPdf = async () => {
    setError("");
    setNotice("");
    setIsDownloading(true);
    try {
      await downloadResumePdf(
        renderedResume,
        `${renderedResume.personal.name || "resume"}.pdf`,
      );
      setNotice("Your resume PDF is ready. Check your browser's downloads.");
    } catch (downloadError) {
      setError(`Could not create the PDF: ${downloadError.message}`);
    } finally {
      setIsDownloading(false);
    }
  };
  const updateResumeField = (field, value) => {
    setGeneratedResume((current) => ({ ...current, [field]: value }));
  };
  const updatePersonalField = (field, value) => {
    setGeneratedResume((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
  };
  const updateSkillGroup = (group, value) => {
    setGeneratedResume((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [group]: value.split(",").map((item) => item.trim()).filter(Boolean),
      },
    }));
  };
  const updateEntryField = (section, index, field, value) => {
    setGeneratedResume((current) => ({
      ...current,
      [section]: current[section].map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, [field]: value } : entry
      )),
    }));
  };
  const updateEntryList = (section, index, field, value) => {
    updateEntryField(
      section,
      index,
      field,
      value.split("\n").map((item) => item.trim()).filter(Boolean),
    );
  };
  const updateResumeList = (field, value) => {
    updateResumeField(field, value.split("\n").map((item) => item.trim()).filter(Boolean));
  };

  return (
    <main className="resume-builder">
      <header className="builder-topbar">
        <a className="builder-brand" href="/" aria-label="Back to Sanjay Amarnath portfolio">
          <span className="builder-brand-mark">S.</span>
          <span>FIELD NOTES <small>CAREER TOOLKIT</small></span>
        </a>
        <a className="builder-back-link" href="/">Back to portfolio <span aria-hidden="true">↗</span></a>
      </header>

      <section className="builder-heading">
        <p className="builder-kicker"><span>01</span> THE CAREER NAVIGATOR</p>
        <h1>Make your next move <em>count.</em></h1>
        <p>Shape a clear, role-specific resume from your real experience. Your file stays in this browser unless you choose to send it to Gemini for tailoring.</p>
      </section>

      <div className="builder-notice" role="note">
        <span aria-hidden="true">◈</span>
        <p><strong>Private by default.</strong> Text resumes are read on this device. Nothing is sent to AI until you choose Generate; then your resume text or selected image and job description go directly to Google Gemini using your key.</p>
      </div>

      {(error || notice) && (
        <div className={`builder-feedback ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>
          {error || notice}
        </div>
      )}

      <div className="builder-workspace">
        <div className="builder-controls">
          <section className="builder-panel">
            <div className="builder-panel-heading">
              <span className="builder-step">01</span>
              <div><h2>Your details</h2><p>Fill these in to begin; the resume preview updates as you type.</p></div>
            </div>
            <div className="builder-fields">
              {[
                ["name", "Full name", "Sanjay Amarnath"],
                ["email", "Email", "you@example.com"],
                ["phone", "Phone", "+1 555 000 0000"],
                ["location", "Location", "City, Country"],
                ["linkedin", "LinkedIn", "linkedin.com/in/you"],
                ["github", "GitHub", "github.com/you"],
                ["portfolio", "Portfolio", "yourportfolio.com"],
              ].map(([name, label, placeholder]) => (
                <label className={name === "name" ? "builder-field builder-field-wide" : "builder-field"} key={name}>
                  <span>{label}</span>
                  <input name={name} value={details[name] || ""} onChange={updateDetails} placeholder={placeholder} />
                </label>
              ))}
            </div>
          </section>

          {!generatedResume && (
            <section className="builder-panel builder-manual-editor">
              <div className="builder-panel-heading">
                <span className="builder-step">02</span>
                <div><h2>Build your resume</h2><p>Enter your information below; the preview updates as you type. AI is optional.</p></div>
              </div>
              <label className="builder-text-label" htmlFor="manual-title">Professional title</label>
              <input
                id="manual-title"
                className="builder-key-input"
                value={manualResume.personal.title}
                onChange={(event) => handleManualPersonal("title", event.target.value)}
                placeholder="Frontend Developer"
              />
              <label className="builder-text-label" htmlFor="manual-summary">Professional profile</label>
              <textarea
                id="manual-summary"
                className="builder-textarea"
                rows={4}
                value={manualResume.summary}
                onChange={(event) => handleManualField("summary", event.target.value)}
                placeholder="Summarize your experience and strengths."
              />
              <p className="builder-editor-subtitle">Technical expertise · comma-separated</p>
              {SKILL_EDITOR_GROUPS.map(([group, label]) => (
                <label className="builder-editor-field" key={group}>
                  <span>{label}</span>
                  <input
                    value={manualResume.skills[group].join(", ")}
                    onChange={(event) => handleManualSkill(group, event.target.value)}
                    placeholder={`Add ${label.toLowerCase()}`}
                  />
                </label>
              ))}

              <div className="builder-manual-section">
                <div className="builder-manual-section-heading">
                  <h3>Career history</h3>
                  <button type="button" className="builder-add-button" onClick={() => addManualEntry("experience", {
                    company: "", role: "", location: "", startDate: "", endDate: "", current: false, bullets: [],
                  })}>+ Add experience</button>
                </div>
                {manualResume.experience.map((job, index) => (
                  <fieldset className="builder-editor-entry" key={`manual-experience-${index}`}>
                    <legend>Experience {index + 1}</legend>
                    <button type="button" className="builder-remove-button" onClick={() => removeManualEntry("experience", index)}>Remove</button>
                    <div className="builder-editor-grid">
                      {[
                        ["company", "Company"],
                        ["role", "Job title"],
                        ["location", "Location"],
                        ["startDate", "Start date"],
                        ["endDate", "End date"],
                      ].map(([field, label]) => (
                        <label className="builder-editor-field" key={field}>
                          <span>{label}</span>
                          <input
                            value={job[field]}
                            onChange={(event) => handleManualEntry("experience", index, field, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    <label className="builder-editor-field builder-current-role">
                      <input
                        type="checkbox"
                        checked={job.current}
                        onChange={(event) => handleManualEntry("experience", index, "current", event.target.checked)}
                      />
                      <span>Currently working here</span>
                    </label>
                    <label className="builder-editor-field">
                      <span>Achievements and responsibilities · one per line</span>
                      <textarea
                        rows={4}
                        value={job.bullets.join("\n")}
                        onChange={(event) => handleManualEntry("experience", index, "bullets", event.target.value, true)}
                        placeholder="Built reusable React components..."
                      />
                    </label>
                  </fieldset>
                ))}
              </div>

              <div className="builder-manual-section">
                <div className="builder-manual-section-heading">
                  <h3>Projects</h3>
                  <button type="button" className="builder-add-button" onClick={() => addManualEntry("projects", {
                    name: "", description: "", role: "", technologies: [], bullets: [],
                  })}>+ Add project</button>
                </div>
                {manualResume.projects.map((project, index) => (
                  <fieldset className="builder-editor-entry" key={`manual-project-${index}`}>
                    <legend>Project {index + 1}</legend>
                    <button type="button" className="builder-remove-button" onClick={() => removeManualEntry("projects", index)}>Remove</button>
                    {[
                      ["name", "Project name"],
                      ["role", "Your role"],
                      ["description", "Description"],
                    ].map(([field, label]) => (
                      <label className="builder-editor-field" key={field}>
                        <span>{label}</span>
                        <input
                          value={project[field]}
                          onChange={(event) => handleManualEntry("projects", index, field, event.target.value)}
                        />
                      </label>
                    ))}
                    <label className="builder-editor-field">
                      <span>Technologies · comma-separated</span>
                      <input
                        value={project.technologies.join(", ")}
                        onChange={(event) => handleManualEntry(
                          "projects",
                          index,
                          "technologies",
                          event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                        )}
                      />
                    </label>
                    <label className="builder-editor-field">
                      <span>Key contributions · one per line</span>
                      <textarea
                        rows={3}
                        value={project.bullets.join("\n")}
                        onChange={(event) => handleManualEntry("projects", index, "bullets", event.target.value, true)}
                      />
                    </label>
                  </fieldset>
                ))}
              </div>

              <div className="builder-manual-section">
                <div className="builder-manual-section-heading">
                  <h3>Education</h3>
                  <button type="button" className="builder-add-button" onClick={() => addManualEntry("education", {
                    degree: "", institution: "", location: "", startDate: "", endDate: "",
                  })}>+ Add education</button>
                </div>
                {manualResume.education.map((education, index) => (
                  <fieldset className="builder-editor-entry" key={`manual-education-${index}`}>
                    <legend>Education {index + 1}</legend>
                    <button type="button" className="builder-remove-button" onClick={() => removeManualEntry("education", index)}>Remove</button>
                    <div className="builder-editor-grid">
                      {[
                        ["degree", "Degree"],
                        ["institution", "Institution"],
                        ["location", "Location"],
                        ["startDate", "Start date"],
                        ["endDate", "End date"],
                      ].map(([field, label]) => (
                        <label className="builder-editor-field" key={field}>
                          <span>{label}</span>
                          <input
                            value={education[field]}
                            onChange={(event) => handleManualEntry("education", index, field, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              {[
                ["achievements", "Achievements · one per line"],
                ["certifications", "Certifications · one per line"],
                ["languages", "Languages · one per line"],
              ].map(([field, label]) => (
                <label className="builder-editor-field" key={field}>
                  <span>{label}</span>
                  <textarea
                    rows={3}
                    value={manualResume[field].join("\n")}
                    onChange={(event) => handleManualField(
                      field,
                      event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    )}
                  />
                </label>
              ))}
            </section>
          )}

          <section className="builder-panel">
            <div className="builder-panel-heading">
              <span className="builder-step">02</span>
              <div><h2>Start with your experience</h2><p>Upload a resume or paste its text below.</p></div>
            </div>
            <div
              className="builder-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <span className="builder-file-icon" aria-hidden="true">↥</span>
              <strong>{fileName || "Drop your resume here"}</strong>
              <span>PDF, DOCX, TXT, JPG, PNG, or WEBP · up to 5 MB</span>
              <button type="button" className="builder-secondary-button" onClick={() => fileInput.current?.click()} disabled={isReading}>
                {isReading ? "Reading resume…" : "Choose a file"}
              </button>
              <input ref={fileInput} className="builder-visually-hidden" type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,text/plain,image/jpeg,image/png,image/webp" onChange={addFiles} />
            </div>
            <label className="builder-text-label" htmlFor="resume-text">Resume text</label>
            <textarea
              id="resume-text"
              className="builder-textarea"
              value={resumeText}
              onChange={(event) => {
                setResumeText(event.target.value.slice(0, MAX_RESUME_TEXT_LENGTH));
                setGeneratedResume(null);
              }}
              maxLength={MAX_RESUME_TEXT_LENGTH}
              rows={8}
              placeholder="Paste your resume text here, or extract it from a file above."
            />
            <span className="builder-character-count">{resumeText.length.toLocaleString()} / 100,000 characters</span>
            <button
              className="builder-primary-button builder-extract-button"
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={isGenerating || isReading || (!resumeText.trim() && !resumeImage)}
            >
              {isGenerating ? "Extracting resume details…" : "Extract details with Gemini"}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="builder-key-note">Enter your Gemini API key in the AI panel below, then use this button to fill the personal details, skills, work history, projects, and education from your resume. A job description is optional for extraction.</p>
          </section>

          <section className="builder-panel">
            <div className="builder-panel-heading">
              <span className="builder-step">03</span>
              <div><h2>Target role</h2><p>Paste the job description to find relevant keywords.</p></div>
            </div>
            <label className="builder-text-label" htmlFor="job-description">Job description</label>
            <textarea
              id="job-description"
              className="builder-textarea"
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value.slice(0, MAX_RESUME_TEXT_LENGTH));
                setGeneratedResume(null);
              }}
              maxLength={MAX_RESUME_TEXT_LENGTH}
              rows={9}
              placeholder="Paste the role, responsibilities, and qualifications…"
            />
          </section>

          <section className="builder-panel builder-ai-panel">
            <div className="builder-panel-heading">
              <span className="builder-step">04</span>
              <div><h2>Tailor with AI</h2><p>Optional · uses your own Gemini API key.</p></div>
            </div>
            <label className="builder-text-label" htmlFor="gemini-key">Gemini API key</label>
            <input
              id="gemini-key"
              className="builder-key-input"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Paste your key for this session"
            />
            <p className="builder-key-note">Your key is kept in memory only, never saved or sent to this portfolio. Google receives your resume text or selected image and job description only when you explicitly select an extraction or generation action. Gemini rewrites only source-supported details and skills; it won’t invent qualifications to raise the ATS estimate. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get a Gemini key</a>.</p>
            <button className="builder-primary-button" type="button" onClick={() => handleGenerate(true)} disabled={isGenerating || isReading}>
              {isGenerating ? "Tailoring your resume…" : "Generate tailored draft"}
              <span aria-hidden="true">↗</span>
            </button>
          </section>

          {generatedResume && (
            <section className="builder-panel builder-editor">
              <div className="builder-panel-heading">
                <span className="builder-step">05</span>
                <div><h2>Review & edit the draft</h2><p>Make corrections before downloading. The preview updates as you edit.</p></div>
              </div>
              <label className="builder-text-label" htmlFor="edit-resume-title">Target title</label>
              <input
                id="edit-resume-title"
                className="builder-key-input"
                value={generatedResume.personal.title}
                onChange={(event) => updatePersonalField("title", event.target.value)}
              />
              <label className="builder-text-label" htmlFor="edit-resume-summary">Professional profile</label>
              <textarea
                id="edit-resume-summary"
                className="builder-textarea"
                rows={4}
                value={generatedResume.summary}
                onChange={(event) => updateResumeField("summary", event.target.value)}
              />
              <p className="builder-editor-subtitle">Technical expertise · comma-separated</p>
              {SKILL_EDITOR_GROUPS.map(([group, label]) => (
                <label className="builder-editor-field" key={group}>
                  <span>{label}</span>
                  <input
                    value={generatedResume.skills[group].join(", ")}
                    onChange={(event) => updateSkillGroup(group, event.target.value)}
                  />
                </label>
              ))}
              {generatedResume.experience.map((job, index) => (
                <fieldset className="builder-editor-entry" key={`experience-${index}`}>
                  <legend>Experience {index + 1}</legend>
                  <div className="builder-editor-grid">
                    {[
                      ["company", "Company"],
                      ["role", "Role"],
                      ["location", "Location"],
                      ["startDate", "Start date"],
                      ["endDate", "End date"],
                    ].map(([field, label]) => (
                      <label className="builder-editor-field" key={field}>
                        <span>{label}</span>
                        <input
                          value={job[field]}
                          onChange={(event) => updateEntryField("experience", index, field, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="builder-editor-field">
                    <span>Responsibilities and achievements · one per line</span>
                    <textarea
                      rows={4}
                      value={job.bullets.join("\n")}
                      onChange={(event) => updateEntryList("experience", index, "bullets", event.target.value)}
                    />
                  </label>
                </fieldset>
              ))}
              {generatedResume.projects.map((project, index) => (
                <fieldset className="builder-editor-entry" key={`project-${index}`}>
                  <legend>Project {index + 1}</legend>
                  {[
                    ["name", "Project name"],
                    ["role", "Role"],
                    ["description", "Description"],
                  ].map(([field, label]) => (
                    <label className="builder-editor-field" key={field}>
                      <span>{label}</span>
                      <input
                        value={project[field]}
                        onChange={(event) => updateEntryField("projects", index, field, event.target.value)}
                      />
                    </label>
                  ))}
                  {[
                    ["technologies", "Technologies · comma-separated"],
                    ["bullets", "Responsibilities · one per line"],
                  ].map(([field, label]) => (
                    <label className="builder-editor-field" key={field}>
                      <span>{label}</span>
                      <textarea
                        rows={3}
                        value={project[field].join(field === "technologies" ? ", " : "\n")}
                        onChange={(event) => updateEntryList(
                          "projects",
                          index,
                          field,
                          field === "technologies" ? event.target.value.replace(/,\s*/g, "\n") : event.target.value,
                        )}
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
              {generatedResume.education.map((education, index) => (
                <fieldset className="builder-editor-entry" key={`education-${index}`}>
                  <legend>Education {index + 1}</legend>
                  <div className="builder-editor-grid">
                    {[
                      ["degree", "Degree"],
                      ["institution", "Institution"],
                      ["location", "Location"],
                      ["startDate", "Start date"],
                      ["endDate", "End date"],
                    ].map(([field, label]) => (
                      <label className="builder-editor-field" key={field}>
                        <span>{label}</span>
                        <input
                          value={education[field]}
                          onChange={(event) => updateEntryField("education", index, field, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {[
                ["achievements", "Achievements · one per line"],
                ["certifications", "Certifications · one per line"],
                ["languages", "Languages · one per line"],
              ].map(([field, label]) => (
                <label className="builder-editor-field" key={field}>
                  <span>{label}</span>
                  <textarea
                    rows={3}
                    value={generatedResume[field].join("\n")}
                    onChange={(event) => updateResumeList(field, event.target.value)}
                  />
                </label>
              ))}
            </section>
          )}

          <section className="builder-save-panel">
            <label className="builder-save-toggle">
              <input type="checkbox" checked={saveDraft} onChange={(event) => setSaveDraft(event.target.checked)} />
              <span>Save draft in this browser</span>
            </label>
            <p>Includes extracted resume text, job description, and details. Never stored on our servers.</p>
            {saveDraft && <button type="button" className="builder-clear-button" onClick={clearDraft}>Clear saved draft</button>}
          </section>
        </div>

        <aside className="builder-results">
          <section className="builder-score-card">
            <div className="builder-result-heading">
              <div><p className="builder-kicker">ROLE ALIGNMENT</p><h2>ATS estimate</h2></div>
              <span className="builder-score">{ats.score}<small>/ 100</small></span>
            </div>
            <p className="builder-score-caption">
              {ats.score >= 95 ? "Excellent match" : ats.score >= 85 ? "Strong match" : ats.score >= 70 ? "Good match" : ats.score >= 50 ? "Fair match" : "Needs improvement"}
              {" · "}An estimate based on keywords, skills, experience, and structure—not a real ATS result.
            </p>
            <div className="builder-score-track" aria-label={`Estimated ATS match ${ats.score} out of 100`}><span style={{ width: `${ats.score}%` }} /></div>
            <div className="builder-ats-breakdown">
              {[
                ["Keyword match", ats.breakdown.keywordScore],
                ["Skills match", ats.breakdown.skillScore],
                ["Experience relevance", ats.breakdown.experienceScore],
                ["Resume structure", ats.breakdown.structureScore],
              ].map(([label, score]) => (
                <div key={label}><span>{label}</span><strong>{score}%</strong></div>
              ))}
            </div>
            <div className="builder-ats-columns">
              <div>
                <h3>Matched</h3>
                <p>{ats.matchedKeywords.length ? ats.matchedKeywords.join(", ") : "No matching terms yet."}</p>
              </div>
              <div>
                <h3>Missing / consider</h3>
                <p>{ats.missingKeywords.length ? ats.missingKeywords.join(", ") : "No missing terms detected."}</p>
              </div>
            </div>
            {ats.recommendations.length > 0 && (
              <ul className="builder-recommendations">
                {ats.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
              </ul>
            )}
            <p className="builder-integrity-note">Only include a missing keyword if it accurately reflects your real experience.</p>
          </section>

          <section className="builder-preview-section">
            <div className="builder-preview-toolbar">
              <div><p className="builder-kicker">LIVE DOCUMENT</p><h2>Resume preview</h2></div>
              <button className="builder-print-button" type="button" onClick={handleDownloadPdf} disabled={!hasResumeData || isDownloading}>
                {isDownloading ? "Creating PDF…" : "Download PDF"} <span aria-hidden="true">↓</span>
              </button>
            </div>
            <ResumeDocument resume={renderedResume} />
            <p className="builder-print-hint">Preview updates as you type. Download creates an A4 PDF directly in your browser.</p>
          </section>
        </aside>
      </div>

      <footer className="builder-footer">
        <span>MADE FOR THE NEXT CHAPTER</span>
        <a href="/">Return to Sanjay’s portfolio ↗</a>
      </footer>
    </main>
  );
}

export default ResumeBuilder;

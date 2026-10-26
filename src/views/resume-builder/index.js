"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SANJAY_RESUME,
  BLANK_RESUME,
  TEMPLATES,
  THEME_COLORS,
  FONT_FAMILIES,
} from "./constants";
import {
  extractResumeText,
  getAtsAnalysis,
  getDraftFromStorage,
  saveDraftToStorage,
  resumeToMarkdown,
  markdownToResume,
  exportResumeJson,
  importResumeJson,
  polishBullet,
} from "./utils";
import { downloadResumePdf } from "./downloadResumePdf";
import ResumeDocument from "./ResumeDocument";
import "./resume-builder.scss";

export default function ResumeBuilder() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("portfolio-theme");
    if (saved === "dark" || saved === "light") return saved;
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [resume, setResume] = useState(() => getDraftFromStorage());
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "markdown" | "design" | "ats"
  const [editorSection, setEditorSection] = useState("personal"); // "personal" | "summary" | "skills" | "experience" | "education" | "projects" | "extras"
  const [mobileView, setMobileView] = useState("editor"); // "editor" | "preview"
  const [scale, setScale] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [jobDescription, setJobDescription] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [notification, setNotification] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [skillsDraft, setSkillsDraft] = useState({});
  const [certsDraft, setCertsDraft] = useState(null);
  const [langsDraft, setLangsDraft] = useState(null);
  const fileInputRef = useRef(null);

  // Set document title and mark hydration
  useEffect(() => {
    setIsHydrated(true);
    const prev = document.title;
    document.title = "Resume Lab — Magic Resume Studio | Sanjay Amarnath";
    return () => {
      document.title = prev;
    };
  }, []);

  // Sync initial markdown
  useEffect(() => {
    setMarkdownText(resumeToMarkdown(resume));
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    saveDraftToStorage(resume);
  }, [resume]);

  // Show transient notification toast
  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // State updater with undo history
  const updateResume = (updater) => {
    setResume((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      setHistory((h) => [...h.slice(-20), prev]);
      setFuture([]);
      return next;
    });
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [resume, ...f]);
    setResume(prev);
    setMarkdownText(resumeToMarkdown(prev));
    showNotice("Action undone");
  };

  const handleRedo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, resume]);
    setResume(next);
    setMarkdownText(resumeToMarkdown(next));
    showNotice("Action redone");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("portfolio-theme", next);
      document.documentElement.style.colorScheme = next;
    }
  };

  // Load Preset Resume
  const loadPreset = (presetKey) => {
    if (presetKey === "blank") {
      updateResume(BLANK_RESUME);
      setMarkdownText(resumeToMarkdown(BLANK_RESUME));
      showNotice("Loaded blank resume template");
    } else {
      updateResume(DEFAULT_SANJAY_RESUME);
      setMarkdownText(resumeToMarkdown(DEFAULT_SANJAY_RESUME));
      showNotice("Loaded Sanjay Amarnath profile");
    }
  };

  // Markdown live sync
  const handleMarkdownChange = (newMd) => {
    setMarkdownText(newMd);
    try {
      const parsed = markdownToResume(newMd, resume);
      setResume(parsed);
    } catch {
      // keep editing safely
    }
  };

  // Print / PDF Export
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    showNotice("Generating PDF document...");
    try {
      await downloadResumePdf(resume);
      showNotice("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON / File
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const imported = importResumeJson(text);
        updateResume(imported);
        setMarkdownText(resumeToMarkdown(imported));
        showNotice("JSON resume imported successfully!");
      } else {
        showNotice("Extracting document text...");
        const extracted = await extractResumeText(file);
        setMarkdownText(extracted);
        const parsed = markdownToResume(extracted, resume);
        updateResume(parsed);
        showNotice("Document extracted and parsed!");
      }
    } catch (err) {
      showNotice(`Import error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ATS Analysis calculation
  const ats = useMemo(() => {
    return getAtsAnalysis(jobDescription, resume);
  }, [jobDescription, resume]);

  // Section Spacer & Page Break toolbar helper
  const renderSectionSpacerToolbar = (secKey, secLabel) => (
    <div className="section-spacer-toolbar" key={`spacer-bar-${secKey}`}>
      <button
        type="button"
        className={`break-page-toggle ${resume.sectionBreaks?.[secKey] ? "is-active" : ""}`}
        onClick={() => {
          const current = Boolean(resume.sectionBreaks?.[secKey]);
          updateResume((r) => ({
            ...r,
            sectionBreaks: { ...r.sectionBreaks, [secKey]: !current },
          }));
          showNotice(
            !current
              ? `Pushed ${secLabel} to start cleanly on next page!`
              : `Removed page break for ${secLabel}`
          );
        }}
        title="Force this section to start on the next A4 sheet"
      >
        <span>{resume.sectionBreaks?.[secKey] ? "✓ Starts on Next Page" : "📄 Break to Next Page"}</span>
      </button>
      <div className="section-spacer-group">
        <label>Top Spacing:</label>
        <input
          type="range"
          min={0}
          max={120}
          step={4}
          value={resume.sectionSpacers?.[secKey] || 0}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            updateResume((r) => ({
              ...r,
              sectionSpacers: { ...r.sectionSpacers, [secKey]: val },
            }));
          }}
        />
        <span>{resume.sectionSpacers?.[secKey] || 0}px</span>
      </div>
    </div>
  );

  return (
    <div className="portfolio-shell resume-studio-shell" data-theme={theme}>
      <div className="resume-builder-workspace" data-hydrated={isHydrated ? "true" : "false"}>
        {/* ── Top Command Bar ── */}
        <header className="resume-topbar">
          <div className="topbar-brand">
            <a href="/" className="back-home-link" aria-label="Return to portfolio">
              <span className="logo-monogram" aria-hidden="true">
                <span className="logo-mark-initial">S</span>
                <span className="logo-mark-period">.</span>
              </span>
              <span className="back-home-label">← Home</span>
            </a>
            <div className="brand-title-wrap">
              <h1 className="brand-title">Resume Lab</h1>
              <span className="brand-pill">Studio</span>
            </div>
          </div>

          <nav className="topbar-tabs" aria-label="Builder tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "editor" ? "is-active" : ""}`}
              onClick={() => setActiveTab("editor")}
            >
              Editor
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "design" ? "is-active" : ""}`}
              onClick={() => setActiveTab("design")}
            >
              Templates & Style
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "markdown" ? "is-active" : ""}`}
              onClick={() => {
                setMarkdownText(resumeToMarkdown(resume));
                setActiveTab("markdown");
              }}
            >
              Markdown
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "ats" ? "is-active" : ""}`}
              onClick={() => setActiveTab("ats")}
            >
              ATS Matcher
              {jobDescription && <span className="ats-badge">{ats.score}%</span>}
            </button>
          </nav>

          <div className="topbar-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
                  <path d="m16.5 3 .5 1.5 1.5.5-1.5.5-.5 1.5L16 5.5l-1.5-.5 1.5-.5.5-1.5Z" />
                </svg>
              )}
            </button>

            {/* Undo / Redo */}
            <div className="undo-redo-group">
              <button
                type="button"
                className="icon-action-btn"
                onClick={handleUndo}
                disabled={!history.length}
                title="Undo"
                aria-label="Undo last change"
              >
                ↺
              </button>
              <button
                type="button"
                className="icon-action-btn"
                onClick={handleRedo}
                disabled={!future.length}
                title="Redo"
                aria-label="Redo change"
              >
                ↻
              </button>
            </div>

            {/* Preset Selector */}
            <select
              className="preset-select"
              aria-label="Load preset resume"
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="sanjay"
            >
              <option value="sanjay">Sanjay Amarnath (Default)</option>
              <option value="blank">Blank Resume</option>
            </select>

            {/* Export / Import Menu */}
            <button
              type="button"
              className="secondary-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import JSON, PDF, DOCX or MD"
            >
              Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.pdf,.docx,.txt,.md"
              style={{ display: "none" }}
            />

            <button
              type="button"
              className="secondary-btn"
              onClick={() => exportResumeJson(resume)}
              title="Export JSON resume data"
            >
              Export JSON
            </button>

            <button
              type="button"
              className="secondary-btn download-pdf-btn"
              onClick={handleDownloadPdf}
              title="Download standalone PDF document"
              disabled={isExporting}
            >
              <span>{isExporting ? "Generating..." : "Download PDF"}</span>
            </button>

            <button
              type="button"
              className="primary-action-btn print-save-btn"
              onClick={handlePrint}
              title="Print or Save as PDF via browser"
            >
              <span>Print / Save PDF</span>
              <span aria-hidden="true">🖨️</span>
            </button>
          </div>
        </header>

      {/* ── Mobile View Toggle Bar ── */}
      <div className="mobile-view-bar">
        <button
          type="button"
          className={`mobile-view-btn ${mobileView === "editor" ? "is-active" : ""}`}
          onClick={() => setMobileView("editor")}
        >
          Workbench
        </button>
        <button
          type="button"
          className={`mobile-view-btn ${mobileView === "preview" ? "is-active" : ""}`}
          onClick={() => setMobileView("preview")}
        >
          Preview Canvas
        </button>
      </div>

      {/* ── Main Dual-Pane Workspace ── */}
      <main className="resume-main-layout">
        {/* ── LEFT PANE: CONTROLS & EDITORS ── */}
        <section className={`builder-controls-pane ${mobileView === "editor" ? "is-mobile-visible" : ""}`}>
          {/* TAB 1: VISUAL FORM EDITOR */}
          {activeTab === "editor" && (
            <div className="editor-tab-content">
              {/* Sub-navigation for Editor Sections */}
              <div className="editor-subnav">
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "personal" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("personal")}
                >
                  Basics
                </button>
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "summary" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("summary")}
                >
                  Summary
                </button>
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "experience" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("experience")}
                >
                  Experience ({resume.experience?.length || 0})
                </button>
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "skills" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("skills")}
                >
                  Skills
                </button>
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "education" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("education")}
                >
                  Education
                </button>
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "projects" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("projects")}
                >
                  Projects ({resume.projects?.length || 0})
                </button>
                <button
                  type="button"
                  className={`subnav-pill ${editorSection === "extras" ? "is-active" : ""}`}
                  onClick={() => setEditorSection("extras")}
                >
                  Certs & Lang
                </button>
              </div>

              {/* 1. Basics / Personal Section */}
              {editorSection === "personal" && (
                <div className="editor-card">
                  <h3 className="card-title">Personal Details & Contacts</h3>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="p-name">Full Name</label>
                      <input
                        id="p-name"
                        type="text"
                        value={resume.personal?.name || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, name: e.target.value },
                          }))
                        }
                        placeholder="e.g. Sanjay Amarnath"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-title">Headline / Title</label>
                      <input
                        id="p-title"
                        type="text"
                        value={resume.personal?.title || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, title: e.target.value },
                          }))
                        }
                        placeholder="e.g. Senior Frontend Engineer"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-email">Email</label>
                      <input
                        id="p-email"
                        type="email"
                        value={resume.personal?.email || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, email: e.target.value },
                          }))
                        }
                        placeholder="sanjay@example.com"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-phone">Phone Number</label>
                      <input
                        id="p-phone"
                        type="text"
                        value={resume.personal?.phone || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, phone: e.target.value },
                          }))
                        }
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-location">Location</label>
                      <input
                        id="p-location"
                        type="text"
                        value={resume.personal?.location || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, location: e.target.value },
                          }))
                        }
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-portfolio">Portfolio / Website</label>
                      <input
                        id="p-portfolio"
                        type="text"
                        value={resume.personal?.portfolio || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, portfolio: e.target.value },
                          }))
                        }
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-linkedin">LinkedIn URL</label>
                      <input
                        id="p-linkedin"
                        type="text"
                        value={resume.personal?.linkedin || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, linkedin: e.target.value },
                          }))
                        }
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="p-github">GitHub URL</label>
                      <input
                        id="p-github"
                        type="text"
                        value={resume.personal?.github || ""}
                        onChange={(e) =>
                          updateResume((r) => ({
                            ...r,
                            personal: { ...r.personal, github: e.target.value },
                          }))
                        }
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </div>

                  {/* Photo Configuration */}
                  <div className="photo-settings-card">
                    <div className="photo-header">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={resume.personal?.photoConfig?.visible !== false}
                          onChange={(e) =>
                            updateResume((r) => ({
                              ...r,
                              personal: {
                                ...r.personal,
                                photoConfig: { ...r.personal?.photoConfig, visible: e.target.checked },
                              },
                            }))
                          }
                        />
                        <span>Display Profile Photo</span>
                      </label>
                    </div>
                    {resume.personal?.photoConfig?.visible !== false && (
                      <div className="photo-controls-row">
                        <div className="input-group">
                          <label htmlFor="p-photo-url">Photo URL or Path</label>
                          <input
                            id="p-photo-url"
                            type="text"
                            value={resume.personal?.photo || ""}
                            onChange={(e) =>
                              updateResume((r) => ({
                                ...r,
                                personal: { ...r.personal, photo: e.target.value },
                              }))
                            }
                            placeholder="/images/sanjay.png"
                          />
                        </div>
                        <div className="input-group">
                          <label>Photo Shape</label>
                          <div className="shape-picker">
                            {["rounded", "circle", "square"].map((sh) => (
                              <button
                                key={sh}
                                type="button"
                                className={`shape-btn ${
                                  (resume.personal?.photoConfig?.shape || "rounded") === sh ? "is-selected" : ""
                                }`}
                                onClick={() =>
                                  updateResume((r) => ({
                                    ...r,
                                    personal: {
                                      ...r.personal,
                                      photoConfig: { ...r.personal?.photoConfig, shape: sh },
                                    },
                                  }))
                                }
                              >
                                {sh}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Professional Summary */}
              {editorSection === "summary" && (
                <div className="editor-card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Professional Summary</h3>
                    <button
                      type="button"
                      className="magic-polish-btn"
                      onClick={() => {
                        const polished = polishBullet(resume.summary);
                        updateResume((r) => ({ ...r, summary: polished }));
                        showNotice("Summary polished with active verbs!");
                      }}
                      title="Polish with action verbs"
                    >
                      ✨ Polish Summary
                    </button>
                  </div>
                  {renderSectionSpacerToolbar("summary", "Summary")}
                  <textarea
                    rows={6}
                    value={resume.summary || ""}
                    onChange={(e) => updateResume((r) => ({ ...r, summary: e.target.value }))}
                    placeholder="Brief 2-4 sentence summary of your career impact, key domains, and technical focus..."
                    className="styled-textarea"
                  />
                </div>
              )}

              {/* 3. Experience */}
              {editorSection === "experience" && (
                <div className="editor-card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Work Experience</h3>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() =>
                        updateResume((r) => ({
                          ...r,
                          experience: [
                            {
                              role: "Software Engineer",
                              company: "New Company",
                              location: "Remote",
                              startDate: "2023-01",
                              endDate: "Present",
                              current: true,
                              bullets: ["Engineered responsive features and improved team throughput by 20%."],
                            },
                            ...(r.experience || []),
                          ],
                        }))
                      }
                    >
                      + Add Role
                    </button>
                  </div>
                  {renderSectionSpacerToolbar("experience", "Career History")}

                  <div className="entries-list">
                    {(resume.experience || []).map((exp, expIdx) => (
                      <div key={expIdx} className="entry-card">
                        <div className="entry-card-header">
                          <span className="entry-counter">0{expIdx + 1}</span>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...resume.experience];
                              updated[expIdx].role = e.target.value;
                              updateResume({ experience: updated });
                            }}
                            className="entry-title-input"
                            placeholder="Role Title"
                          />
                          <button
                            type="button"
                            className="delete-entry-btn"
                            onClick={() => {
                              const updated = resume.experience.filter((_, i) => i !== expIdx);
                              updateResume({ experience: updated });
                            }}
                            title="Remove role"
                          >
                            ×
                          </button>
                        </div>

                        <div className="form-grid-3">
                          <div className="input-group">
                            <label>Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => {
                                const updated = [...resume.experience];
                                updated[expIdx].company = e.target.value;
                                updateResume({ experience: updated });
                              }}
                              placeholder="Company Name"
                            />
                          </div>
                          <div className="input-group">
                            <label>Location</label>
                            <input
                              type="text"
                              value={exp.location || ""}
                              onChange={(e) => {
                                const updated = [...resume.experience];
                                updated[expIdx].location = e.target.value;
                                updateResume({ experience: updated });
                              }}
                              placeholder="e.g. San Francisco or Remote"
                            />
                          </div>
                          <div className="input-group">
                            <label>Dates</label>
                            <div className="dates-row">
                              <input
                                type="text"
                                value={exp.startDate || ""}
                                onChange={(e) => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].startDate = e.target.value;
                                  updateResume({ experience: updated });
                                }}
                                placeholder="Start Date"
                              />
                              <span>–</span>
                              <input
                                type="text"
                                value={exp.current ? "Present" : exp.endDate || ""}
                                onChange={(e) => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].endDate = e.target.value;
                                  updateResume({ experience: updated });
                                }}
                                placeholder="End Date"
                                disabled={exp.current}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bullet Points */}
                        <div className="bullets-section">
                          <div className="bullets-header">
                            <label>Key Accomplishments / Responsibilities</label>
                            <button
                              type="button"
                              className="add-bullet-btn"
                              onClick={() => {
                                const updated = [...resume.experience];
                                updated[expIdx].bullets = [...(updated[expIdx].bullets || []), ""];
                                updateResume({ experience: updated });
                              }}
                            >
                              + Add Bullet
                            </button>
                          </div>

                          {(exp.bullets || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="bullet-row">
                              <span className="bullet-dot">•</span>
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].bullets[bIdx] = e.target.value;
                                  updateResume({ experience: updated });
                                }}
                                placeholder="Accomplished X, measured by Y, by doing Z..."
                              />
                              <button
                                type="button"
                                className="polish-chip-btn"
                                onClick={() => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].bullets[bIdx] = polishBullet(bullet);
                                  updateResume({ experience: updated });
                                  showNotice("Bullet enhanced with active power verbs!");
                                }}
                                title="Enhance bullet with active verbs"
                              >
                                ✨ Polish
                              </button>
                              <button
                                type="button"
                                className="remove-bullet-btn"
                                onClick={() => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].bullets = updated[expIdx].bullets.filter((_, i) => i !== bIdx);
                                  updateResume({ experience: updated });
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Skills */}
              {editorSection === "skills" && (
                <div className="editor-card">
                  <h3 className="card-title">Technical Skills & Categories</h3>
                  <p className="card-subtitle">
                    Enter technical skills separated by commas or add individual tags.
                  </p>
                  {renderSectionSpacerToolbar("skills", "Technical Skills")}
                  <div className="skills-editor-grid">
                    {Object.entries(resume.skills || {}).map(([category, list]) => {
                      const displayVal = skillsDraft[category] !== undefined
                        ? skillsDraft[category]
                        : (list || []).join(", ");
                      return (
                        <div key={category} className="skill-cat-row">
                          <label className="cat-label">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </label>
                          <input
                            type="text"
                            value={displayVal}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setSkillsDraft((prev) => ({ ...prev, [category]: raw }));
                              const updatedSkills = { ...resume.skills };
                              updatedSkills[category] = raw
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              updateResume({ skills: updatedSkills });
                            }}
                            onBlur={() => {
                              setSkillsDraft((prev) => {
                                const next = { ...prev };
                                delete next[category];
                                return next;
                              });
                            }}
                            placeholder="e.g. React, Next.js, TypeScript"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Education */}
              {editorSection === "education" && (
                <div className="editor-card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Education</h3>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() =>
                        updateResume((r) => ({
                          ...r,
                          education: [
                            ...(r.education || []),
                            {
                              school: "University / College",
                              degree: "Bachelor of Science",
                              field: "Computer Science",
                              startDate: "2018",
                              endDate: "2022",
                              gpa: "",
                              bullets: [],
                            },
                          ],
                        }))
                      }
                    >
                      + Add Degree
                    </button>
                  </div>
                  {renderSectionSpacerToolbar("education", "Education")}
                  <div className="entries-list">
                    {(resume.education || []).map((edu, eduIdx) => (
                      <div key={eduIdx} className="entry-card">
                        <div className="entry-card-header">
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => {
                              const updated = [...resume.education];
                              updated[eduIdx].school = e.target.value;
                              updateResume({ education: updated });
                            }}
                            className="entry-title-input"
                            placeholder="University / College"
                          />
                          <button
                            type="button"
                            className="delete-entry-btn"
                            onClick={() => {
                              const updated = resume.education.filter((_, i) => i !== eduIdx);
                              updateResume({ education: updated });
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <div className="form-grid-3">
                          <div className="input-group">
                            <label>Degree</label>
                            <input
                              type="text"
                              value={edu.degree || ""}
                              onChange={(e) => {
                                const updated = [...resume.education];
                                updated[eduIdx].degree = e.target.value;
                                updateResume({ education: updated });
                              }}
                              placeholder="Bachelor of Science"
                            />
                          </div>
                          <div className="input-group">
                            <label>Field of Study</label>
                            <input
                              type="text"
                              value={edu.field || ""}
                              onChange={(e) => {
                                const updated = [...resume.education];
                                updated[eduIdx].field = e.target.value;
                                updateResume({ education: updated });
                              }}
                              placeholder="Computer Science"
                            />
                          </div>
                          <div className="input-group">
                            <label>Dates & GPA</label>
                            <input
                              type="text"
                              value={[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}
                              onChange={(e) => {
                                const updated = [...resume.education];
                                const parts = e.target.value.split(/[–-]/).map((s) => s.trim());
                                updated[eduIdx].startDate = parts[0] || "";
                                updated[eduIdx].endDate = parts[1] || "";
                                updateResume({ education: updated });
                              }}
                              placeholder="2018 – 2022"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Projects */}
              {editorSection === "projects" && (
                <div className="editor-card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Projects & Builds</h3>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() =>
                        updateResume((r) => ({
                          ...r,
                          projects: [
                            ...(r.projects || []),
                            {
                              name: "New Project",
                              role: "Lead Developer",
                              date: "2024",
                              link: "https://github.com/...",
                              description: "A web application that simplifies complex workflows.",
                              techStack: "React, Next.js, Node.js",
                            },
                          ],
                        }))
                      }
                    >
                      + Add Project
                    </button>
                  </div>
                  {renderSectionSpacerToolbar("projects", "Projects")}
                  <div className="entries-list">
                    {(resume.projects || []).map((proj, pIdx) => (
                      <div key={pIdx} className="entry-card">
                        <div className="entry-card-header">
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => {
                              const updated = [...resume.projects];
                              updated[pIdx].name = e.target.value;
                              updateResume({ projects: updated });
                            }}
                            className="entry-title-input"
                            placeholder="Project Name"
                          />
                          <button
                            type="button"
                            className="delete-entry-btn"
                            onClick={() => {
                              const updated = resume.projects.filter((_, i) => i !== pIdx);
                              updateResume({ projects: updated });
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <div className="form-grid-2">
                          <div className="input-group">
                            <label>Role</label>
                            <input
                              type="text"
                              value={proj.role || ""}
                              onChange={(e) => {
                                const updated = [...resume.projects];
                                updated[pIdx].role = e.target.value;
                                updateResume({ projects: updated });
                              }}
                              placeholder="Role / Responsibility"
                            />
                          </div>
                          <div className="input-group">
                            <label>Live or GitHub Link</label>
                            <input
                              type="text"
                              value={proj.link || ""}
                              onChange={(e) => {
                                const updated = [...resume.projects];
                                updated[pIdx].link = e.target.value;
                                updateResume({ projects: updated });
                              }}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div className="input-group full-width">
                          <label>Description</label>
                          <textarea
                            rows={2}
                            value={proj.description || ""}
                            onChange={(e) => {
                              const updated = [...resume.projects];
                              updated[pIdx].description = e.target.value;
                              updateResume({ projects: updated });
                            }}
                            placeholder="Explain what the project does and the business / technical impact..."
                          />
                        </div>
                        <div className="input-group full-width">
                          <label>Technologies Used</label>
                          <input
                            type="text"
                            value={proj.techStack || ""}
                            onChange={(e) => {
                              const updated = [...resume.projects];
                              updated[pIdx].techStack = e.target.value;
                              updateResume({ projects: updated });
                            }}
                            placeholder="React, Next.js, Three.js, GSAP"
                          />
                        </div>

                        {/* Project Highlights / Bullets */}
                        <div className="bullets-section">
                          <div className="bullets-header">
                            <label>Key Accomplishments / Highlights</label>
                            <button
                              type="button"
                              className="add-bullet-btn"
                              onClick={() => {
                                const updated = [...resume.projects];
                                updated[pIdx].bullets = [...(updated[pIdx].bullets || []), ""];
                                updateResume({ projects: updated });
                              }}
                            >
                              + Add Highlight
                            </button>
                          </div>
                          {(proj.bullets || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="bullet-row">
                              <span className="bullet-dot">•</span>
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => {
                                  const updated = [...resume.projects];
                                  updated[pIdx].bullets[bIdx] = e.target.value;
                                  updateResume({ projects: updated });
                                }}
                                placeholder="Key achievement or metric for this build..."
                              />
                              <button
                                type="button"
                                className="polish-chip-btn"
                                onClick={() => {
                                  const updated = [...resume.projects];
                                  updated[pIdx].bullets[bIdx] = polishBullet(bullet);
                                  updateResume({ projects: updated });
                                  showNotice("Project highlight polished with action verbs!");
                                }}
                              >
                                ✨ Polish
                              </button>
                              <button
                                type="button"
                                className="remove-bullet-btn"
                                onClick={() => {
                                  const updated = [...resume.projects];
                                  updated[pIdx].bullets = updated[pIdx].bullets.filter((_, i) => i !== bIdx);
                                  updateResume({ projects: updated });
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Extras: Certifications & Languages */}
              {editorSection === "extras" && (
                <div className="editor-card">
                  <h3 className="card-title">Certifications & Languages</h3>
                  {renderSectionSpacerToolbar("extras", "Certifications & Languages")}
                  <div className="input-group full-width">
                    <label>Certifications (one per line)</label>
                    <textarea
                      rows={4}
                      value={
                        certsDraft !== null
                          ? certsDraft
                          : (resume.certifications || [])
                              .map((c) => (typeof c === "string" ? c : `${c.name} (${c.issuer}, ${c.date})`))
                              .join("\n")
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCertsDraft(raw);
                        const list = raw.split("\n").filter((s) => s.trim());
                        updateResume({ certifications: list });
                      }}
                      onBlur={() => setCertsDraft(null)}
                      placeholder="Meta Certified Frontend Developer (Meta, 2022)"
                    />
                  </div>
                  <div className="input-group full-width">
                    <label>Languages (one per line)</label>
                    <textarea
                      rows={3}
                      value={
                        langsDraft !== null
                          ? langsDraft
                          : (resume.languages || [])
                              .map((l) => (typeof l === "string" ? l : `${l.name} (${l.level})`))
                              .join("\n")
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        setLangsDraft(raw);
                        const list = raw.split("\n").filter((s) => s.trim());
                        updateResume({ languages: list });
                      }}
                      onBlur={() => setLangsDraft(null)}
                      placeholder="English (Fluent)\nTamil (Native)"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEMPLATES & DESIGN CONTROLS */}
          {activeTab === "design" && (
            <div className="design-tab-content">
              {/* Template Picker */}
              <div className="design-section">
                <h3 className="design-section-title">Layout Template</h3>
                <div className="template-grid">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      className={`template-card-btn ${
                        (resume.template || "modern") === tmpl.id ? "is-selected" : ""
                      }`}
                      onClick={() => updateResume({ template: tmpl.id })}
                    >
                      <div className="template-card-header">
                        <strong>{tmpl.name}</strong>
                        <span className="template-badge">{tmpl.badge}</span>
                      </div>
                      <p className="template-desc">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color Picker */}
              <div className="design-section">
                <h3 className="design-section-title">Accent Color</h3>
                <div className="color-swatches-row">
                  {THEME_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      className={`swatch-btn ${resume.themeColor === col.hex ? "is-selected" : ""}`}
                      style={{ backgroundColor: col.hex }}
                      onClick={() => updateResume({ themeColor: col.hex })}
                      title={col.name}
                      aria-label={col.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={resume.themeColor || "#0db760"}
                    onChange={(e) => updateResume({ themeColor: e.target.value })}
                    className="custom-color-input"
                    title="Choose custom color"
                  />
                </div>
              </div>

              {/* Typography */}
              <div className="design-section">
                <h3 className="design-section-title">Typography & Font</h3>
                <div className="font-picker-grid">
                  {FONT_FAMILIES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`font-select-btn ${(resume.fontFamily || "sans") === f.id ? "is-selected" : ""}`}
                      onClick={() => updateResume({ fontFamily: f.id })}
                      style={{ fontFamily: f.font }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions Sliders */}
              <div className="design-section">
                <h3 className="design-section-title">Spacing & Sizing</h3>
                <div className="sliders-grid">
                  <div className="slider-group">
                    <div className="slider-label-row">
                      <label>Base Font Size</label>
                      <span>{resume.baseFontSize || 14}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={18}
                      step={0.5}
                      value={resume.baseFontSize || 14}
                      onChange={(e) => updateResume({ baseFontSize: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label-row">
                      <label>Line Height</label>
                      <span>{resume.lineHeight || 1.5}</span>
                    </div>
                    <input
                      type="range"
                      min={1.2}
                      max={1.9}
                      step={0.05}
                      value={resume.lineHeight || 1.5}
                      onChange={(e) => updateResume({ lineHeight: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label-row">
                      <label>Section Spacing</label>
                      <span>{resume.sectionSpacing || 16}px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={28}
                      step={2}
                      value={resume.sectionSpacing || 16}
                      onChange={(e) => updateResume({ sectionSpacing: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label-row">
                      <label>Page Margins (Sides)</label>
                      <span>{resume.pagePadding || 28}px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={44}
                      step={2}
                      value={resume.pagePadding || 28}
                      onChange={(e) => updateResume({ pagePadding: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label-row">
                      <label>Header Space (Top Margin)</label>
                      <span>{resume.headerSpacing || 36}px</span>
                    </div>
                    <input
                      id="ctrl-header-margin"
                      type="range"
                      min={16}
                      max={80}
                      step={4}
                      value={resume.headerSpacing || 36}
                      onChange={(e) => updateResume({ headerSpacing: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label-row">
                      <label>Footer Space (Bottom Margin)</label>
                      <span>{resume.footerSpacing || resume.bottomMargin || 36}px</span>
                    </div>
                    <input
                      id="ctrl-bottom-margin"
                      type="range"
                      min={16}
                      max={80}
                      step={4}
                      value={resume.footerSpacing || resume.bottomMargin || 36}
                      onChange={(e) =>
                        updateResume({
                          footerSpacing: parseInt(e.target.value, 10),
                          bottomMargin: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section Visibility */}
              <div className="design-section">
                <h3 className="design-section-title">Section Visibility</h3>
                <div className="visibility-toggles-list">
                  {Object.entries(resume.visibleSections || {}).map(([secKey, isVis]) => (
                    <label key={secKey} className="visibility-item">
                      <input
                        type="checkbox"
                        checked={isVis}
                        onChange={(e) => {
                          const updated = { ...resume.visibleSections, [secKey]: e.target.checked };
                          updateResume({ visibleSections: updated });
                        }}
                      />
                      <span>{secKey.charAt(0).toUpperCase() + secKey.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section Order & Reorganizer */}
              <div className="design-section">
                <h3 className="design-section-title">Section Ordering</h3>
                <p className="card-subtitle">Move sections up or down to customize layout hierarchy.</p>
                <div className="section-order-list">
                  {(resume.sectionOrder || [
                    "personal",
                    "summary",
                    "skills",
                    "experience",
                    "education",
                    "projects",
                    "certifications",
                    "languages",
                  ])
                    .filter((s) => s !== "personal")
                    .map((secKey, idx, arr) => (
                      <div key={secKey} className="section-order-item">
                        <span className="sec-order-num">0{idx + 1}</span>
                        <span className="sec-order-name">
                          {secKey.charAt(0).toUpperCase() + secKey.slice(1)}
                        </span>
                        <div className="sec-order-btns">
                          <button
                            type="button"
                            className="sec-move-btn"
                            disabled={idx === 0}
                            onClick={() => {
                              const newOrder = ["personal", ...arr];
                              const pos = newOrder.indexOf(secKey);
                              const tmp = newOrder[pos];
                              newOrder[pos] = newOrder[pos - 1];
                              newOrder[pos - 1] = tmp;
                              updateResume({ sectionOrder: newOrder });
                            }}
                            title="Move section up"
                            aria-label={`Move ${secKey} up`}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="sec-move-btn"
                            disabled={idx === arr.length - 1}
                            onClick={() => {
                              const newOrder = ["personal", ...arr];
                              const pos = newOrder.indexOf(secKey);
                              const tmp = newOrder[pos];
                              newOrder[pos] = newOrder[pos + 1];
                              newOrder[pos + 1] = tmp;
                              updateResume({ sectionOrder: newOrder });
                            }}
                            title="Move section down"
                            aria-label={`Move ${secKey} down`}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BI-DIRECTIONAL MARKDOWN */}
          {activeTab === "markdown" && (
            <div className="markdown-tab-content">
              <div className="markdown-header-bar">
                <div>
                  <h3 className="card-title">Bi-Directional Markdown Sync</h3>
                  <p className="card-subtitle">
                    Edit below directly. Any changes update the resume and live preview in real time!
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(markdownText);
                    showNotice("Markdown copied to clipboard!");
                  }}
                >
                  Copy Markdown
                </button>
              </div>
              <textarea
                className="markdown-raw-editor"
                value={markdownText}
                onChange={(e) => handleMarkdownChange(e.target.value)}
                rows={28}
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 4: ATS MATCHER & OPTIMIZER */}
          {activeTab === "ats" && (
            <div className="ats-tab-content">
              <div className="ats-card">
                <h3 className="card-title">ATS Keyword Scanner</h3>
                <p className="card-subtitle">
                  Paste the target job description to match keywords and get instant ATS recommendations.
                </p>
                <textarea
                  className="styled-textarea"
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description (e.g. Senior Frontend Engineer with React, TypeScript, Next.js, and CI/CD pipelines)..."
                />
              </div>

              {/* ATS Score Overview */}
              <div className="ats-score-card">
                <div className="score-dial">
                  <span className="score-num">{ats.score}%</span>
                  <span className="score-caption">ATS Match</span>
                </div>
                <div className="score-breakdown-bars">
                  <div className="breakdown-bar-item">
                    <div className="bar-label-row">
                      <span>Keywords Match</span>
                      <span>{ats.breakdown.keywordScore}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${ats.breakdown.keywordScore}%` }} />
                    </div>
                  </div>
                  <div className="breakdown-bar-item">
                    <div className="bar-label-row">
                      <span>Skills Match</span>
                      <span>{ats.breakdown.skillScore}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${ats.breakdown.skillScore}%` }} />
                    </div>
                  </div>
                  <div className="breakdown-bar-item">
                    <div className="bar-label-row">
                      <span>Experience Depth</span>
                      <span>{ats.breakdown.experienceScore}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${ats.breakdown.experienceScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Keywords Breakdown */}
              <div className="ats-keywords-card">
                <h4 className="keywords-heading">Matched Keywords ({ats.matchedKeywords.length})</h4>
                <div className="keywords-chips">
                  {ats.matchedKeywords.length > 0 ? (
                    ats.matchedKeywords.map((kw) => (
                      <span key={kw} className="kw-chip is-matched">
                        ✓ {kw}
                      </span>
                    ))
                  ) : (
                    <span className="empty-kw-note">Paste job description above to scan.</span>
                  )}
                </div>

                {ats.missingKeywords.length > 0 && (
                  <>
                    <h4 className="keywords-heading missing-title">Missing Job Terms ({ats.missingKeywords.length})</h4>
                    <div className="keywords-chips">
                      {ats.missingKeywords.map((kw) => (
                        <span key={kw} className="kw-chip is-missing">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Recommendations */}
              {ats.recommendations?.length > 0 && (
                <div className="ats-recs-card">
                  <h4 className="recs-heading">Optimization Suggestions</h4>
                  <ul className="recs-list">
                    {ats.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── RIGHT PANE: LIVE A4 PREVIEW CANVAS ── */}
        <section className={`builder-preview-pane ${mobileView === "preview" ? "is-mobile-visible" : ""}`}>
          <div className="preview-canvas-bar">
            <div className="canvas-status">
              <span className="live-dot" aria-hidden="true" />
              <span className="canvas-title">A4 Live Preview</span>
              <span className="template-indicator">
                {TEMPLATES.find((t) => t.id === resume.template)?.name || "Modern"}
              </span>
              <span className={`page-count-badge ${pageCount > 1 ? "is-multi-page" : "is-single-page"}`}>
                📄 {pageCount} {pageCount === 1 ? "Page" : "Pages"}
                <small>{pageCount === 1 ? "(Fits A4)" : "(Spills to Page 2)"}</small>
              </span>
            </div>

            <div className="canvas-actions-right">
              {/* Header & Footer Spacing Quick Controls */}
              <div className="canvas-spacing-capsule">
                <span className="capsule-label">Margins:</span>
                <button
                  type="button"
                  className="spacing-btn"
                  onClick={() => {
                    updateResume((r) => ({
                      ...r,
                      headerSpacing: Math.min(80, (r.headerSpacing || 36) + 4),
                    }));
                    showNotice("Added Header (Top) Space!");
                  }}
                  title="Increase Header (Top) Space"
                >
                  + Header
                </button>
                <button
                  type="button"
                  className="spacing-btn"
                  onClick={() => {
                    updateResume((r) => ({
                      ...r,
                      headerSpacing: Math.max(12, (r.headerSpacing || 36) - 4),
                    }));
                    showNotice("Reduced Header (Top) Space!");
                  }}
                  title="Decrease Header (Top) Space"
                >
                  − Header
                </button>
                <span className="spacing-divider">|</span>
                <button
                  type="button"
                  className="spacing-btn"
                  onClick={() => {
                    updateResume((r) => ({
                      ...r,
                      footerSpacing: Math.min(80, (r.footerSpacing || 36) + 4),
                      bottomMargin: Math.min(80, (r.footerSpacing || 36) + 4),
                    }));
                    showNotice("Added Footer (Bottom) Space!");
                  }}
                  title="Increase Footer (Bottom) Space"
                >
                  + Footer
                </button>
                <button
                  type="button"
                  className="spacing-btn"
                  onClick={() => {
                    updateResume((r) => ({
                      ...r,
                      footerSpacing: Math.max(12, (r.footerSpacing || 36) - 4),
                      bottomMargin: Math.max(12, (r.footerSpacing || 36) - 4),
                    }));
                    showNotice("Reduced Footer (Bottom) Space!");
                  }}
                  title="Decrease Footer (Bottom) Space"
                >
                  − Footer
                </button>
              </div>

              {pageCount > 1 && (
                <div className="page-jump-group">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      className="page-jump-btn"
                      onClick={() => {
                        const viewport = document.querySelector(".preview-scroll-viewport");
                        if (viewport) {
                          const pageOffset = i * 1122.5 * scale;
                          viewport.scrollTo({ top: pageOffset, behavior: "smooth" });
                        }
                      }}
                      title={`Scroll to Page ${i + 1}`}
                    >
                      P.{i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="fit-one-page-btn"
                    onClick={() => {
                      updateResume((r) => ({
                        ...r,
                        baseFontSize: Math.max(12, (r.baseFontSize || 14) - 0.5),
                        lineHeight: Math.max(1.3, +((r.lineHeight || 1.5) - 0.08).toFixed(2)),
                        sectionSpacing: Math.max(10, (r.sectionSpacing || 16) - 2),
                        pagePadding: Math.max(20, (r.pagePadding || 28) - 2),
                      }));
                      showNotice("Adjusted spacing & sizing to fit on fewer pages!");
                    }}
                    title="Automatically reduce spacing to fit on 1 page"
                  >
                    ⚡ Fit 1-Page
                  </button>
                </div>
              )}

              <div className="zoom-controls">
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
                  title="Zoom Out"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className="zoom-label">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setScale((s) => Math.min(1.5, +(s + 0.1).toFixed(2)))}
                  title="Zoom In"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  className="zoom-reset-btn"
                  onClick={() => setScale(1)}
                  title="Reset Zoom to 100%"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="preview-scroll-viewport">
            <ResumeDocument
              resume={resume}
              scale={scale}
              onPageCountChange={(count) => setPageCount(count)}
            />
            <div className="canvas-bottom-cushion" aria-hidden="true" />
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="toast-notification" role="status" aria-live="polite">
          {notification}
        </div>
      )}
      </div>
    </div>
  );
}

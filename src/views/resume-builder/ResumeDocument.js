"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FONT_FAMILIES } from "./constants";

export default function ResumeDocument({
  resume,
  isPrintPreview = false,
  scale = 1,
  onPageCountChange,
}) {
  const paperRef = useRef(null);
  const measureRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const [a4Px, setA4Px] = useState(1122.5);

  const p = resume?.personal || {};
  const template = resume?.template || "modern";
  const themeColor = resume?.themeColor || "#0db760";
  const baseFontSize = resume?.baseFontSize || 14;
  const lineHeight = resume?.lineHeight || 1.5;
  const sectionSpacing = resume?.sectionSpacing || 16;
  const pagePadding = resume?.pagePadding || 28;
  const fontFamilyEntry = FONT_FAMILIES.find((f) => f.id === resume?.fontFamily) || FONT_FAMILIES[0];
  const fontFamily = fontFamilyEntry.font;

  // Calibrate A4 height in browser pixels (297mm)
  useEffect(() => {
    if (measureRef.current) {
      const rect = measureRef.current.getBoundingClientRect();
      if (rect.height > 500) {
        setA4Px(rect.height);
      }
    }
  }, []);

  // Live monitor content height to calculate dynamic page cuts
  useEffect(() => {
    if (!paperRef.current) return;

    const measure = () => {
      if (!paperRef.current) return;
      const scrollH = paperRef.current.scrollHeight;
      // 16px tolerance threshold prevents accidental 1-line spillover
      const count = Math.max(1, Math.ceil((scrollH - 16) / a4Px));
      setPageCount(count);
      onPageCountChange?.(count);
    };

    measure();

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measure();
      });
      ro.observe(paperRef.current);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [resume, a4Px, onPageCountChange]);

  const visible = resume?.visibleSections || {
    personal: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    languages: true,
  };

  const contacts = useMemo(() => {
    return [
      p.phone && { label: "Phone", value: p.phone, href: `tel:${p.phone}` },
      p.email && { label: "Email", value: p.email, href: `mailto:${p.email}` },
      p.location && { label: "Location", value: p.location },
      p.linkedin && { label: "LinkedIn", value: p.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: p.linkedin },
      p.github && { label: "GitHub", value: p.github.replace(/^https?:\/\/(www\.)?/, ""), href: p.github },
      p.portfolio && { label: "Portfolio", value: p.portfolio.replace(/^https?:\/\/(www\.)?/, ""), href: p.portfolio },
    ].filter(Boolean);
  }, [p]);

  const skillEntries = useMemo(() => {
    const labels = {
      programming: "Programming Languages",
      frameworks: "Frameworks & Libraries",
      webTechnologies: "Web Technologies & Protocols",
      tools: "Developer Tools & Testing",
      cloud: "Cloud & DevOps",
      ai: "AI & Machine Learning",
      databases: "Databases & Storage",
    };
    return Object.entries(resume?.skills || {})
      .map(([key, list]) => ({
        key,
        label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1),
        list: Array.isArray(list) ? list : [],
      }))
      .filter((entry) => entry.list.length > 0);
  }, [resume?.skills]);

  const photoRadius = useMemo(() => {
    const shape = p.photoConfig?.shape || "rounded";
    if (shape === "circle") return "50%";
    if (shape === "square") return "0px";
    return "8px";
  }, [p.photoConfig?.shape]);

  const photoSize = p.photoConfig?.size || 90;
  const showPhoto = Boolean(p.photo && p.photoConfig?.visible !== false);

  // ── Render Section Helper ──
  const getSectionProps = (sectionKey) => {
    const isBreak = Boolean(resume?.sectionBreaks?.[sectionKey]);
    const customSpace = Number(resume?.sectionSpacers?.[sectionKey]) || 0;
    const style = {};
    if (isBreak) {
      style.breakBefore = "page";
      style.pageBreakBefore = "always";
      style.marginTop = "calc(var(--page-break-gap, 48px) + var(--header-spacing, 36px))";
    }
    if (customSpace > 0) {
      style.marginTop = `${customSpace}px`;
    }
    const className = `resume-doc-section section-${sectionKey} ${isBreak ? "page-break-before" : ""}`;
    return { className, style };
  };

  const renderSection = (sectionKey) => {
    if (!visible[sectionKey]) return null;
    const { className, style } = getSectionProps(sectionKey);

    switch (sectionKey) {
      case "summary":
        if (!resume?.summary) return null;
        return (
          <section className={className} style={style} key="summary">
            <h2 className="section-title">
              <span className="section-title-text">Professional Profile</span>
              <span className="section-title-line" />
            </h2>
            <p className="summary-paragraph">{resume.summary}</p>
          </section>
        );

      case "skills":
        if (!skillEntries.length) return null;
        return (
          <section className={className} style={style} key="skills">
            <h2 className="section-title">
              <span className="section-title-text">Technical Expertise</span>
              <span className="section-title-line" />
            </h2>
            <div className="skills-grid">
              {skillEntries.map((group) => (
                <div key={group.key} className="skill-row">
                  <span className="skill-label">{group.label}:</span>
                  <div className="skill-pills">
                    {group.list.map((skill) => (
                      <span key={skill} className="skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "experience":
        if (!resume?.experience?.length) return null;
        return (
          <section className={className} style={style} key="experience">
            <h2 className="section-title">
              <span className="section-title-text">Career History</span>
              <span className="section-title-line" />
            </h2>
            <div className="experience-list">
              {resume.experience.map((exp, idx) => {
                const entryBreak = Boolean(exp.breakBefore);
                const entrySpace = Number(exp.topSpace) || 0;
                return (
                  <div
                    key={`${exp.company}-${idx}`}
                    className={`experience-entry ${entryBreak ? "page-break-before" : ""}`}
                    style={{
                      ...(entryBreak
                        ? {
                            breakBefore: "page",
                            pageBreakBefore: "always",
                            marginTop: "calc(var(--page-break-gap, 48px) + var(--header-spacing, 36px))",
                          }
                        : {}),
                      ...(entrySpace > 0 ? { marginTop: `${entrySpace}px` } : {}),
                    }}
                  >
                    <div className="entry-header">
                      <div className="entry-title-wrap">
                        <strong className="entry-role">{exp.role}</strong>
                        <span className="entry-at"> at </span>
                        <span className="entry-company">{exp.company}</span>
                      </div>
                      <div className="entry-meta">
                        <span className="entry-dates">
                          {[exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ")}
                        </span>
                        {exp.location && <span className="entry-location"> · {exp.location}</span>}
                      </div>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="entry-bullets">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "education":
        if (!resume?.education?.length) return null;
        return (
          <section className={className} style={style} key="education">
            <h2 className="section-title">
              <span className="section-title-text">Education</span>
              <span className="section-title-line" />
            </h2>
            <div className="education-list">
              {resume.education.map((edu, idx) => (
                <div key={`${edu.school}-${idx}`} className="education-entry">
                  <div className="entry-header">
                    <div className="entry-title-wrap">
                      <strong className="entry-school">{edu.school}</strong>
                      {edu.degree && (
                        <span className="entry-degree">
                          {" "}— {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="entry-meta">
                      <span className="entry-dates">
                        {[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}
                      </span>
                      {edu.gpa && <span className="entry-gpa"> · {edu.gpa}</span>}
                    </div>
                  </div>
                  {edu.bullets && edu.bullets.length > 0 && (
                    <ul className="entry-bullets">
                      {edu.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "projects":
        if (!resume?.projects?.length) return null;
        return (
          <section className={className} style={style} key="projects">
            <h2 className="section-title">
              <span className="section-title-text">Selected Builds & Projects</span>
              <span className="section-title-line" />
            </h2>
            <div className="projects-list">
              {resume.projects.map((proj, idx) => {
                const projBreak = Boolean(proj.breakBefore);
                const projSpace = Number(proj.topSpace) || 0;
                return (
                  <div
                    key={`${proj.name}-${idx}`}
                    className={`project-entry ${projBreak ? "page-break-before" : ""}`}
                    style={{
                      ...(projBreak
                        ? {
                            breakBefore: "page",
                            pageBreakBefore: "always",
                            marginTop: "calc(var(--page-break-gap, 48px) + var(--header-spacing, 36px))",
                          }
                        : {}),
                      ...(projSpace > 0 ? { marginTop: `${projSpace}px` } : {}),
                    }}
                  >
                    <div className="entry-header">
                      <div className="entry-title-wrap">
                        <strong className="entry-name">{proj.name}</strong>
                        {proj.role && <span className="entry-role"> · {proj.role}</span>}
                      </div>
                      <div className="entry-meta">
                        {proj.date && <span className="entry-dates">{proj.date}</span>}
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="entry-link">
                            ↗ Link
                          </a>
                        )}
                      </div>
                    </div>
                    {proj.description && <p className="project-desc">{proj.description}</p>}
                    {proj.techStack && (
                      <div className="project-tech">
                        <span className="tech-tag">Tech Stack: {proj.techStack}</span>
                      </div>
                    )}
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul className="entry-bullets">
                        {proj.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "certifications":
        if (!resume?.certifications?.length) return null;
        return (
          <section className={className} style={style} key="certifications">
            <h2 className="section-title">
              <span className="section-title-text">Certifications & Honors</span>
              <span className="section-title-line" />
            </h2>
            <ul className="cert-list">
              {resume.certifications.map((c, idx) => (
                <li key={idx}>
                  {typeof c === "string" ? (
                    c
                  ) : (
                    <span>
                      <strong>{c.name}</strong>
                      {c.issuer && ` — ${c.issuer}`}
                      {c.date && ` (${c.date})`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );

      case "languages":
        if (!resume?.languages?.length) return null;
        return (
          <section className={className} style={style} key="languages">
            <h2 className="section-title">
              <span className="section-title-text">Languages</span>
              <span className="section-title-line" />
            </h2>
            <div className="language-pills">
              {resume.languages.map((l, idx) => (
                <span key={idx} className="language-pill">
                  {typeof l === "string" ? l : `${l.name} (${l.level || "Proficient"})`}
                </span>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const sectionOrder = resume?.sectionOrder || [
    "personal",
    "summary",
    "skills",
    "experience",
    "education",
    "projects",
    "certifications",
    "languages",
  ];

  const mainSections = sectionOrder.filter((s) => s !== "personal");
  const headerSpacing = resume?.headerSpacing || 36;
  const footerSpacing = resume?.footerSpacing || resume?.bottomMargin || 36;
  const pageBreakGap = resume?.pageBreakGap || 48;

  return (
    <div
      className={`resume-paper-container template-${template} ${isPrintPreview ? "is-print" : ""}`}
      style={{
        "--theme-color": themeColor,
        "--base-font-size": `${baseFontSize}px`,
        "--line-height": lineHeight,
        "--section-spacing": `${sectionSpacing}px`,
        "--page-padding": `${pagePadding}px`,
        "--header-spacing": `${headerSpacing}px`,
        "--footer-spacing": `${footerSpacing}px`,
        "--page-break-gap": `${pageBreakGap}px`,
        "--bottom-spacing": `${footerSpacing}px`,
        "--resume-font": fontFamily,
        transform: `scale(${scale})`,
        transformOrigin: "top center",
      }}
    >
      <article
        ref={paperRef}
        className="resume-paper"
        aria-label="Resume document"
        style={{
          minHeight: `${pageCount * 297}mm`,
          paddingTop: `${headerSpacing}px`,
          paddingBottom: `${footerSpacing}px`,
        }}
      >
        {/* Hidden A4 Height Calibration Gauge */}
        <div
          ref={measureRef}
          className="a4-measure-gauge"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "297mm",
            width: "1px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
          aria-hidden="true"
        />

        {/* Dynamic A4 Page Break Cuts between sheets (Clean side-gutter badges) */}
        {!isPrintPreview &&
          pageCount > 1 &&
          Array.from({ length: pageCount - 1 }).map((_, idx) => {
            const pageIndex = idx + 1;
            const topMm = pageIndex * 297;
            return (
              <div
                key={pageIndex}
                className="a4-page-cut-separator"
                style={{ top: `${topMm}mm` }}
                aria-hidden="true"
              >
                <div className="cut-dashed-line" />
                <div className="cut-tag-left">
                  <span className="cut-icon">✂</span>
                  <span className="cut-text">PAGE {pageIndex} END</span>
                </div>
                <div className="cut-tag-right">
                  <span className="cut-text">PAGE {pageIndex + 1} START</span>
                  <span className="cut-badge-a4">297mm A4 CUT</span>
                </div>
              </div>
            );
          })}

        {/* Dynamic Page Number Indicators on Each Sheet */}
        {!isPrintPreview &&
          Array.from({ length: pageCount }).map((_, idx) => {
            const pageNum = idx + 1;
            const footerTopMm = pageNum * 297 - 12;
            return (
              <div
                key={pageNum}
                className="a4-sheet-footer-marker"
                style={{ top: `${footerTopMm}mm` }}
                aria-hidden="true"
              >
                <span>
                  Page {pageNum} of {pageCount}
                </span>
              </div>
            );
          })}

        {/* ── Two-Column Layout (Left-Right) ── */}
        {template === "left-right" ? (
          <div className="two-column-layout">
            <aside className="two-col-sidebar">
              {showPhoto && (
                <div
                  className="sidebar-photo"
                  style={{
                    width: `${photoSize}px`,
                    height: `${photoSize}px`,
                    borderRadius: photoRadius,
                  }}
                >
                  <img src={p.photo} alt={p.name || "Candidate photo"} />
                </div>
              )}

              <header className="sidebar-header">
                <h1 className="resume-name">{p.name || "Your Name"}</h1>
                {p.title && <p className="resume-headline">{p.title}</p>}
              </header>

              {contacts.length > 0 && (
                <div className="sidebar-section">
                  <h3 className="sidebar-section-title">Contact</h3>
                  <div className="sidebar-contacts">
                    {contacts.map((c) => (
                      <div key={c.label} className="sidebar-contact-item">
                        <span className="contact-label">{c.label}</span>
                        {c.href ? (
                          <a href={c.href} target="_blank" rel="noreferrer">
                            {c.value}
                          </a>
                        ) : (
                          <span>{c.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills in Sidebar for 2-column */}
              {visible.skills && skillEntries.length > 0 && (
                <div className="sidebar-section">
                  <h3 className="sidebar-section-title">Skills</h3>
                  <div className="sidebar-skills">
                    {skillEntries.map((group) => (
                      <div key={group.key} className="sidebar-skill-group">
                        <strong className="sidebar-skill-cat">{group.label}</strong>
                        <p className="sidebar-skill-list">{group.list.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education in Sidebar */}
              {visible.education && resume?.education?.length > 0 && (
                <div className="sidebar-section">
                  <h3 className="sidebar-section-title">Education</h3>
                  <div className="sidebar-edu">
                    {resume.education.map((edu, idx) => (
                      <div key={idx} className="sidebar-edu-item">
                        <strong>{edu.school}</strong>
                        <p>{[edu.degree, edu.field].filter(Boolean).join(" in ")}</p>
                        <small>{[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages in Sidebar */}
              {visible.languages && resume?.languages?.length > 0 && (
                <div className="sidebar-section">
                  <h3 className="sidebar-section-title">Languages</h3>
                  <p className="sidebar-languages">
                    {resume.languages
                      .map((l) => (typeof l === "string" ? l : `${l.name} (${l.level})`))
                      .join(" · ")}
                  </p>
                </div>
              )}
            </aside>

            <main className="two-col-main">
              {renderSection("summary")}
              {renderSection("experience")}
              {renderSection("projects")}
              {renderSection("certifications")}
            </main>
          </div>
        ) : (
          /* ── Standard Single / Full-width Layouts (Classic, Modern, Timeline, Minimalist, Editorial, Swiss) ── */
          <>
            <header className="resume-header">
              <div className="header-identity">
                <div className="identity-text">
                  <h1 className="resume-name">{p.name || "Your Name"}</h1>
                  {p.title && <p className="resume-headline">{p.title}</p>}
                </div>
                {showPhoto && (
                  <div
                    className="header-photo"
                    style={{
                      width: `${photoSize}px`,
                      height: `${photoSize}px`,
                      borderRadius: photoRadius,
                    }}
                  >
                    <img src={p.photo} alt={p.name || "Candidate photo"} />
                  </div>
                )}
              </div>

              {contacts.length > 0 && (
                <div className="resume-contact-bar">
                  {contacts.map((c) => (
                    <span key={c.label} className="contact-chip">
                      {c.href ? (
                        <a href={c.href} target="_blank" rel="noreferrer">
                          {c.value}
                        </a>
                      ) : (
                        c.value
                      )}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="resume-body">
              {mainSections.map((sectionKey) => renderSection(sectionKey))}
            </div>
          </>
        )}
      </article>
    </div>
  );
}

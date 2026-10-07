const SKILL_LABELS = {
  programming: "Programming",
  frameworks: "Frameworks",
  webTechnologies: "Web technologies",
  tools: "Tools",
  cloud: "Cloud",
  ai: "AI",
  databases: "Databases",
};

function ResumeSection({ title, children }) {
  if (!children) return null;
  return (
    <section className="resume-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ResumeDocument({ resume }) {
  const personal = resume?.personal || {};
  const contacts = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ].filter(Boolean);
  const skillGroups = Object.entries(SKILL_LABELS)
    .map(([key, label]) => ({ label, skills: resume?.skills?.[key] || [] }))
    .filter((group) => group.skills.length);
  const hasResumeContent = Boolean(
    resume?.summary
    || skillGroups.length
    || resume?.experience?.length
    || resume?.projects?.length
    || resume?.education?.length
    || resume?.achievements?.length
    || resume?.certifications?.length
    || resume?.languages?.length,
  );

  return (
    <article className="resume-paper" aria-label="Resume document">
      <header className="resume-paper-header">
        <h1>{personal.name || "Your Name"}</h1>
        {personal.title && <p className="resume-headline">{personal.title}</p>}
        {contacts.length > 0 && (
          <div className="resume-contact">{contacts.map((item) => <span key={item}>{item}</span>)}</div>
        )}
      </header>

      {!hasResumeContent ? (
        <div className="resume-empty-state">
          <span aria-hidden="true">✳</span>
          <p>Your resume takes shape here.</p>
          <small>Generate a draft or enter candidate details to get started.</small>
        </div>
      ) : (
        <>
          <ResumeSection title="Professional Profile">
            {resume.summary && <p>{resume.summary}</p>}
          </ResumeSection>

          <ResumeSection title="Technical Expertise">
            {skillGroups.length > 0 && (
              <dl className="resume-skill-groups">
                {skillGroups.map((group) => (
                  <div key={group.label}>
                    <dt>{group.label}</dt>
                    <dd>{group.skills.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            )}
          </ResumeSection>

          <ResumeSection title="Career History">
            {resume.experience?.length > 0 && resume.experience.map((job, index) => (
              <div className="resume-entry" key={`${job.company}-${job.role}-${index}`}>
                <div className="resume-entry-heading">
                  <strong>{job.company || job.role}</strong>
                  <span>
                    {[job.startDate, job.current ? "Present" : job.endDate]
                      .filter(Boolean)
                      .join(" – ")}
                  </span>
                </div>
                {job.role && <p className="resume-role">{job.role}</p>}
                {job.location && <p className="resume-entry-location">{job.location}</p>}
                {job.bullets?.length > 0 && (
                  <ul>{job.bullets.map((bullet, bulletIndex) => <li key={`${bulletIndex}-${bullet}`}>{bullet}</li>)}</ul>
                )}
              </div>
            ))}
          </ResumeSection>

          <ResumeSection title="Project Details">
            {resume.projects?.length > 0 && resume.projects.map((project, index) => (
              <div className="resume-entry" key={`${project.name}-${index}`}>
                <div className="resume-entry-heading"><strong>{project.name}</strong></div>
                {project.role && <p className="resume-role">{project.role}</p>}
                {project.description && <p>{project.description}</p>}
                {project.technologies?.length > 0 && (
                  <p className="resume-technologies"><strong>Technologies:</strong> {project.technologies.join(", ")}</p>
                )}
                {project.bullets?.length > 0 && (
                  <ul>{project.bullets.map((bullet, bulletIndex) => <li key={`${bulletIndex}-${bullet}`}>{bullet}</li>)}</ul>
                )}
              </div>
            ))}
          </ResumeSection>

          <ResumeSection title="Education">
            {resume.education?.length > 0 && resume.education.map((education, index) => (
              <div className="resume-entry" key={`${education.institution}-${index}`}>
                <div className="resume-entry-heading">
                  <strong>{education.degree || education.institution}</strong>
                  <span>{[education.startDate, education.endDate].filter(Boolean).join(" – ")}</span>
                </div>
                {education.institution && <p className="resume-company">{education.institution}</p>}
                {education.location && <p className="resume-entry-location">{education.location}</p>}
              </div>
            ))}
          </ResumeSection>

          <ResumeSection title="Achievements">
            {resume.achievements?.length > 0 && (
              <ul>{resume.achievements.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </ResumeSection>

          <ResumeSection title="Certifications">
            {resume.certifications?.length > 0 && (
              <ul>{resume.certifications.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </ResumeSection>

          <ResumeSection title="Languages">
            {resume.languages?.length > 0 && <p>{resume.languages.join(" · ")}</p>}
          </ResumeSection>
        </>
      )}
    </article>
  );
}

export default ResumeDocument;

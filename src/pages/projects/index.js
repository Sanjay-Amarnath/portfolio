import { useEffect } from "react";
import { getProjectBySlug, projects } from "../../data/projects";
import "./projects-page.scss";

function ProjectHeader() {
  return (
    <header className="project-page-nav">
      <a href="/#top" className="project-page-brand">SANJAY AMARNATH<span>.</span></a>
      <nav aria-label="Project navigation">
        <a href="/#projects">All projects</a>
        <a href="/resume">Resume Lab</a>
        <a className="project-contact-link" href="/#contact">Contact ↗</a>
      </nav>
    </header>
  );
}

function ProjectArtwork({ project }) {
  return (
    <div className="project-detail-art" data-project-art={project.color} aria-hidden="true">
      <div className="project-detail-orbit project-detail-orbit-one" />
      <div className="project-detail-orbit project-detail-orbit-two" />
      <div className="project-detail-symbol">{project.symbol}</div>
      <span className="project-detail-coordinate">{project.context}</span>
    </div>
  );
}

export function ProjectsIndex() {
  return (
    <main className="project-page-shell">
      <ProjectHeader />
      <section className="project-index-hero">
        <p className="project-eyebrow">THE WORK / {new Date().getFullYear()}</p>
        <h1>Interfaces for<br /><em>what comes next.</em></h1>
        <p>
          A selection of product work across fintech, booking, content
          experiences, and an independent career tool.
        </p>
      </section>
      <div className="project-index-list">
        {projects.map((project, index) => (
          <a
            className="project-index-card"
            href={`/projects/${project.slug}`}
            aria-label={`View ${project.name} case study`}
            key={project.slug}
          >
            <span className="project-index-number">{String(index + 1).padStart(2, "0")}</span>
            <ProjectArtwork project={project} />
            <span className="project-index-details">
              <small>{project.type}</small>
              <strong>{project.name}</strong>
              <span>{project.summary}</span>
            </span>
            <span className="project-index-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      <ProjectFooter />
    </main>
  );
}

function ProjectFooter() {
  return (
    <footer className="project-page-footer">
      <a href="/#projects">← Back to selected work</a>
      <span>MADE WITH CURIOSITY · © {new Date().getFullYear()} SANJAY AMARNATH</span>
    </footer>
  );
}

export function ProjectDetail({ slug }) {
  const project = getProjectBySlug(slug);
  if (!project) {
    return (
      <main className="project-page-shell project-not-found">
        <ProjectHeader />
        <section>
          <p className="project-eyebrow">404 / FIELD NOTE NOT FOUND</p>
          <h1>This project is<br /><em>off the chart.</em></h1>
          <a className="project-back-link" href="/projects">Browse all projects ↗</a>
        </section>
      </main>
    );
  }

  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length];

  return (
    <main className="project-page-shell">
      <ProjectHeader />
      <article className="project-detail">
        <a className="project-back-link" href="/projects">← All projects</a>
        <div className="project-detail-hero">
          <div className="project-detail-intro">
            <p className="project-eyebrow">
              CASE STUDY / {String(projectIndex + 1).padStart(2, "0")} — {project.type}
            </p>
            <h1>{project.name}<span>.</span></h1>
            <p className="project-detail-summary">{project.summary}</p>
            <div className="project-detail-tags">
              {project.stack.map((item) => <span key={item}>{item}</span>)}
            </div>
            {project.href && (
              <a className="project-open-tool" href={project.href}>
                Open the live Resume Lab <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <ProjectArtwork project={project} />
        </div>

        <dl className="project-facts">
          <div><dt>PRODUCT SPACE</dt><dd>{project.context}</dd></div>
          <div><dt>MY FOCUS</dt><dd>{project.focus[0]}</dd></div>
          <div><dt>TECHNOLOGY</dt><dd>{project.stack.slice(0, 3).join(" · ")}</dd></div>
        </dl>

        <section className="project-story">
          <div className="project-story-heading">
            <p className="project-eyebrow">THE BUILD / {project.symbol}</p>
            <h2>Thoughtful detail.<br /><em>Useful by design.</em></h2>
          </div>
          <div className="project-story-content">
            <section>
              <h3>Context</h3>
              <p>{project.summary}</p>
            </section>
            <section>
              <h3>My contribution</h3>
              <p>{project.contribution}</p>
            </section>
            <section>
              <h3>What the work focused on</h3>
              <ul>{project.focus.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section>
              <h3>What I took forward</h3>
              <p>{project.learning}</p>
            </section>
          </div>
        </section>

        <a className="project-next-link" href={`/projects/${nextProject.slug}`}>
          <span><small>NEXT FIELD NOTE</small><strong>{nextProject.name}</strong></span>
          <span aria-hidden="true">↗</span>
        </a>
      </article>
      <ProjectFooter />
    </main>
  );
}

function ProjectsPage() {
  const slug = window.location.pathname.replace(/\/+$/, "").split("/").pop();
  const project = slug === "projects" ? null : getProjectBySlug(slug);

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = project
      ? `${project.name} | Sanjay Amarnath`
      : slug === "projects"
        ? "Selected Projects | Sanjay Amarnath"
        : "Project Not Found | Sanjay Amarnath";
    if (description) {
      description.content = project
        ? `${project.summary} Selected work by Sanjay Amarnath.`
        : "Selected product and software case studies by Sanjay Amarnath.";
    }

    return () => {
      document.title = previousTitle;
      if (description && previousDescription) description.content = previousDescription;
    };
  }, [project, slug]);

  return slug === "projects" ? <ProjectsIndex /> : <ProjectDetail slug={slug} />;
}

export default ProjectsPage;

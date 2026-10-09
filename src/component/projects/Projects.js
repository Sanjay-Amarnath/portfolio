import { projects } from "../../data/projects";
import "./projects.scss";

function ProjectArtwork({ project }) {
  return (
    <div
      className="project-artwork"
      data-project-art={project.color}
      aria-hidden="true"
    >
      <div className="project-artwork-orbit" />
      <div className="project-artwork-card">
        <span className="project-artwork-label">{project.context}</span>
        <strong>{project.symbol}</strong>
        <span className="project-artwork-rule" />
        <span className="project-artwork-lines">
          <i />
          <i />
          <i />
        </span>
      </div>
      <span className="project-artwork-coordinate">FIELD STUDY / {project.slug.toUpperCase()}</span>
    </div>
  );
}

function ProjectCard({ project, index }) {
  return (
    <article className="portfolio-project-card reveal-up">
      <a
        className="portfolio-project-link"
        href={`/projects/${project.slug}`}
        aria-label={`View ${project.name} case study`}
      >
        <ProjectArtwork project={project} />
        <div className="portfolio-project-copy">
          <div className="portfolio-project-meta">
            <span>{String(index + 1).padStart(2, "0")} / SELECTED WORK</span>
            <span>{project.type}</span>
          </div>
          <h3>{project.name}</h3>
          <p>{project.summary}</p>
          <span className="portfolio-project-cta">
            Explore the case study <span aria-hidden="true">↗</span>
          </span>
        </div>
      </a>
    </article>
  );
}

function Projects() {
  return (
    <section className="portfolio-projects" id="projects" aria-labelledby="projects-title">
      <div className="portfolio-projects-heading reveal-up">
        <div>
          <span className="section-index">03 — SELECTED BUILDS</span>
          <h2 id="projects-title">
            Products made
            <br />
            <span>for real workflows.</span>
          </h2>
        </div>
        <p>
          From fintech SaaS and booking journeys to a resume tool of my own,
          these are the products and interfaces I have helped bring to life.
        </p>
      </div>
      <div className="portfolio-project-grid">
        {projects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}

export default Projects;

import { getJobDetail, mapFreehireJob } from "@/lib/freehire";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./job-detail.scss";

export async function generateStaticParams() {
  // We don't pre-generate; let it be dynamic
  return [];
}

export default async function JobDetailPage({ params }) {
  const { slug } = await params;

  try {
    const rawJob = await getJobDetail(slug);
    if (!rawJob) notFound();
    const job = mapFreehireJob(rawJob);

    return (
      <div className="job-detail-container">
        <div className="job-detail-wrapper">
          <Link href="/jobs" className="back-link">
            ← Back to all jobs
          </Link>

          <div className="job-header-card">
            <div className="company-info-row">
              <div className="company-avatar">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="company-label">{job.company}</span>
                <span className="post-date">Posted {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Recent"}</span>
              </div>
            </div>

            <h1 className="job-main-title">{job.title}</h1>

            <div className="job-badges-row">
              <span className="badge location">📍 {job.location}</span>
              <span className={`badge workmode ${job.workMode}`}>{job.workMode}</span>
              <span className="badge category">{job.category}</span>
              {job.countries?.length && (
                <span className="badge countries">🌍 {job.countries.join(", ")}</span>
              )}
              {job.remote === true && <span className="badge remote-flag">🌐 Fully Remote</span>}
            </div>

            <div className="action-buttons">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="apply-now-btn">
                {job.directApply ? "Apply via freehire ↗" : "Apply on Company Site ↗"}
              </a>
            </div>
          </div>

          <div className="job-body-content">
            <h2>Required Skills</h2>
            <div className="skills-row">
              {(job.skills || []).map(skill => (
                <span key={skill} className="skill-badge">{skill}</span>
              ))}
            </div>

            {job.collections?.length && (
              <>
                <h2>Company Collections</h2>
                <div className="skills-row">
                  {job.collections.map(c => <span key={c} className="skill-badge collection">{c}</span>)}
                </div>
              </>
            )}

            {job.metros?.length && (
              <>
                <h2>Metro Areas</h2>
                <div className="skills-row">
                  {job.metros.map(m => <span key={m} className="skill-badge metro">{m}</span>)}
                </div>
              </>
            )}

            <h2>Job Description</h2>
            <div className="description-prose">
              {job.description ? job.description.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              )) : (
                <p>No description available. Visit the company careers page for full details.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Job detail error:", err);
    notFound();
  }
}
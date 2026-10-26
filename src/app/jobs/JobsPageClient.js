"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { searchFreehireJobs, mapFreehireJob } from "@/lib/freehire";
import "./jobs.scss";

export default function JobsPageClient({ initialJobs = [] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [loading, setLoading] = useState(!initialJobs.length);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (searchQuery) filters.query = searchQuery;
      if (workModeFilter !== "all") filters.workMode = workModeFilter;
      if (categoryFilter !== "all") filters.category = categoryFilter;

      const rawJobs = await searchFreehireJobs(filters);
      const mappedJobs = rawJobs.map(mapFreehireJob);
      setJobs(mappedJobs);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, workModeFilter, categoryFilter]);

  useEffect(() => {
    if (!initialJobs.length) {
      fetchJobs();
    }
  }, []); // Empty dependency array so it only runs once on mount

  // Extract unique skills and categories for filter pills
  const allSkills = Array.from(new Set(jobs.flatMap(j => j.skills || [])));
  const allCategories = Array.from(new Set(jobs.map(j => j.category).filter(Boolean)));

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesWorkMode = workModeFilter === "all" || job.workMode === workModeFilter;
    const matchesCategory = categoryFilter === "all" || job.category === categoryFilter;
    const matchesSkill = selectedSkill === "all" || (job.skills || []).includes(selectedSkill);

    return matchesSearch && matchesWorkMode && matchesCategory && matchesSkill;
  });

  return (
    <div className="jobs-container">
      {/* Hero Header */}
      <header className="jobs-hero">
        <div className="jobs-hero-content">
          <div className="jobs-badge">
            <span className="badge-dot"></span>
            Live IT Jobs from freehire.me
          </div>
          <h1>Every IT job, straight from the source.</h1>
          <p>
            3.3M+ live postings pulled directly from company career pages — no recruiters, no reposts, no dead links.
          </p>
          <div className="jobs-stats-counter">
            <strong>{jobs.length}+</strong> Active Positions Found
          </div>
        </div>
      </header>

      {/* Search and Filters Bar */}
      <section className="jobs-filter-section">
        <div className="search-bar-wrapper">
          <svg className="search-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by role, company, or skill (e.g. React, Stripe, Remote)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>×</button>
          )}
        </div>

        <div className="filter-dropdowns">
          <div className="filter-group">
            <label>Work Mode</label>
            <select value={workModeFilter} onChange={(e) => setWorkModeFilter(e.target.value)}>
              <option value="all">All Work Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skill Pills */}
        <div className="skill-pills-row">
          <button
            className={`skill-pill ${selectedSkill === "all" ? "active" : ""}`}
            onClick={() => setSelectedSkill("all")}
          >
            All Skills
          </button>
          {allSkills.slice(0, 12).map(skill => (
            <button
              key={skill}
              className={`skill-pill ${selectedSkill === skill ? "active" : ""}`}
              onClick={() => setSelectedSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </section>

      {/* Job Listings Grid */}
      <main className="jobs-grid-section">
        {loading ? (
          <div className="jobs-loading">Fetching live opportunities from freehire.me...</div>
        ) : error ? (
          <div className="jobs-empty">
            <h3>Unable to load jobs</h3>
            <p>{error}</p>
            <button className="secondary-btn" onClick={fetchJobs}>
              Retry
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty">
            <h3>No jobs found matching your criteria</h3>
            <p>Try adjusting your search filters or browse all categories.</p>
            <button className="secondary-btn" onClick={() => { setSearchQuery(""); setWorkModeFilter("all"); setCategoryFilter("all"); setSelectedSkill("all"); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <article key={job.id || job.slug} className="job-card">
                <div className="job-card-header">
                  <div className="job-company-badge">
                    {job.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="job-company-name">{job.company}</span>
                    <span className="job-posted-time">
                      {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                </div>

                <h3 className="job-title">
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </h3>

                <div className="job-meta-row">
                  <span className="job-location">📍 {job.location}</span>
                  <span className={`job-workmode-badge ${job.workMode}`}>
                    {job.workMode || "remote"}
                  </span>
                </div>

                <p className="job-snippet">
                  {job.description ? job.description.slice(0, 130) + "..." : "No description preview."}
                </p>

                <div className="job-skills-list">
                  {(job.skills || []).slice(0, 5).map(skill => (
                    <span key={skill} className="job-skill-tag">{skill}</span>
                  ))}
                  {(job.skills || []).length > 5 && (
                    <span className="job-skill-tag more">+{(job.skills.length - 5)} more</span>
                  )}
                </div>

                <div className="job-card-footer">
                  <Link href={`/jobs/${job.slug}`} className="view-details-link">
                    View Details →
                  </Link>
                  <a
                    href={job.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apply-external-btn"
                  >
                    {job.directApply ? "Apply via freehire ↗" : "Apply on Company Site ↗"}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
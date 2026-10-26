"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import "./navbar.scss";

const Navbar = ({ theme, onToggleTheme }) => {
  const [activeSection, setActiveSection] = useState("about");
  const { isAdmin, loading } = useAdminAuth();
  const resumeUrl = "/data/Resume.pdf";

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const sections = ["about", "experience", "projects", "expertise", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) => right.intersectionRatio - left.intersectionRatio,
          );
        if (visibleSections[0]) setActiveSection(visibleSections[0].target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const navItems = [
    { href: "#about", label: "Crew", num: "01", section: "about" },
    { href: "#expertise", label: "Field notes", num: "02", section: "expertise" },
    { href: "#projects", label: "Projects", num: "03", section: "projects" },
    { href: "#contact", label: "Signal", num: "04", section: "contact" },
    { href: "/resume", label: "Resume lab", num: "05" },
  ];

  if (isAdmin) {
    navItems.push({ href: "/jobs", label: "Jobs board", num: "06" });
  }

  return (
    <header className="navbar-wrap" id="top">
      <nav className="navbar container" aria-label="Main navigation">
        <a className="logo" href="#top" aria-label="Sanjay Amarnath, home">
          <span className="logo-monogram">
            <span className="logo-mark-initial">S</span>
            <span className="logo-mark-period">.</span>
          </span>
          <span className="logo-name">
            SANJAY AMARNATH<small>DEVELOPER / EXPLORER</small>
          </span>
        </a>
        <div className="pages-div">
          {navItems.map((item) => (
            <a
              key={item.href}
              className="topics"
              href={item.href}
              aria-current={item.section && activeSection === item.section ? "location" : undefined}
            >
              <span>{item.num}</span> {item.label}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
                <path d="m16.5 3 .5 1.5 1.5.5-1.5.5-.5 1.5L16 5.5l-1.5-.5 1.5-.5.5-1.5Z" />
              </svg>
            )}
          </button>
          <a
            className="resume-link"
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span>Resume</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11m-4-4 4 4-4 4" />
            </svg>
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

import { useEffect, useState } from "react";
import "./navbar.scss";
import { getDownloadURL, ref } from "firebase/storage";
import {
  getFirebaseServices,
  isFirebaseConfigured,
  RESUME_STORAGE_PATH,
} from "../../firebase";

const Navbar = ({ theme, onToggleTheme }) => {
  const [activeSection, setActiveSection] = useState("about");
  const [resumeUrl, setResumeUrl] = useState("/data/Resume.pdf");

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    let isMounted = true;
    try {
      const { storage } = getFirebaseServices();
      getDownloadURL(ref(storage, RESUME_STORAGE_PATH))
        .then((url) => {
          if (isMounted) setResumeUrl(url);
        })
        .catch((error) => {
          if (error.code !== "storage/object-not-found") {
            console.error("Could not load the hosted resume:", error);
          }
        });
    } catch (error) {
      console.error("Could not initialize Firebase for the resume:", error);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const sections = ["about", "experience", "expertise", "contact"]
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
          <a
            className="topics"
            href="#about"
            aria-current={activeSection === "about" ? "location" : undefined}
          >
            <span>01</span> Crew
          </a>
          <a
            className="topics"
            href="#expertise"
            aria-current={
              activeSection === "expertise" ? "location" : undefined
            }
          >
            <span>02</span> Field notes
          </a>
          <a
            className="topics"
            href="#contact"
            aria-current={activeSection === "contact" ? "location" : undefined}
          >
            <span>03</span> Signal
          </a>
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

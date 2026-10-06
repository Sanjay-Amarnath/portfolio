import { useEffect, useState } from "react";
import "./profile.scss";
import { ReactComponent as Instagram } from "../../assets/svg/instagram.svg";
import { ReactComponent as LinkedIn } from "../../assets/svg/linkedin.svg";
import { DEFAULT_SOCIAL_LINKS, loadSocialLinks } from "../../socialLinks";
import ParticleTextCanvas from "../animations/ParticleTextCanvas";

const Profile = () => {
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    let isMounted = true;
    loadSocialLinks()
      .then((links) => {
        if (isMounted) setSocialLinks(links);
      })
      .catch((error) => {
        console.error("Could not load portfolio social links:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      className="Profile-section"
      id="about"
      aria-labelledby="hero-title"
    >
      <div className="hero-coordinate-grid" aria-hidden="true" />
      <div className="hero-map-label" aria-hidden="true">
        <span>CHART 01</span>
        <span>PERNAMBUT — INDIA</span>
      </div>
      <div className="hero-copy">
        <p className="hero-kicker">
          <span className="status-dot" aria-hidden="true" />
          FRONTEND DEVELOPER <span className="kicker-divider">/</span> OPEN TO
          THE NEXT VOYAGE
        </p>
        <p className="hero-overline">A DEVELOPER’S FIELD NOTES — 2026</p>
        <h1 id="hero-title">
          Curiosity is
          <br />
          my <em>compass.</em>
        </h1>
        <p className="hero-description">
          I’m Sanjay Amarnath, a React developer with 5+ years of experience
          turning ambitious ideas into intuitive, responsive interfaces.
          Thoughtful by design. Solid under the surface.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#contact">
            Start a conversation
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11m-4-4 4 4-4 4" />
            </svg>
          </a>
          <a className="text-action" href="#expertise">
            Explore the log <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-socials" aria-label="Social profiles">
          <span>RADIO LINKS</span>
          <a
            href={socialLinks.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <LinkedIn />
          </a>
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <Instagram />
          </a>
          <a
            className="social-x"
            href={socialLinks.twitter}
            target="_blank"
            rel="noreferrer"
            aria-label="X"
          >
            𝕏
          </a>
        </div>
      </div>

      <div className="hero-illustration">
        <div className="chart-ring chart-ring-outer" aria-hidden="true" />
        <div className="chart-ring chart-ring-inner" aria-hidden="true" />
        <div className="chart-cross chart-cross-one" aria-hidden="true" />
        <div className="chart-cross chart-cross-two" aria-hidden="true" />
        <div className="compass-rose" aria-hidden="true">
          <span className="rose-north">N</span>
          <span className="rose-east">E</span>
          <span className="rose-south">S</span>
          <span className="rose-west">W</span>
          <span className="rose-needle" />
        </div>
        <ParticleTextCanvas text="MAKE WAVES" />
        <div className="portrait-card">
          <span className="portrait-card-tag">THE HUMAN BEHIND THE PIXELS</span>
          <img src="/images/sanjay.png" alt="Portrait of Sanjay Amarnath" />
          <div className="portrait-card-caption">
            <span>SA / 01</span>
            <span>BUILD WITH INTENT</span>
          </div>
        </div>
        <div className="experience-stamp">
          <strong>
            5<sup>+</sup>
          </strong>
          <span>
            YEARS
            <br />
            ON DECK
          </span>
        </div>
        <div className="hero-squiggle" aria-hidden="true">
          <svg viewBox="0 0 180 54">
            <path d="M2 36C25 36 25 12 49 12s24 30 49 30 24-29 49-29 23 16 31 16" />
            <path d="M2 48C25 48 25 24 49 24s24 30 49 30 24-29 49-29 23 16 31 16" />
          </svg>
        </div>
        <p className="illustration-caption">
          A LITTLE CURIOSITY GOES A LONG WAY.
        </p>
      </div>
      <a className="scroll-indicator" href="#experience">
        <span>SCROLL TO EXPLORE</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import "./profile.scss";
import { ReactComponent as Instagram } from "../../assets/svg/instagram.svg";
import { ReactComponent as LinkedIn } from "../../assets/svg/linkedin.svg";
import SanjayPic from "../../assets/image/sanjay.png";
import { getFirebaseServices, isFirebaseConfigured } from "../../firebase";
import { DEFAULT_SOCIAL_LINKS, loadSocialLinks } from "../../socialLinks";
import SplitFlapText from "../animations/SplitFlapText";

const Profile = () => {
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    let isMounted = true;
    try {
      const { storage } = getFirebaseServices();
      loadSocialLinks(storage)
        .then((links) => {
          if (isMounted) setSocialLinks(links);
        })
        .catch((error) => {
          console.error("Could not load portfolio social links:", error);
        });
    } catch (error) {
      console.error("Could not initialize Firebase for social links:", error);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="Profile-section container" id="about" aria-labelledby="hero-title">
      <div className="user-details-div">
        <p className="hero-kicker">
          <span className="status-dot" aria-hidden="true" />
          REACT DEVELOPER <span className="kicker-divider">/</span> UI ENGINEERING
        </p>
        <h1 id="hero-title">
          I build digital
          <br />
          <SplitFlapText text="experiences." />
        </h1>
        <p className="hero-description">
          I’m Sanjay Amarnath — a React developer with 5+ years of experience
          creating thoughtful, responsive interfaces. I turn complex ideas
          into clear, polished experiences, from reusable components to
          connected APIs.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#contact">
            Let’s work together
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11m-4-4 4 4-4 4" />
            </svg>
          </a>
          <a className="text-action" href="#expertise">Explore my expertise</a>
        </div>
        <div className="hero-socials" aria-label="Social profiles">
          <span>FIND ME</span>
          <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <LinkedIn />
          </a>
          <a href={socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram />
          </a>
          <a className="social-x" href={socialLinks.twitter} target="_blank" rel="noreferrer" aria-label="X">
            𝕏
          </a>
        </div>
      </div>
      <div className="user-profile-div" aria-label="Sanjay Amarnath portrait">
        <div className="portrait-scene">
          <div className="portrait-orbit portrait-orbit-one" />
          <div className="portrait-orbit portrait-orbit-two" />
          <div className="portrait-backdrop">
            <span className="portrait-index">SA <i>/ REACT</i></span>
            <span className="portrait-stamp">DESIGN<br />WITH<br /><b>INTENT.</b></span>
          </div>
          <div className="portrait-card">
            <img src={SanjayPic} alt="Portrait of Sanjay Amarnath" />
          </div>
          <div className="experience-float">
            <strong>5<span>+</span></strong>
            <span>years<br />of experience</span>
          </div>
          <span className="hero-coordinate">LAT 12.9° N&nbsp; / &nbsp;MADE FOR THE WEB</span>
        </div>
      </div>
    </section>
  );
};

export default Profile;

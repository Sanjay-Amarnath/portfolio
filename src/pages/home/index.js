import { useEffect, useState } from "react";
import Contact from "../../component/contact";
import Count from "../../component/count/count";
import Footer from "../../component/footer";
import Navbar from "../../component/navbar";
import Profile from "../../component/profile";
import Skills from "../../component/skills/skills";
import LoadingScreen from "../../component/animations/LoadingScreen";
import CompassCursor from "../../component/animations/CompassCursor";

const THEME_STORAGE_KEY = "portfolio-theme";

function prefersReducedMotion() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const Home = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [isLoading, setIsLoading] = useState(
    () => !window.sessionStorage.getItem("portfolio-intro-seen")
  );

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!isLoading) return undefined;
    if (prefersReducedMotion()) {
      window.sessionStorage.setItem("portfolio-intro-seen", "true");
      setIsLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      window.sessionStorage.setItem("portfolio-intro-seen", "true");
      setIsLoading(false);
    }, 1100);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal-up");
    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="portfolio-shell" data-theme={theme}>
      <CompassCursor />
      {isLoading && <LoadingScreen />}
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      />
      <main>
        <Profile />
        <Count />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Home;

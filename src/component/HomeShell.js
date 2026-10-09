"use client";

import { useEffect, useState } from "react";
import Contact from "./contact";
import Count from "./count/count";
import Footer from "./footer";
import Navbar from "./navbar";
import Profile from "./profile";
import Skills from "./skills/skills";
import Projects from "./projects/Projects";
import LoadingScreen from "./animations/LoadingScreen";
import CompassCursor from "./animations/CompassCursor";

const THEME_STORAGE_KEY = "portfolio-theme";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const HomeShell = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.sessionStorage.getItem("portfolio-intro-seen");
  });

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
        onToggleTheme={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }
      />
      <main>
        <Profile />
        <Count />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default HomeShell;


"use client";

import { useEffect, useRef, useState } from "react";
import "./not-found.scss";

const WIN_SCORE = 5;

const CATCH_MESSAGES = [
  "Got it!",
  "Nice catch!",
  "That one tried to run.",
  "Compass captured.",
  "It stood no chance.",
  "Oof, that one stung.",
  "Victory is yours.",
];

const GIVE_UP_MESSAGES = [
  "The compass wins this round.",
  "It saw you coming… and ran.",
  "You tried. The compass did not.",
  "The map wins. Again.",
];

const STAGE_W = () => (typeof window !== "undefined" ? Math.min(window.innerWidth - 48, 560) : 560);
const STAGE_H = 340;

function randomPos() {
  const w = STAGE_W();
  const bw = 150;
  const bh = 60;
  const m = 16;
  return {
    x: m + Math.random() * Math.max(0, w - bw - m * 2),
    y: m + Math.random() * Math.max(0, STAGE_H - bh - m * 2),
  };
}

const NotFoundPage = () => {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [message, setMessage] = useState("Catch the compass. It's shy.");
  const [won, setWon] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [shake, setShake] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    setPosition(randomPos());
    if (typeof window === "undefined") return;
    const onResize = () => setPosition(randomPos());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.code === "Space" && !disabled) {
        event.preventDefault();
        catchIt();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled]);

  const flee = () => {
    if (won || gaveUp) return;
    setPosition(randomPos());
    setShake(true);
    setTimeout(() => setShake(false), 260);
  };

  const catchIt = () => {
    if (won || gaveUp) return;
    const nextScore = score + 1;
    setScore(nextScore);
    setMessage(CATCH_MESSAGES[Math.floor(Math.random() * CATCH_MESSAGES.length)]);
    if (nextScore >= WIN_SCORE) {
      setWon(true);
      setMessage("You calibrated the compass! Plotting course home…");
      setDisabled(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2200);
      return;
    }
    setPosition(randomPos());
  };

  const giveUp = () => {
    setGaveUp(true);
    setMessage(GIVE_UP_MESSAGES[Math.floor(Math.random() * GIVE_UP_MESSAGES.length)]);
  };

  const resetGame = () => {
    setScore(0);
    setWon(false);
    setGaveUp(false);
    setMessage("Catch the compass. It's shy.");
    setPosition(randomPos());
  };

  return (
    <main className="nf-root">
      <div className="nf-noise" aria-hidden="true" />
      <div className="nf-grid-overlay" aria-hidden="true" />

      <header className="nf-topbar">
        <span className="nf-tag">ERROR 404 — CHARTER DEFECT</span>
        <span className="nf-coords">LAT: ??°??' / LON: ??°??'</span>
      </header>

      <section className="nf-body">
        <div className="nf-code">404</div>
        <h1 className="nf-title">
          The chart ends here.
          <br />
          <em>The compass has a mind of its own.</em>
        </h1>
        <p className="nf-lead">
          The route you requested isn&apos;t on this map. Catch the wandering compass {WIN_SCORE} times to recalibrate and return home, or use the direct return below.
        </p>

        <div className="nf-arena" role="region" aria-label="Catch the compass mini-game">
          <div className="nf-hud">
            <span className="nf-score">
              CALIBRATION: <strong>{score}</strong> / {WIN_SCORE}
            </span>
            <span className={`nf-msg ${shake ? "nf-shake" : ""}`} aria-live="polite">
              {message}
            </span>
          </div>

          <div className="nf-stage">
            <div className="nf-stage-grid" aria-hidden="true" />
            <div className="nf-stage-crosshairs" aria-hidden="true" />

            <button
              ref={buttonRef}
              type="button"
              className={`nf-target ${shake ? "nf-fleeing" : ""} ${won ? "nf-won" : ""}`}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              }}
              onMouseEnter={flee}
              onTouchStart={flee}
              onClick={catchIt}
              disabled={disabled}
              aria-label="Catch the wandering compass target"
            >
              <span className="nf-target-ring" aria-hidden="true" />
              <span className="nf-target-needle" aria-hidden="true" />
              <span className="nf-target-label">COMPASS</span>
            </button>
          </div>

          <div className="nf-controls">
            <span className="nf-hint">Hint: Hover / tap to provoke it. Spacebar also attempts a catch.</span>
            {!won && !gaveUp && (
              <button type="button" className="nf-ghost-btn" onClick={giveUp}>
                Give up &amp; return
              </button>
            )}
            {gaveUp && (
              <button type="button" className="nf-ghost-btn" onClick={resetGame}>
                Try again
              </button>
            )}
          </div>
        </div>

        <nav className="nf-actions" aria-label="Navigation recovery">
          <a href="/" className="nf-btn-primary">
            <span>Return to charted waters</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11m-4-4 4 4-4 4" />
            </svg>
          </a>
          <a href="/projects" className="nf-btn-ghost">
            View log of works
          </a>
          <a href="/#contact" className="nf-btn-ghost">
            Signal the developer
          </a>
        </nav>
      </section>

      <footer className="nf-footer">
        <span>SANJAY AMARNATH — PORTFOLIO</span>
        <span>LOST BUT NOT ADRIFT</span>
      </footer>
    </main>
  );
};

export default NotFoundPage;

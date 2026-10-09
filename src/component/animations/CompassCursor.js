"use client";

import { useEffect, useRef } from "react";

const CompassCursor = () => {
  const cursorRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(hover: none), (prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const cursor = cursorRef.current;
    if (!cursor) return undefined;
    let frame = 0;
    let x = -100;
    let y = -100;

    const moveCursor = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frame = 0;
      });
    };

    const setHovering = (event) => {
      if (event.target.closest("a, button, input, textarea, [role='button']")) {
        cursor.classList.add("is-hovering");
      }
    };
    const clearHovering = () => cursor.classList.remove("is-hovering");

    window.addEventListener("pointermove", moveCursor, { passive: true });
    document.addEventListener("pointerover", setHovering);
    document.addEventListener("pointerout", clearHovering);
    document.body.classList.add("has-compass-cursor");

    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("pointerover", setHovering);
      document.removeEventListener("pointerout", clearHovering);
      document.body.classList.remove("has-compass-cursor");
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="compass-cursor" ref={cursorRef} aria-hidden="true">
      <span className="cursor-north">N</span>
      <span className="cursor-needle" />
      <span className="cursor-center" />
    </div>
  );
};

export default CompassCursor;

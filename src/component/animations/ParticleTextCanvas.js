"use client";

import { useEffect, useRef } from "react";

const ParticleTextCanvas = ({ text = "MAKE WAVES" }) => {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host || typeof window.CanvasRenderingContext2D === "undefined") {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) return undefined;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles = [];

    const createParticles = () => {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const mask = document.createElement("canvas");
      mask.width = Math.round(width);
      mask.height = Math.round(height);
      const maskContext = mask.getContext("2d", { willReadFrequently: true });
      if (!maskContext) return;

      const maxFontSize = Math.min(width / (text.length * 0.58), height * 0.52, 96);
      const fontSize = Math.max(24, maxFontSize);
      maskContext.fillStyle = "#fff";
      maskContext.font = `700 ${fontSize}px "DM Sans", sans-serif`;
      maskContext.textAlign = "center";
      maskContext.textBaseline = "middle";
      maskContext.fillText(text, width / 2, height / 2, width * 0.94);

      const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
      particles = [];
      const spacing = width < 420 ? 4 : 3;
      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          if (pixels[(y * mask.width + x) * 4 + 3] > 100) {
            particles.push({
              x: x + (Math.random() - 0.5) * 22,
              y: y + (Math.random() - 0.5) * 22,
              homeX: x,
              homeY: y,
              size: Math.random() * 0.9 + 1.6,
              phase: Math.random() * Math.PI * 2,
            });
          }
        }
      }
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      const palette = getComputedStyle(host);
      const particleColor = palette.getPropertyValue("--particle-color").trim() || "#315b27";
      const accentColor = palette.getPropertyValue("--particle-accent").trim() || "#c65636";

      particles.forEach((particle) => {
        let targetX = particle.homeX;
        let targetY = particle.homeY + Math.sin(time * 0.0008 + particle.phase) * 2;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = 64;
          if (distance > 0 && distance < radius) {
            const push = (radius - distance) / radius * 30;
            targetX += (dx / distance) * push;
            targetY += (dy / distance) * push;
          }
        }

        particle.x += (targetX - particle.x) * (reduceMotion ? 1 : 0.08);
        particle.y += (targetY - particle.y) * (reduceMotion ? 1 : 0.08);
        context.globalAlpha = 0.48 + (Math.sin(time * 0.001 + particle.phase) + 1) * 0.19;
        context.fillStyle = particle.phase > 5.1 ? accentColor : particleColor;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      if (!reduceMotion) frame = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    createParticles();
    frame = window.requestAnimationFrame(draw);
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(createParticles);
    if (resizeObserver) {
      resizeObserver.observe(host);
    }
    window.addEventListener("resize", createParticles);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(frame);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", createParticles);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [text]);

  return (
    <div
      className="particle-text-stage"
      ref={hostRef}
      data-text={text}
      role="img"
      aria-label={`${text}, interactive particle text`}
    >
      <span className="visually-hidden">{text}</span>
      <canvas
        ref={canvasRef}
        className="particle-text-canvas"
        aria-hidden="true"
      />
      <span className="particle-text-label">MOVE YOUR POINTER THROUGH THE CURRENT</span>
    </div>
  );
};

export default ParticleTextCanvas;

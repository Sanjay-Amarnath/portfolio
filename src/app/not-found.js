"use client";

import dynamic from 'next/dynamic';
import "./not-found.scss";

// Load the 3D game only on the client side to avoid SSR/hydration issues
const GameCanvas = dynamic(() => import("@/component/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="nf-game-loading" role="status" aria-label="Loading the Lost Internet game">
      <div className="nf-loading-content">
        <div className="nf-loading-spinner" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h2>LOST<span className="nf-accent">.NET</span></h2>
        <p>INITIALIZING CONNECTION...</p>
        <div className="nf-loading-bar">
          <div className="nf-loading-progress" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  ),
});

const NotFoundPage = () => {
  return (
    <main className="nf-root">
      <div className="nf-noise" aria-hidden="true" />
      <div className="nf-grid-overlay" aria-hidden="true" />

      <GameCanvas />
    </main>
  );
};

export default NotFoundPage;
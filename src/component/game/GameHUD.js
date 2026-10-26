"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2, VolumeX, Pause, RotateCcw, Home,
  Target, HelpCircle, ChevronDown, ChevronUp,
  Wifi, WifiOff
} from 'lucide-react';
import useGameState from './useGameState';
import useKeyboardControls from './useKeyboardControls';

const GameHUD = () => {
  const {
    gameState,
    fragmentsCollected,
    portalUnlocked,
    soundEnabled,
    reducedMotion,
    setSoundEnabled,
    setReducedMotion,
    pauseGame,
    resumeGame,
    resetGame,
    startGame,
  } = useGameState();

  const { isPointerLocked } = useKeyboardControls();

  // Handle keyboard shortcuts for HUD buttons
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'KeyP' && gameState === 'playing') {
        pauseGame();
      } else if (e.code === 'KeyR' && (gameState === 'paused' || gameState === 'gameover')) {
        resetGame();
      } else if (e.code === 'KeyH') {
        // Could toggle help panel
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, pauseGame, resetGame]);

  const isPlaying = gameState === 'playing';
  const isPaused = gameState === 'paused';
  const isVictory = gameState === 'victory';
  const isGameOver = gameState === 'gameover';
  const isReady = gameState === 'ready';
  const isLoading = gameState === 'loading';

  if (isLoading) {
    return (
      <div className="game-hud loading-screen" role="status" aria-label="Loading the Lost Internet">
        <div className="loading-content">
          <div className="loading-spinner" aria-hidden="true">
            <div className="spinner-ring"></div>
            <div className="spinner-ring reverse"></div>
            <div className="spinner-core"></div>
          </div>
          <h2 className="loading-title">LOST.NET</h2>
          <p className="loading-subtitle">INITIALIZING CONNECTION...</p>
          <div className="loading-bar">
            <div className="loading-progress" aria-hidden="true"></div>
          </div>
          <p className="loading-hint">PROCEDURALLY GENERATING WORLD...</p>
        </div>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="game-hud ready-screen" role="region" aria-label="Game start screen">
        <div className="ready-content">
          <div className="ready-logo" aria-hidden="true">
            <span className="logo-text">LOST<span className="accent">.NET</span></span>
            <div className="logo-glitch" aria-hidden="true">LOST.NET</div>
          </div>
          <h1 className="ready-title">CONNECTION LOST</h1>
          <p className="ready-description">
            You've wandered into <strong>The Lost Internet</strong> — a digital void where
            forgotten pages drift in the darkness. Three data fragments hold the key to
            reopening the portal home.
          </p>

          <div className="ready-objectives">
            <h3>MISSION</h3>
            <ul>
              <li><span className="obj-number">01</span> EXPLORE the floating island</li>
              <li><span className="obj-number">02</span> RECOVER 3 data fragments</li>
              <li><span className="obj-number">03</span> UNLOCK the portal & return</li>
            </ul>
          </div>

          <div className="ready-controls">
            <h3>CONTROLS</h3>
            <div className="control-row">
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <span>Move</span>
            </div>
            <div className="control-row">
              <kbd>SPACE</kbd> <span>Jump</span>
            </div>
            <div className="control-row">
              <kbd>SHIFT</kbd> <span>Sprint</span>
            </div>
            <div className="control-row">
              <kbd>MOUSE</kbd> <span>Look around</span>
            </div>
            <div className="control-row">
              <kbd>ESC</kbd> <span>Pause</span>
            </div>
            <div className="control-row">
              <kbd>M</kbd> <span>Toggle sound</span>
            </div>
          </div>

          <motion.button
            className="ready-start-btn"
            onClick={startGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Target className="btn-icon" aria-hidden="true" />
            START EXPLORING
          </motion.button>

          <div className="ready-footer">
            <button
              className="reduced-motion-toggle"
              onClick={() => setReducedMotion(!reducedMotion)}
              aria-pressed={reducedMotion}
            >
              {reducedMotion ? '✓' : '☐'} REDUCED MOTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <header className={`game-hud top-bar ${isPaused ? 'paused' : ''} ${isVictory ? 'victory' : ''} ${isGameOver ? 'gameover' : ''}`}>
        <div className="hud-left">
          <div className="hud-logo">
            <span className="logo-main">LOST<span className="accent">.NET</span></span>
            <span className="logo-version">v4.04</span>
          </div>
          <div className={`hud-status ${portalUnlocked ? 'connected' : ''}`}>
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-text">
              {portalUnlocked ? 'PORTAL ACTIVE' : 'CONNECTION LOST'}
            </span>
          </div>
        </div>

        <div className="hud-center">
          <div className="hud-404">
            <span className="code-404">404</span>
            <span className="code-label">NOT FOUND</span>
          </div>
          <p className="hud-subtitle">
            {portalUnlocked
              ? 'PORTAL OPEN — RETURN HOME'
              : 'Find 3 data fragments to reopen the portal'}
          </p>
        </div>

        <div className="hud-right">
          <button
            className="hud-btn sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Sound ON (M to toggle)' : 'Sound OFF (M to toggle)'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {isPlaying && (
            <button
              className="hud-btn pause-btn"
              onClick={pauseGame}
              aria-label="Pause game (ESC)"
              title="Pause (ESC)"
            >
              <Pause size={18} />
            </button>
          )}

          {isPaused && (
            <button
              className="hud-btn resume-btn"
              onClick={resumeGame}
              aria-label="Resume game (ESC)"
              title="Resume (ESC)"
            >
              <RotateCcw size={18} />
            </button>
          )}

          {(isPaused || isVictory || isGameOver) && (
            <button
              className="hud-btn restart-btn"
              onClick={resetGame}
              aria-label="Restart game (R)"
              title="Restart (R)"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Bottom Bar */}
      <footer className={`game-hud bottom-bar ${isPaused ? 'paused' : ''}`}>
        <div className="hud-bottom-left">
          <div className="controls-hint">
            <span className="hint-label">CONTROLS</span>
            <div className="control-keys">
              <div className="move-keys">
                <kbd>W</kbd>
                <div className="key-row">
                  <kbd>A</kbd>
                  <kbd>S</kbd>
                  <kbd>D</kbd>
                </div>
              </div>
              <div className="action-keys">
                <span className="key-space"><kbd>SPACE</kbd> JUMP</span>
                <span className="key-shift"><kbd>SHIFT</kbd> SPRINT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hud-bottom-center">
          <div className={`progress-tracker ${portalUnlocked ? 'complete' : ''}`}>
            <div className="tracker-label">
              <Target size={14} aria-hidden="true" />
              DATA RECOVERED
            </div>
            <div className="tracker-bar">
              <div
                className="tracker-fill"
                style={{ width: `${(fragmentsCollected / 3) * 100}%` }}
                aria-valuenow={fragmentsCollected}
                aria-valuemin={0}
                aria-valuemax={3}
                role="progressbar"
              ></div>
            </div>
            <div className="tracker-count">
              <span className="count-current">{fragmentsCollected}</span>
              <span className="count-separator">/</span>
              <span className="count-total">3</span>
              <span className="count-unit">FRAGMENTS</span>
            </div>
            {portalUnlocked && (
              <div className="tracker-complete">
                <RotateCcw className="spin" size={14} aria-hidden="true" />
                PORTAL UNLOCKED
              </div>
            )}
          </div>
        </div>

        <div className="hud-bottom-right">
          <button
            className={`hud-btn home-btn ${portalUnlocked ? 'active' : ''}`}
            onClick={() => window.location.href = '/'}
            aria-label="Return to homepage"
            disabled={!portalUnlocked && !isVictory && !isGameOver}
            title={portalUnlocked || isVictory || isGameOver ? 'Return home' : 'Unlock portal first'}
          >
            <Home size={18} aria-hidden="true" />
            <span>RETURN HOME</span>
            {portalUnlocked && <span className="btn-arrow">→</span>}
          </button>
        </div>
      </footer>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="game-hud pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <div className="pause-panel">
            <h2 id="pause-title">GAME PAUSED</h2>
            <p>The Lost Internet waits for your return.</p>
            <div className="pause-actions">
              <button
                className="pause-btn primary"
                onClick={resumeGame}
                autoFocus
              >
                <RotateCcw size={18} aria-hidden="true" />
                RESUME EXPLORING
              </button>
              <button
                className="pause-btn secondary"
                onClick={resetGame}
              >
                <RotateCcw size={18} aria-hidden="true" />
                RESTART
              </button>
              <button
                className="pause-btn ghost"
                onClick={() => window.location.href = '/'}
              >
                <Home size={18} aria-hidden="true" />
                ABANDON MISSION
              </button>
            </div>
            <div className="pause-hint">
              Press <kbd>ESC</kbd> to resume
            </div>
          </div>
        </div>
      )}

      {/* Victory Overlay */}
      {isVictory && (
        <div className="game-hud victory-overlay" role="dialog" aria-modal="true" aria-labelledby="victory-title">
          <motion.div
            className="victory-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <div className="victory-icon" aria-hidden="true">
              <RotateCcw size={64} className="victory-spin" />
            </div>
            <h2 id="victory-title">CONNECTION RESTORED</h2>
            <p className="victory-message">
              All data fragments recovered. The portal has stabilized.
            </p>
            <div className="victory-stats">
              <div className="stat">
                <span className="stat-value">3</span>
                <span className="stat-label">FRAGMENTS</span>
              </div>
              <div className="stat">
                <span className="stat-value">100%</span>
                <span className="stat-label">SYNC COMPLETE</span>
              </div>
            </div>
            <div className="victory-actions">
              <button
                className="victory-btn primary"
                onClick={() => window.location.href = '/'}
                autoFocus
              >
                <Home size={20} aria-hidden="true" />
                RETURN HOME
              </button>
              <button
                className="victory-btn secondary"
                onClick={resetGame}
              >
                <RotateCcw size={20} aria-hidden="true" />
                EXPLORE AGAIN
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="game-hud gameover-overlay" role="dialog" aria-modal="true" aria-labelledby="gameover-title">
          <div className="gameover-panel">
            <div className="gameover-icon" aria-hidden="true">
              <WifiOff size={64} />
            </div>
            <h2 id="gameover-title">SIGNAL LOST</h2>
            <p className="gameover-message">
              You fell into the void. The Lost Internet claims another wanderer.
            </p>
            <div className="gameover-stats">
              <div className="stat">
                <span className="stat-value">{fragmentsCollected}</span>
                <span className="stat-label">FRAGMENTS FOUND</span>
              </div>
            </div>
            <div className="gameover-actions">
              <button
                className="gameover-btn primary"
                onClick={resetGame}
                autoFocus
              >
                <RotateCcw size={20} aria-hidden="true" />
                TRY AGAIN
              </button>
              <button
                className="gameover-btn secondary"
                onClick={() => window.location.href = '/'}
              >
                <Home size={20} aria-hidden="true" />
                RETURN HOME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Touch Controls */}
      <div className="mobile-controls" aria-hidden="true">
        <div className="mobile-joystick">
          <div className="joystick-base">
            <div className="joystick-stick"></div>
          </div>
        </div>
        <div className="mobile-buttons">
          <button className="mobile-btn jump-btn" aria-label="Jump">
            <span>JUMP</span>
          </button>
          <button className="mobile-btn sprint-btn" aria-label="Sprint">
            <span>SPRINT</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default GameHUD;
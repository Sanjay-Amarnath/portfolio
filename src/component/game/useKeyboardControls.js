import { useEffect, useRef } from 'react';
import useGameState from './useGameState';

const useKeyboardControls = () => {
  const keysRef = useRef({});
  const pointerLockedRef = useRef(false);
  const gameState = useGameState((s) => s.gameState);

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;

      // Space to jump
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
      }

      // Escape to pause
      if (e.code === 'Escape') {
        if (gameState === 'playing') {
          useGameState.getState().pauseGame();
        } else if (gameState === 'paused') {
          useGameState.getState().resumeGame();
        }
      }

      // Toggle sound with M
      if (e.code === 'KeyM') {
        useGameState.getState().toggleSound();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    const handlePointerLockChange = () => {
      pointerLockedRef.current = document.pointerLockElement === document.body;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [gameState]);

  const getKeys = () => keysRef.current;
  const isPointerLocked = () => pointerLockedRef.current;

  return { getKeys, isPointerLocked };
};

export default useKeyboardControls;
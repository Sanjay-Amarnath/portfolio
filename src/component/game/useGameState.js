import { create } from 'zustand';

const initialState = {
  // Game states: 'loading' | 'ready' | 'playing' | 'paused' | 'victory' | 'gameover'
  gameState: 'loading',
  // Collected fragments count (0-3)
  fragmentsCollected: 0,
  // Portal unlocked state
  portalUnlocked: false,
  // Player position
  playerPosition: { x: 0, y: 1.6, z: 0 },
  // Player velocity
  playerVelocity: { x: 0, y: 0, z: 0 },
  // Camera rotation
  cameraRotation: { x: 0, y: 0 },
  // Sound enabled
  soundEnabled: true,
  // Reduced motion preference
  reducedMotion: false,
  // WebGL available
  webglAvailable: true,
};

const useGameState = create((set, get) => ({
  ...initialState,

  setGameState: (state) => set({ gameState: state }),

  setFragmentsCollected: (count) => set({ fragmentsCollected: count }),

  addFragment: () => {
    const newCount = get().fragmentsCollected + 1;
    set({ fragmentsCollected: newCount });
    if (newCount >= 3) {
      get().unlockPortal();
    }
  },

  unlockPortal: () => set({ portalUnlocked: true }),

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  setPlayerVelocity: (vel) => set({ playerVelocity: vel }),

  setCameraRotation: (rot) => set({ cameraRotation: rot }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),

  setWebglAvailable: (available) => set({ webglAvailable: available }),

  resetGame: () => set({ ...initialState, webglAvailable: get().webglAvailable, reducedMotion: get().reducedMotion }),

  // Start the game from ready state
  startGame: () => set({ gameState: 'playing', fragmentsCollected: 0, portalUnlocked: false }),

  // Pause/resume
  pauseGame: () => set({ gameState: 'paused' }),
  resumeGame: () => set({ gameState: 'playing' }),

  // Victory
  triggerVictory: () => set({ gameState: 'victory' }),

  // Game over (fell off island)
  triggerGameOver: () => set({ gameState: 'gameover' }),
}));

export default useGameState;
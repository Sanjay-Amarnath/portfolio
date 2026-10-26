"use client";

import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import useGameState from './useGameState';

// Dynamically import game components to avoid SSR issues
const World = dynamic(() => import('./World'), { ssr: false });
const Player = dynamic(() => import('./Player'), { ssr: false });
const Collectible = dynamic(() => import('./Collectible'), { ssr: false });
const Portal = dynamic(() => import('./Portal'), { ssr: false });
const GameHUD = dynamic(() => import('./GameHUD'), { ssr: false });

// Fragment positions around the island
const FRAGMENT_POSITIONS = [
  { x: -10, y: 2.5, z: -8 },
  { x: 12, y: 2.5, z: 6 },
  { x: -3, y: 3, z: 14 },
];

// Portal position
const PORTAL_POSITION = [0, 0, -18];

function GameScene() {
  const { gameState, setFragmentsCollected } = useGameState();
  const { scene, camera, gl } = useThree();

  // Initialize scene
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000008, 0.015);
    scene.background = new THREE.Color(0x000008);
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
  }, [scene, camera, gl]);

  // Handle collectible collection
  const handleCollect = (index) => {
    setFragmentsCollected(index + 1);
  };

  // Handle portal entry
  const handlePortalEnter = () => {
    const { triggerVictory } = useGameState.getState();
    triggerVictory();
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight color={0x222244} intensity={0.8} />

      <directionalLight
        position={[-30, 50, -20]}
        color={0x88aaff}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.001}
      />

      <pointLight position={[0, 15, 0]} color={0x00ffff} intensity={2} distance={60} decay={2} />
      <pointLight position={[15, 10, 15]} color={0xb300ff} intensity={1.5} distance={50} decay={2} />
      <pointLight position={[-15, 10, -15]} color={0xff00aa} intensity={1} distance={50} decay={2} />

      <hemisphereLight groundColor={0x001122} skyColor={0x224466} intensity={1} />

      <World />

      {FRAGMENT_POSITIONS.map((pos, i) => (
        <Collectible
          key={`fragment-${i}`}
          index={i}
          position={[pos.x, pos.y, pos.z]}
          onCollect={handleCollect}
        />
      ))}

      <Portal position={PORTAL_POSITION} onEnter={handlePortalEnter} />

      <Player />
    </>
  );
}

function GameCanvas() {
  const { reducedMotion, setReducedMotion, setWebglAvailable } = useGameState();
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Check reduced motion preference
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [setReducedMotion]);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebglSupported(!!ctx);
      setWebglAvailable(!!ctx);
    } catch (e) {
      setWebglSupported(false);
      setWebglAvailable(false);
    }
  }, [setWebglAvailable]);

  if (!mounted || !webglSupported) {
    return (
      <div className="game-canvas-container loading" aria-hidden="true">
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-canvas-container" role="application" aria-label="The Lost Internet 404 Game">
      <Canvas
        camera={{ position: [0, 2, 10], fov: 75, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
        }}
        shadows
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <GameScene />
      </Canvas>

      <GameHUD />
    </div>
  );
}

export default GameCanvas;
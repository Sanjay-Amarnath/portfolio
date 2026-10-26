"use client";

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameState from './useGameState';
import useKeyboardControls from './useKeyboardControls';

const GRAVITY = -25;
const MOVE_SPEED = 8;
const SPRINT_MULTIPLIER = 1.7;
const JUMP_FORCE = 12;
const ISLAND_RADIUS = 22;
const ISLAND_HEIGHT = 2.5;

const Player = ({ cameraRef }) => {
  const { scene, camera, gl } = useThree();
  const {
    gameState,
    playerPosition,
    playerVelocity,
    cameraRotation,
    setPlayerPosition,
    setPlayerVelocity,
    setCameraRotation,
    triggerGameOver,
  } = useGameState();
  const { getKeys, isPointerLocked } = useKeyboardControls();

  const velocityRef = useRef(new THREE.Vector3());
  const positionRef = useRef(new THREE.Vector3());
  const rotationRef = useRef(new THREE.Euler(0, 0, 0));
  const canJumpRef = useRef(true);
  const prevTimeRef = useRef(performance.now());

  // Initialize position
  useEffect(() => {
    positionRef.current.set(playerPosition.x, playerPosition.y, playerPosition.z);
    rotationRef.current.set(cameraRotation.x, cameraRotation.y, 0);
  }, []);

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    const keys = getKeys();
    const now = performance.now();
    const dt = Math.min((now - prevTimeRef.current) / 1000, 1/30);
    prevTimeRef.current = now;

    // Apply gravity
    velocityRef.current.y += GRAVITY * dt;

    // Movement input
    const moveDirection = new THREE.Vector3();

    if (keys.KeyW || keys.ArrowUp) moveDirection.z -= 1;
    if (keys.KeyS || keys.ArrowDown) moveDirection.z += 1;
    if (keys.KeyA || keys.ArrowLeft) moveDirection.x -= 1;
    if (keys.KeyD || keys.ArrowRight) moveDirection.x += 1;

    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      // Apply camera rotation to movement direction
      const yaw = rotationRef.current.y;
      moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

      const speed = (keys.ShiftLeft || keys.ShiftRight) ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
      velocityRef.current.x = moveDirection.x * speed;
      velocityRef.current.z = moveDirection.z * speed;
    } else {
      // Apply damping when not moving
      velocityRef.current.x *= 0.85;
      velocityRef.current.z *= 0.85;
    }

    // Jump
    if (keys.Space && canJumpRef.current && positionRef.current.y <= ISLAND_HEIGHT + 0.1) {
      velocityRef.current.y = JUMP_FORCE;
      canJumpRef.current = false;
    }

    // Update position
    positionRef.current.addScaledVector(velocityRef.current, dt);

    // Ground collision (island surface)
    const groundY = ISLAND_HEIGHT;
    if (positionRef.current.y <= groundY) {
      positionRef.current.y = groundY;
      velocityRef.current.y = 0;
      canJumpRef.current = true;
    }

    // Island boundary collision (circular)
    const distFromCenter = Math.sqrt(
      positionRef.current.x ** 2 + positionRef.current.z ** 2
    );
    if (distFromCenter > ISLAND_RADIUS - 1) {
      // Push back toward center
      const pushForce = (distFromCenter - (ISLAND_RADIUS - 1)) * 2;
      const angle = Math.atan2(positionRef.current.z, positionRef.current.x);
      positionRef.current.x -= Math.cos(angle) * pushForce * dt;
      positionRef.current.z -= Math.sin(angle) * pushForce * dt;

      // Check if fell off island
      if (positionRef.current.y < -10) {
        triggerGameOver();
        return;
      }
    }

    // Update camera position (first person)
    camera.position.set(
      positionRef.current.x,
      positionRef.current.y + 0.1, // Eye level offset
      positionRef.current.z
    );

    // Apply camera rotation
    camera.rotation.set(rotationRef.current.x, rotationRef.current.y, 0, 'YXZ');

    // Sync to global state
    setPlayerPosition({
      x: positionRef.current.x,
      y: positionRef.current.y,
      z: positionRef.current.z,
    });
    setPlayerVelocity({
      x: velocityRef.current.x,
      y: velocityRef.current.y,
      z: velocityRef.current.z,
    });

    // Store camera ref for other components
    if (cameraRef && cameraRef.current) {
      cameraRef.current = camera;
    }
  });

  // Handle mouse movement for camera rotation
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (gameState !== 'playing' || !isPointerLocked()) return;

      const sensitivity = 0.002;
      rotationRef.current.y -= e.movementX * sensitivity;
      rotationRef.current.x -= e.movementY * sensitivity;

      // Clamp vertical rotation
      rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x));

      setCameraRotation({
        x: rotationRef.current.x,
        y: rotationRef.current.y,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [gameState, isPointerLocked, setCameraRotation]);

  // Click to lock pointer
  useEffect(() => {
    const handleClick = () => {
      if (gameState === 'playing' && !isPointerLocked()) {
        document.body.requestPointerLock().catch(() => {});
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [gameState, isPointerLocked]);

  return null; // Player is invisible, camera represents the player
};

export default Player;
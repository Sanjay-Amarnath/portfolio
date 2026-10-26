"use client";

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameState from './useGameState';

const Portal = ({ position, onEnter }) => {
  const { gameState, portalUnlocked, soundEnabled } = useGameState();
  const portalRef = useRef(null);
  const ringRefs = useRef([]);
  const particleRef = useRef(null);
  const timeRef = useRef(0);
  const unlockProgressRef = useRef(0);
  const enteredRef = useRef(false);

  // Portal materials
  const lockedMaterial = useMemo(() =>
    new THREE.MeshPhysicalMaterial({
      color: 0x330066,
      roughness: 0.3,
      metalness: 0.7,
      transmission: 0.4,
      thickness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x440088,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    })
  , []);

  const unlockedMaterial = useMemo(() =>
    new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      roughness: 0,
      metalness: 0.9,
      transmission: 0.9,
      thickness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
      side: THREE.DoubleSide,
    })
  , []);

  const ringMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  , []);

  const particleGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const count = 200;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1.5;
      const height = (Math.random() - 0.5) * 4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      sizes[i] = 0.02 + Math.random() * 0.06;
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 2] = 1;
      velocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.2,
        angle: angle,
        radius: radius,
        height: height,
        speed: 0.5 + Math.random() * 1,
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry: geom, velocities };
  }, []);

  const particleMaterial = useMemo(() =>
    new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  , []);

  // Animate portal
  useFrame((state, delta) => {
    if (gameState !== 'playing' && gameState !== 'ready' && gameState !== 'victory') return;

    timeRef.current += delta;
    const portal = portalRef.current;
    if (!portal) return;

    // Handle unlock transition
    if (portalUnlocked && unlockProgressRef.current < 1) {
      unlockProgressRef.current = Math.min(1, unlockProgressRef.current + delta * 1.5);

      // Morph material properties
      portal.material.color.lerp(new THREE.Color(0x00ffff), unlockProgressRef.current);
      portal.material.emissive.lerp(new THREE.Color(0x00ffff), unlockProgressRef.current);
      portal.material.emissiveIntensity = THREE.MathUtils.lerp(0.5, 2, unlockProgressRef.current);
      portal.material.transmission = THREE.MathUtils.lerp(0.4, 0.9, unlockProgressRef.current);
      portal.material.metalness = THREE.MathUtils.lerp(0.7, 0.9, unlockProgressRef.current);
    }

    // Rotate portal
    portal.rotation.y += delta * (portalUnlocked ? 0.8 : 0.3);

    // Pulse scale when unlocked
    if (portalUnlocked) {
      const pulse = 1 + Math.sin(timeRef.current * 3) * 0.05;
      portal.scale.setScalar(pulse);
    }

    // Animate rings
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.z += delta * (portalUnlocked ? 1.5 : 0.5) * (i % 2 === 0 ? 1 : -1);
      ring.rotation.x = Math.sin(timeRef.current * 2 + i) * 0.2;

      // Pulse opacity
      ring.material.opacity = 0.4 + Math.sin(timeRef.current * 4 + i * 2) * 0.2;

      if (portalUnlocked) {
        ring.scale.setScalar(1 + Math.sin(timeRef.current * 3 + i) * 0.1);
      }
    });

    // Animate particles
    if (particleRef.current && particleGeometry.current) {
      const positions = particleGeometry.current.geometry.attributes.position.array;
      const velocities = particleGeometry.current.velocities;

      for (let i = 0; i < velocities.length; i++) {
        const v = velocities[i];
        v.angle += v.speed * delta * (portalUnlocked ? 2 : 1);
        v.height += v.y * delta;

        // Wrap height
        if (v.height > 2) v.height = -2;
        if (v.height < -2) v.height = 2;

        positions[i * 3] = Math.cos(v.angle) * v.radius;
        positions[i * 3 + 1] = v.height;
        positions[i * 3 + 2] = Math.sin(v.angle) * v.radius;
      }
      particleGeometry.current.geometry.attributes.position.needsUpdate = true;

      // Pulse particle size/opacity when unlocked
      if (portalUnlocked) {
        particleRef.current.material.opacity = 0.6 + Math.sin(timeRef.current * 4) * 0.3;
        particleRef.current.material.size = 0.06 + Math.sin(timeRef.current * 4) * 0.03;
      }
    }

    // Check player collision with portal (when unlocked)
    if (portalUnlocked && !enteredRef.current) {
      const camera = state.camera;
      const portalWorldPos = new THREE.Vector3();
      portal.getWorldPosition(portalWorldPos);
      const distance = camera.position.distanceTo(portalWorldPos);

      if (distance < 3) {
        enteredRef.current = true;
        onEnter();
      }
    } else if (!portalUnlocked) {
      enteredRef.current = false;
    }
  });

  // Portal geometry - torus knot for interesting shape
  const portalGeometry = useMemo(() =>
    new THREE.TorusKnotGeometry(1.8, 0.4, 100, 16, 2, 3)
  , []);

  // Ring geometries
  const ringGeometries = useMemo(() => [
    new THREE.RingGeometry(2.2, 2.5, 32),
    new THREE.RingGeometry(2.7, 3.0, 32),
    new THREE.RingGeometry(3.2, 3.5, 32),
  ], []);

  // Ground ring
  const groundRingGeometry = useMemo(() =>
    new THREE.RingGeometry(3.5, 4.5, 64)
  , []);

  const groundRingMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  , []);

  return (
    <group ref={portalRef} position={position}>
      {/* Ground ring */}
      <mesh
        geometry={groundRingGeometry}
        material={groundRingMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      />

      {/* Portal core */}
      <mesh
        geometry={portalGeometry}
        material={lockedMaterial}
        castShadow
        receiveShadow
      />

      {/* Outer rings */}
      {ringGeometries.map((geom, i) => (
        <mesh
          key={`ring-${i}`}
          geometry={geom}
          material={ringMaterial.clone()}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.1 + i * 0.05, 0]}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
        />
      ))}

      {/* Particle system */}
      {particleGeometry.current && (
        <points
          ref={particleRef}
          geometry={particleGeometry.current.geometry}
          material={particleMaterial}
          renderOrder={1}
        />
      )}

      {/* Beam of light when unlocked */}
      {portalUnlocked && (
        <mesh
          geometry={new THREE.CylinderGeometry(0.1, 2.5, 50, 16, 1, true)}
          material={new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })}
          position={[0, 25, 0]}
          scale={[1, 1, 1]}
        />
      )}

      {/* Lock indicator (shows when locked) */}
      {!portalUnlocked && (
        <mesh
          geometry={new THREE.OctahedronGeometry(0.4, 0)}
          material={new THREE.MeshBasicMaterial({
            color: 0xff3366,
            transparent: true,
            opacity: 0.8,
            emissive: 0xff3366,
            emissiveIntensity: 1,
          })}
          position={[0, 3.5, 0]}
          scale={[0, 0, 0]}
        >
          <scale
            key="lock-scale"
            value={Math.sin(timeRef.current * 4) * 0.5 + 1}
          />
        </mesh>
      )}
    </group>
  );
};

export default Portal;
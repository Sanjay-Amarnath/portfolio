"use client";

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';
import useGameState from './useGameState';

const Collectible = ({ index, position, onCollect }) => {
  const { gameState, soundEnabled, fragmentsCollected } = useGameState();
  const meshRef = useRef(null);
  const particlesRef = useRef([]);
  const collectedRef = useRef(false);
  const timeRef = useRef(0);

  // Create particle geometry
  const particleGeometry = useRef(null);
  const particleMaterial = useRef(null);

  useEffect(() => {
    particleGeometry.current = new THREE.BufferGeometry();
    const particleCount = 30;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      sizes[i] = 0.05 + Math.random() * 0.08;
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 1;
      velocities.push({
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * 0.5 + 0.2,
        z: (Math.random() - 0.5) * 0.5,
        life: 1 + Math.random(),
      });
    }

    particleGeometry.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    particleMaterial.current = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    particlesRef.current = velocities;
  }, []);

  // Animate and check collision
  useFrame((state, delta) => {
    if (gameState !== 'playing' || collectedRef.current) return;

    timeRef.current += delta;
    const mesh = meshRef.current;
    if (!mesh) return;

    // Rotate and float (handled by Float wrapper, but add extra rotation)
    mesh.rotation.y += delta * 1.5;

    // Pulse scale
    const pulse = 1 + Math.sin(timeRef.current * 4) * 0.1;
    mesh.scale.setScalar(pulse);

    // Animate particles
    if (particleGeometry.current && particlesRef.current.length > 0) {
      const positions = particleGeometry.current.attributes.position.array;
      const velocities = particlesRef.current;

      for (let i = 0; i < velocities.length; i++) {
        const v = velocities[i];
        positions[i * 3] += v.x * delta;
        positions[i * 3 + 1] += v.y * delta;
        positions[i * 3 + 2] += v.z * delta;
        v.life -= delta;

        if (v.life <= 0) {
          // Reset particle
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.5 + Math.random() * 0.5;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
          v.x = (Math.random() - 0.5) * 0.5;
          v.y = Math.random() * 0.5 + 0.2;
          v.z = (Math.random() - 0.5) * 0.5;
          v.life = 1 + Math.random();
        }
      }
      particleGeometry.current.attributes.position.needsUpdate = true;
    }

    // Check collision with player (camera)
    const camera = state.camera;
    const distance = camera.position.distanceTo(mesh.getWorldPosition(new THREE.Vector3()));

    if (distance < 2) {
      collectedRef.current = true;
      onCollect(index);

      // Trigger collection animation
      triggerCollectionEffect(mesh);
    }
  });

  const triggerCollectionEffect = (mesh) => {
    // Scale up and fade out
    const startScale = mesh.scale.x;
    const duration = 0.5;
    let elapsed = 0;

    const animate = (delta) => {
      elapsed += delta;
      const progress = elapsed / duration;

      if (progress >= 1) {
        mesh.visible = false;
        return;
      }

      const scale = startScale * (1 + progress * 2);
      mesh.scale.setScalar(scale);
      mesh.material.opacity = 1 - progress;
      mesh.material.emissiveIntensity = 2 * (1 - progress);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  // Fragment material with emission
  const fragmentMaterial = useRef(null);

  useEffect(() => {
    fragmentMaterial.current = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      roughness: 0,
      metalness: 0.5,
      transmission: 0.8,
      thickness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });
  }, []);

  // Check if already collected
  if (index < fragmentsCollected) {
    return null;
  }

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.3}
    >
      <group ref={meshRef} position={position}>
        {/* Core fragment - octahedron */}
        <mesh
          geometry={new THREE.OctahedronGeometry(0.5, 0)}
          material={fragmentMaterial.current}
          castShadow
        />

        {/* Inner glow */}
        <mesh
          geometry={new THREE.OctahedronGeometry(0.35, 0)}
          material={new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
          })}
        />

        {/* Particle system */}
        {particleGeometry.current && particleMaterial.current && (
          <points
            geometry={particleGeometry.current}
            material={particleMaterial.current}
            renderOrder={1}
          />
        )}

        {/* Outer ring */}
        <mesh
          geometry={new THREE.RingGeometry(0.7, 0.85, 16)}
          material={new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          })}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        {/* Second ring counter-rotating */}
        <mesh
          geometry={new THREE.RingGeometry(0.9, 1.05, 16)}
          material={new THREE.MeshBasicMaterial({
            color: 0xb300ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          })}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
    </Float>
  );
};

export default Collectible;
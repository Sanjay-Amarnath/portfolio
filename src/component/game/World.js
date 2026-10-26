"use client";

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Sky, Stars, Environment, ContactShadows } from '@react-three/drei';
import useGameState from './useGameState';

const World = () => {
  const { gameState, reducedMotion } = useGameState();

  // Island geometry and materials
  const islandGeometry = useMemo(() => {
    const geom = new THREE.CylinderGeometry(24, 28, 6, 32, 1, true);
    geom.translate(0, 1.5, 0); // Position so top is at y=1.5
    return geom;
  }, []);

  const islandMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    })
  , []);

  // Crystal geometries
  const crystalGeometries = useMemo(() => [
    new THREE.ConeGeometry(0.4, 2.5, 6, 1),
    new THREE.ConeGeometry(0.3, 1.8, 5, 1),
    new THREE.ConeGeometry(0.5, 3.2, 7, 1),
    new THREE.ConeGeometry(0.35, 2.2, 6, 1),
    new THREE.ConeGeometry(0.45, 2.8, 6, 1),
  ], []);

  const crystalMaterial = useMemo(() =>
    new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.6,
      thickness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x004466,
      emissiveIntensity: 0.3,
    })
  , []);

  const purpleCrystalMaterial = useMemo(() =>
    new THREE.MeshPhysicalMaterial({
      color: 0xb300ff,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.6,
      thickness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x440066,
      emissiveIntensity: 0.4,
    })
  , []);

  // Server tower geometries
  const towerGeometry = useMemo(() =>
    new THREE.BoxGeometry(2, 6, 2)
  , []);

  const towerMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: 0x0f0f1a,
      roughness: 0.6,
      metalness: 0.4,
      emissive: 0x001133,
      emissiveIntensity: 0.2,
    })
  , []);

  // Data cube geometries (abandoned)
  const cubeGeometry = useMemo(() =>
    new THREE.BoxGeometry(1.2, 1.2, 1.2)
  , []);

  const cubeMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x002244,
      emissiveIntensity: 0.15,
    })
  , []);

  // Ground plane for void
  const voidGeometry = useMemo(() =>
    new THREE.PlaneGeometry(500, 500)
  , []);

  const voidMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
    })
  , []);

  // Glowing path geometries
  const pathGeometries = useMemo(() => {
    const geoms = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 12 + Math.sin(i * 0.5) * 3;
      const geom = new THREE.RingGeometry(0.3, 0.6, 6);
      geom.rotateX(-Math.PI / 2);
      geom.translate(Math.cos(angle) * radius, 1.55, Math.sin(angle) * radius);
      geoms.push(geom);
    }
    return geoms;
  }, []);

  const pathMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
  , []);

  // Floating rocks
  const rockGeometries = useMemo(() => {
    const geoms = [];
    for (let i = 0; i < 15; i++) {
      const geom = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.8, 0);
      // Random position around island
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 10;
      const height = 2 + Math.random() * 6;
      geom.translate(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      geoms.push(geom);
    }
    return geoms;
  }, []);

  const rockMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    })
  , []);

  // Animation refs
  const timeRef = useRef(0);
  const crystalMeshesRef = useRef([]);
  const pathMeshesRef = useRef([]);
  const rockMeshesRef = useRef([]);

  // Animate crystals, paths, rocks
  useFrame((state, delta) => {
    if (gameState !== 'playing' && gameState !== 'ready' && gameState !== 'victory') return;
    if (reducedMotion) return;

    timeRef.current += delta;

    // Animate crystals - floating and rotation
    crystalMeshesRef.current.forEach((mesh, i) => {
      mesh.position.y = mesh.userData.baseY + Math.sin(timeRef.current * 1.5 + i) * 0.15;
      mesh.rotation.y += delta * 0.3;
    });

    // Animate paths - pulsing
    pathMeshesRef.current.forEach((mesh, i) => {
      const scale = 1 + Math.sin(timeRef.current * 2 + i) * 0.2;
      mesh.scale.setScalar(scale);
      mesh.material.opacity = 0.3 + Math.sin(timeRef.current * 2 + i) * 0.15;
    });

    // Animate floating rocks
    rockMeshesRef.current.forEach((mesh, i) => {
      mesh.position.y = mesh.userData.baseY + Math.sin(timeRef.current * 0.8 + i * 0.5) * 0.3;
      mesh.rotation.x += delta * 0.1;
      mesh.rotation.z += delta * 0.07;
    });
  });

  // Crystal positions on island
  const crystalPositions = [
    { x: -8, z: -6, type: 'blue', height: 2.5 },
    { x: 10, z: -5, type: 'purple', height: 1.8 },
    { x: 0, z: 12, type: 'blue', height: 3.2 },
    { x: -12, z: 3, type: 'purple', height: 2.2 },
    { x: 7, z: 8, type: 'blue', height: 2.8 },
    { x: -5, z: -10, type: 'purple', height: 2.0 },
    { x: 14, z: 2, type: 'blue', height: 2.5 },
    { x: -15, z: -8, type: 'purple', height: 1.9 },
    { x: 3, z: -14, type: 'blue', height: 2.3 },
    { x: -9, z: 10, type: 'purple', height: 2.6 },
  ];

  // Tower positions
  const towerPositions = [
    { x: -15, z: -12 },
    { x: 16, z: -10 },
    { x: -10, z: 15 },
    { x: 12, z: 14 },
  ];

  // Cube positions
  const cubePositions = [
    { x: -6, z: -14 },
    { x: 8, z: -14 },
    { x: -14, z: 6 },
    { x: 14, z: 8 },
    { x: -2, z: 16 },
    { x: 0, z: -16 },
  ];

  // Rock positions (generated in geometry)

  return (
    <>
      {/* Skybox with stars */}
      <Sky
        distance={400}
        sunPosition={[0, 1, 0]}
        turbidity={0}
        rayleigh={0.1}
        mieCoefficient={0.001}
        mieDirectionalG={0.9}
        inclination={0}
        azimuth={0.25}
      />

      <Stars radius={200} depth={100} count={3000} factor={4} saturation={0.5} fade />

      {/* Environment lighting */}
      <Environment
        preset="city"
        background={false}
        ground={false}
      />

      {/* Void floor */}
      <mesh geometry={voidGeometry} material={voidMaterial} position={[0, -50, 0]} />

      {/* Floating Island */}
      <mesh
        geometry={islandGeometry}
        material={islandMaterial}
        receiveShadow
        castShadow
      />

      {/* Contact shadows on island */}
      <ContactShadows
        position={[0, 1.5, 0]}
        opacity={0.3}
        scale={30}
        blur={2}
        far={10}
      />

      {/* Crystals */}
      {crystalPositions.map((pos, i) => (
        <Float
          key={`crystal-${i}`}
          speed={1.5}
          rotationIntensity={0.3}
          floatIntensity={0.15}
        >
          <mesh
            geometry={crystalGeometries[i % crystalGeometries.length]}
            material={pos.type === 'blue' ? crystalMaterial : purpleCrystalMaterial}
            position={[pos.x, 1.55 + pos.height / 2, pos.z]}
            castShadow
            receiveShadow
            ref={(el) => { if (el) crystalMeshesRef.current[i] = el; }}
            userData={{ baseY: 1.55 + pos.height / 2 }}
          />
        </Float>
      ))}

      {/* Server Towers */}
      {towerPositions.map((pos, i) => (
        <mesh
          key={`tower-${i}`}
          geometry={towerGeometry}
          material={towerMaterial}
          position={[pos.x, 4.5, pos.z]}
          castShadow
          receiveShadow
        >
          {/* Glowing accent strips */}
          <mesh
            geometry={new THREE.BoxGeometry(2.02, 0.3, 2.02)}
            material={new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.6,
            })}
            position={[0, 2.5, 0]}
          />
          <mesh
            geometry={new THREE.BoxGeometry(2.02, 0.3, 2.02)}
            material={new THREE.MeshBasicMaterial({
              color: 0xb300ff,
              transparent: true,
              opacity: 0.5,
            })}
            position={[0, -2.5, 0]}
          />
        </mesh>
      ))}

      {/* Abandoned Data Cubes */}
      {cubePositions.map((pos, i) => (
        <Float
          key={`cube-${i}`}
          speed={1.2 + i * 0.1}
          rotationIntensity={0.2}
          floatIntensity={0.1}
        >
          <mesh
            geometry={cubeGeometry}
            material={cubeMaterial}
            position={[pos.x, 2.2, pos.z]}
            rotation={[0.2, 0.4, 0]}
            castShadow
            receiveShadow
          >
            {/* Glowing face */}
            <mesh
              geometry={new THREE.PlaneGeometry(1.1, 1.1)}
              material={new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
              })}
              position={[0, 0, 0.61]}
            />
          </mesh>
        </Float>
      ))}

      {/* Glowing Paths */}
      {pathGeometries.map((geom, i) => (
        <mesh
          key={`path-${i}`}
          geometry={geom}
          material={pathMaterial}
          ref={(el) => { if (el) pathMeshesRef.current[i] = el; }}
        />
      ))}

      {/* Floating Rocks */}
      {rockGeometries.map((geom, i) => (
        <mesh
          key={`rock-${i}`}
          geometry={geom}
          material={rockMaterial}
          ref={(el) => { if (el) rockMeshesRef.current[i] = el; }}
          castShadow
          receiveShadow
          userData={{ baseY: geom.attributes.position.array[1] }}
        />
      ))}

      {/* Fog - handled by scene.fog in GameCanvas */}
    </>
  );
};

import { useRef } from 'react';
export default World;
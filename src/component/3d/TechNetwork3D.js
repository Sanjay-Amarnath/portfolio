"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

// ── Tech Nodes Definition ──
const NODES = [
  { name: "React", pos: [0, 0.4, 0.2], size: 0.28, color: "#e67855" },
  { name: "TypeScript", pos: [-1.4, 0.8, -0.3], size: 0.2, color: "#388cc3" },
  { name: "UI Architecture", pos: [1.3, 0.9, -0.2], size: 0.22, color: "#e67855" },
  { name: "State & Data", pos: [-1.1, -0.7, 0.1], size: 0.19, color: "#34a9c0" },
  { name: "Performance", pos: [1.2, -0.6, 0.2], size: 0.21, color: "#ffd790" },
  { name: "Next.js", pos: [0.1, 1.4, -0.5], size: 0.18, color: "#f8f3e6" },
  { name: "APIs & Cloud", pos: [-0.2, -1.2, -0.3], size: 0.18, color: "#4e67aa" },
];

// Node connections
const CONNECTIONS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [1, 5],
  [2, 5],
  [3, 6],
  [4, 6],
  [1, 3],
  [2, 4],
];

function InteractiveNetwork() {
  const groupRef = useRef(null);
  const { mouse } = useThree();

  // Subtle mouse interpolation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetRotY = mouse.x * 0.35;
    const targetRotX = -mouse.y * 0.25;
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      3,
      delta
    );
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      targetRotX,
      3,
      delta
    );
  });

  // Background ambient particles
  const particlePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 90; i++) {
      points.push(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 4
      );
    }
    return new Float32Array(points);
  }, []);

  return (
    <group ref={groupRef}>
      {/* Background ambient star particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePoints.length / 3}
            array={particlePoints}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#f09a70"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>

      {/* Connection Lines */}
      {CONNECTIONS.map(([startIdx, endIdx], i) => (
        <Line
          key={`line-${i}`}
          points={[NODES[startIdx].pos, NODES[endIdx].pos]}
          color="#d8cdb7"
          transparent
          opacity={0.28}
          lineWidth={1}
        />
      ))}

      {/* Interconnected Tech Nodes */}
      {NODES.map((node, i) => (
        <Float
          key={node.name}
          speed={1.5 + (i % 3) * 0.5}
          rotationIntensity={0.3}
          floatIntensity={0.4}
        >
          <group position={node.pos}>
            {/* Glowing core sphere */}
            <Sphere args={[node.size, 24, 24]}>
              <meshStandardMaterial
                color={node.color}
                roughness={0.25}
                metalness={0.65}
                emissive={node.color}
                emissiveIntensity={0.22}
              />
            </Sphere>

            {/* Orbiting halo ring */}
            <mesh rotation={[Math.PI / 3, (i * Math.PI) / 4, 0]}>
              <ringGeometry args={[node.size * 1.3, node.size * 1.45, 32]} />
              <meshBasicMaterial
                color={node.color}
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

export default function TechNetwork3D() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} color="#fffaf0" />
        <pointLight position={[-3, -2, 2]} intensity={0.6} color="#e67855" />
        <InteractiveNetwork />
      </Canvas>
    </div>
  );
}


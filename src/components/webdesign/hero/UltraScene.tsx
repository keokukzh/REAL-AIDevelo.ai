import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Trail, Icosahedron, TorusKnot, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const DigitalCore = () => {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z += 0.001;

    // Pulse effect
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Inner Core */}
        <Icosahedron args={[1, 1]}>
          <meshStandardMaterial
            ref={materialRef}
            wireframe
            emissive="#00ff99"
            emissiveIntensity={2}
            color="#000000"
            transparent
            opacity={0.8}
          />
        </Icosahedron>

        {/* Outer Ring */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <TorusKnot args={[1.8, 0.02, 128, 32, 2, 3]}>
            <meshStandardMaterial emissive="#ff0055" emissiveIntensity={3} color="#ff0055" />
          </TorusKnot>
        </group>
      </Float>
    </group>
  );
};

const DataStreams = () => {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(-5, 2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5, -2, 0),
      new THREE.Vector3(10, 0, 0),
    ]);
  }, []);

  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <Float
          key={i}
          speed={1 + i * 0.2}
          rotationIntensity={0.2}
          floatIntensity={0.5}
          position={[0, i - 2, 0]}
        >
          <mesh position={[Math.sin(i) * 5, 0, 0]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          {/* Ghost effect trails would go here, simulated with simple lines for performance */}
        </Float>
      ))}
    </group>
  );
};

const UltraScene = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -5, -10]} intensity={2} color="#00ff99" />
      <pointLight position={[0, 5, 5]} intensity={2} color="#ff0055" />

      <DigitalCore />
      {/* <DataStreams /> */}

      {/* Reduced particle counts: 7000→3500 stars, 500→250, 300→150 sparkles for 50% GPU reduction */}
      <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={250} scale={15} size={3} speed={0.4} opacity={0.5} color="#00ff99" />
      <Sparkles count={150} scale={10} size={2} speed={0.8} opacity={0.3} color="#ff0055" />
    </>
  );
};

export default UltraScene;

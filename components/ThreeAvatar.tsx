import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeAvatarProps {
  audioLevel: number;
}

const NeuralNexus: React.FC<{ audioLevel: number }> = ({ audioLevel }) => {
  const coreRef = useRef<any>(null);
  const particleRef = useRef<any>(null);
  const ringRef = useRef<any>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Pulse Core
    if (coreRef.current) {
      const scale = 1 + audioLevel * 0.4;
      coreRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      coreRef.current.rotation.y = time * 0.2;
    }

    // Orbit Particles
    if (particleRef.current) {
       particleRef.current.rotation.y = time * 0.05;
       particleRef.current.rotation.z = time * 0.02;
    }

    // Rotate Rings
    if (ringRef.current) {
        ringRef.current.rotation.x = Math.sin(time * 0.2) * 0.2;
        ringRef.current.rotation.y = time * 0.1;
    }
  });

  // Create random particles
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0; i<particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 5;
  }

  return (
    <group>
      {/* Liquid Core */}
      <Sphere args={[1.2, 128, 128]} ref={coreRef}>
        <MeshDistortMaterial
          color="#00E0FF"
          emissive="#1A73E8"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.9}
          distort={0.4 + audioLevel} // React to audio
          speed={3}
        />
      </Sphere>

      {/* Particle Field */}
      <points ref={particleRef}>
         <bufferGeometry>
            <bufferAttribute 
                attach="attributes-position" 
                count={particleCount} 
                array={positions} 
                itemSize={3} 
            />
         </bufferGeometry>
         <pointsMaterial 
            size={0.03} 
            color="#ffffff" 
            transparent 
            opacity={0.6} 
            sizeAttenuation={true} 
         />
      </points>

      {/* Interface Rings */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.2, 0.01, 16, 100]} />
            <meshBasicMaterial color="#1A73E8" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[2.8, 0.005, 16, 100]} />
            <meshBasicMaterial color="#00E0FF" transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
};

export const ThreeAvatar: React.FC<ThreeAvatarProps> = ({ audioLevel }) => {
  return (
    <div className="w-[340px] h-[340px] md:w-[550px] md:h-[550px] relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} className="w-full h-full">
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#00E0FF" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#1A73E8" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} color="white" />
        
        <NeuralNexus audioLevel={audioLevel} />
      </Canvas>
      
      {/* Overlay for integration */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-background/20" />
    </div>
  );
};
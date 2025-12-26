import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Code, Zap, Layout, Smartphone, CheckCircle2, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// --- WebGL Particle System (The "Digital Seeds") ---
const ParticleSystem = ({ count = 2000 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.05;
    ref.current.rotation.z = time * 0.02;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#da291c"
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

// --- Generative Lines (The "Digital Genesis" Connections) ---
const GenesisLines = ({ count = 40 }) => {
  const lines = useMemo(() => {
    const l = [];
    for (let i = 0; i < count; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      const end = start.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ));
      l.push({ start, end });
    }
    return l;
  }, [count]);

  return (
    <group>
      {lines.map((line, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={2}>
          <line>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...line.start.toArray(), ...line.end.toArray()])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#6366f1" opacity={0.2} transparent />
          </line>
        </Float>
      ))}
    </group>
  );
};

// --- Central Core Node ---
const GenesisCore = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color="#da291c" 
        emissive="#da291c" 
        emissiveIntensity={2} 
        toneMapped={false} 
      />
      <pointLight intensity={5} distance={10} color="#da291c" />
    </mesh>
  );
};

interface DigitalGenesisAnimationProps {
  t: {
    heroText1: string;
    heroText2: string;
    heroSub: string;
    missionStart: string;
    showSpecs: string;
    closeSpecs: string;
    scrollExplore: string;
  };
  lang: string;
}

export const DigitalGenesisAnimation: React.FC<DigitalGenesisAnimationProps> = ({ t, lang }) => {
  const prefersReducedMotion = useReducedMotion();
  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <section className="relative w-full h-[100vh] bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* 3D WebGL Layer */}
      <div className="absolute inset-0 z-0">
        {!prefersReducedMotion ? (
          <Canvas gl={{ antialias: true, alpha: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <ambientLight intensity={0.2} />
            <Suspense fallback={null}>
              <ParticleSystem />
              <GenesisLines />
              <GenesisCore />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950" />
        )}
      </div>

      {/* UI Content Layer */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Protocol Active // Genesis</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black font-display text-white leading-[0.9] tracking-tighter mb-8 italic">
            {t.heroText1} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 animate-gradient-x">
              {t.heroText2}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-xl font-light leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-wrap gap-4">
             <Button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 px-10 bg-red-600 hover:bg-red-700 text-white rounded-none border-b-4 border-red-900 group"
             >
                <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                   {t.missionStart} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
             </Button>

             <Button 
                onClick={() => setShowSpecs(!showSpecs)}
                variant="outline"
                className="h-16 px-10 rounded-none border-white/10 hover:bg-white/5 text-white backdrop-blur-sm"
             >
                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
                   <Info size={16} /> {showSpecs ? t.closeSpecs : t.showSpecs}
                </span>
             </Button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-[10px] font-mono text-gray-500">
             <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-red-500" /> ULTRA_PERFORMANT</div>
             <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-500" /> SCALABLE_GENESIS</div>
          </div>
        </motion.div>

        {/* Right side floating data (Optional visual) */}
        <div className="hidden lg:block">
           <AnimatePresence>
              {showSpecs && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                  className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group pointer-events-auto"
                >
                   <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-white/20">SYSTEM_LOG_V2.0</div>
                   <div className="space-y-6">
                      <div className="h-2 w-32 bg-red-500/20 rounded-full overflow-hidden">
                         <motion.div animate={{ x: [-128, 128] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-full w-1/2 bg-red-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="border border-white/5 p-4 rounded-xl">
                            <div className="text-[10px] text-gray-500 mb-1">FPS</div>
                            <div className="text-2xl font-mono font-bold text-white">60.0</div>
                         </div>
                         <div className="border border-white/5 p-4 rounded-xl">
                            <div className="text-[10px] text-gray-500 mb-1">LATENCY</div>
                            <div className="text-2xl font-mono font-bold text-emerald-400">0.02ms</div>
                         </div>
                      </div>
                      <code className="block p-4 bg-black/40 rounded-xl text-[10px] text-blue-400 font-mono">
                         &gt; Initializing protocol...<br/>
                         &gt; Quantum alignment active<br/>
                         &gt; Genesis cores online [OK]<br/>
                         &gt; UI_SYNC_COMPLETE
                      </code>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent z-1" />
    </section>
  );
};

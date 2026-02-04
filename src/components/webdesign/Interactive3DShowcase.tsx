import React, { useState, useRef, Suspense } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Html,
  Float,
  ContactShadows,
  PresentationControls,
  Environment,
  Text
} from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Button } from '../ui/Button';
import { Palette, MousePointer2, Rotate3D, Layers } from 'lucide-react';
import { SectionTransition } from './SectionTransition';

// Theme definitions
const THEMES = {
  swiss: {
    name: 'Swiss',
    primary: '#DA291C', // Swiss Red
    secondary: '#ffffff',
    accent: '#000000',
    bg: '#f5f5f5',
    text: '#000000'
  },
  dark: {
    name: 'Cyber',
    primary: '#00f0ff', // Cyan
    secondary: '#0f172a', // Slate 900
    accent: '#7000ff', // Purple
    bg: '#020617',
    text: '#ffffff'
  },
  nature: {
    name: 'Nature',
    primary: '#10b981', // Emerald
    secondary: '#ecfdf5', // Emerald 50
    accent: '#059669',
    bg: '#ffffff',
    text: '#064e3b'
  }
};

const WebsiteModel = ({ themeKey = 'swiss' }) => {
  const theme = THEMES[themeKey];
  const group = useRef<THREE.Group>(null);

  // Smooth idle animation
  useFrame((state, delta) => {
    if (group.current) {
      // Gentle idle rotation
      const idleRotation = state.clock.getElapsedTime() * 0.15;

      // We don't use useScroll here to avoid conflicts with main page scrolling
      // Instead we rely on PresentationControls for user interaction

      // Add a slight wave to the rotation
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        Math.sin(idleRotation) * 0.1,
        delta * 2
      );
    }
  });

  const Card = ({ position, size, color, opacity = 1, text = "" }) => (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.2}
        metalness={0.1}
      />
      {text && (
         <Text
            position={[0, 0, size[2]/2 + 0.01]}
            fontSize={0.2}
            color={theme.text}
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          >
            {text}
          </Text>
      )}
    </mesh>
  );

  return (
    <group ref={group}>
      {/* Browser Window Frame */}
      <Card position={[0, 0, 0]} size={[4.2, 3.2, 0.1]} color={theme.bg} opacity={0.9} />

      {/* Header */}
      <Card position={[0, 1.2, 0.15]} size={[3.8, 0.4, 0.05]} color={theme.secondary} />
      <Card position={[-1.4, 1.2, 0.2]} size={[0.4, 0.2, 0.05]} color={theme.primary} /> {/* Logo */}
      <Card position={[1.0, 1.2, 0.2]} size={[1.5, 0.1, 0.05]} color={theme.accent} opacity={0.5} /> {/* Nav */}

      {/* Hero Section */}
      <group position={[0, 0.2, 0.2]}>
        <Card position={[-0.8, 0, 0]} size={[1.8, 1.2, 0.05]} color={theme.secondary} /> {/* Text Area */}
        <Card position={[1.0, 0, 0]} size={[1.4, 1.0, 0.05]} color={theme.primary} opacity={0.8} /> {/* Image/3D Area */}

        {/* Hero Elements */}
        <Card position={[-1.2, 0.3, 0.05]} size={[0.8, 0.1, 0.02]} color={theme.text} />
        <Card position={[-1.0, 0.1, 0.05]} size={[1.2, 0.05, 0.02]} color={theme.text} opacity={0.6} />
        <Card position={[-1.3, -0.2, 0.05]} size={[0.6, 0.15, 0.02]} color={theme.accent} /> {/* Button */}
      </group>

      {/* Content Cards (Floating out) */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Card position={[-1.2, -1.0, 0.4]} size={[1.0, 0.8, 0.05]} color={theme.secondary} />
      </Float>
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Card position={[0, -1.0, 0.6]} size={[1.0, 0.8, 0.05]} color={theme.secondary} />
      </Float>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Card position={[1.2, -1.0, 0.3]} size={[1.0, 0.8, 0.05]} color={theme.secondary} />
      </Float>

      {/* Floating UI Elements (Decorations) */}
      <Float speed={4} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[2.5, 1, 0]}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color={theme.primary} roughness={0.2} />
        </mesh>
      </Float>
       <Float speed={3} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[-2.5, -0.5, 0.5]}>
          <torusGeometry args={[0.2, 0.08, 16, 32]} />
          <meshStandardMaterial color={theme.accent} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
};

export const Interactive3DShowcase = () => {
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('swiss');

  return (
    <SectionTransition variant="fade" intensity="medium">
      <section className="py-24 relative overflow-hidden bg-slate-950/50 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Column: Description & Controls */}
            <div className="order-2 lg:order-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-swiss-red/10 border border-swiss-red/20 text-swiss-red text-xs font-mono mb-6 uppercase tracking-widest">
                <Rotate3D size={12} />
                <span>Interactive 3D Experience</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold font-display text-white mb-6">
                Bring Your Product to Life
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Empower your users with immersive 3D configurators. Allow them to visualize, customize, and interact with your products in real-time.
                Move beyond static images to dynamic engagement.
              </p>

              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette size={16} className="text-gray-400" />
                    <span>Try the Configurator</span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => setActiveTheme(key as keyof typeof THEMES)}
                        className={`
                          group relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl border transition-all duration-300
                          ${activeTheme === key
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/20 hover:text-white'
                          }
                        `}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-white/10 shadow-sm"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <span className="text-sm font-medium">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5">
                    <MousePointer2 className="w-6 h-6 text-swiss-red mb-3" />
                    <h4 className="text-white font-medium mb-1">Interact</h4>
                    <p className="text-xs text-gray-500">Rotate and explore the scene</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5">
                    <Layers className="w-6 h-6 text-blue-500 mb-3" />
                    <h4 className="text-white font-medium mb-1">Configure</h4>
                    <p className="text-xs text-gray-500">Real-time material changes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Scene */}
            <div className="order-1 lg:order-2 h-[400px] sm:h-[500px] w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-swiss-red/5 to-blue-500/5 rounded-[2rem] blur-2xl" />

              <div className="h-full w-full relative z-10 cursor-grab active:cursor-grabbing" data-no-splash="true">
                <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }} data-no-splash="true">
                  <Suspense fallback={null}>
                    {/* Environment can fail to load external HDRs (CSP/404). Wrap it so failure doesn't unmount the whole section */}
                    <ErrorBoundary fallback={null}>
                      <Environment preset="city" />
                    </ErrorBoundary>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    <PresentationControls
                      global
                      zoom={0.8}
                      rotation={[0, -Math.PI / 6, 0]}
                      polar={[-Math.PI / 4, Math.PI / 4]}
                      azimuth={[-Math.PI / 4, Math.PI / 4]}
                      config={{ mass: 2, tension: 400 }}
                      snap={{ mass: 4, tension: 400 }}
                    >
                      <Float rotationIntensity={0.4}>
                        <WebsiteModel themeKey={activeTheme} />
                      </Float>
                    </PresentationControls>

                    <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                  </Suspense>
                </Canvas>

                {/* Overlay Instruction */}
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <span className="text-[10px] uppercase tracking-widest text-white/20 font-mono">
                    Drag to rotate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionTransition>
  );
};

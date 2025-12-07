import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Mic, Activity } from 'lucide-react';
import { Button } from './ui/Button';

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index === text.length) clearInterval(intervalId);
    }, 50);
    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayedText}<span className="animate-pulse text-accent">|</span></span>;
};

interface AnimatedOrbProps {
  audioLevel: number;
}

const AnimatedOrb: React.FC<AnimatedOrbProps> = ({ audioLevel }) => {
  return (
    <div className="relative w-[340px] h-[340px] md:w-[550px] md:h-[550px] flex items-center justify-center pointer-events-none">
      
      {/* --- Holographic Projection Field --- */}
      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-b from-accent/5 via-primary/5 to-transparent blur-[80px] -z-10"
      />

      {/* --- Main Holographic Volume --- */}
      <div className="relative w-full h-full flex items-center justify-center [perspective:1000px] [transform-style:preserve-3d]">
          
          {/* Scanline Effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden z-20 opacity-30 mix-blend-overlay">
            <motion.div 
                className="w-full h-[200%] bg-[linear-gradient(transparent_0%,rgba(0,224,255,0.2)_50%,transparent_100%)]"
                animate={{ y: ['-50%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* --- Outer Gyroscopic Rings --- */}
          {[1, 2, 3].map((ring, i) => (
             <motion.div 
                key={`ring-${i}`}
                initial={{ rotateZ: i * 60, rotateX: 60 }}
                animate={{ 
                    rotateZ: [i * 60, i * 60 + 360], 
                    rotateX: [60, 120, 60] 
                }}
                transition={{ 
                    duration: 20 - i * 3, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className={`absolute rounded-full border border-accent/30 shadow-[0_0_15px_rgba(0,224,255,0.1)]`}
                style={{
                    width: `${90 - i * 15}%`,
                    height: `${90 - i * 15}%`,
                    borderWidth: '1px',
                    borderStyle: i === 1 ? 'dashed' : 'solid',
                    opacity: 0.6
                }}
             />
          ))}

          {/* --- Audio Reactive Resonance --- */}
           <motion.div
                className="absolute rounded-full border border-accent/40 bg-accent/5"
                animate={{
                    width: ['40%', '110%'],
                    height: ['40%', '110%'],
                    opacity: [audioLevel * 0.8, 0],
                    borderWidth: ['2px', '0px']
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
           />

          {/* --- The Abstract Neural Entity (Avatar) --- */}
          <motion.div
            animate={{ scale: 1 + audioLevel * 0.15 }}
            className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center z-30"
          >
             {/* Geometric Core Layer 1 - Cube-ish */}
             <motion.div 
                className="absolute w-[70%] h-[70%] border border-white/20 bg-white/5 backdrop-blur-sm rounded-2xl"
                animate={{ rotate: 360, rotateX: 180, rotateY: 180 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
             />
             
             {/* Geometric Core Layer 2 - Sphere */}
             <motion.div 
                className="absolute w-[90%] h-[90%] border border-primary/40 rounded-full"
                animate={{ rotate: -360, rotateX: -45 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ borderStyle: 'dotted', borderWidth: '2px' }}
             />
             
             {/* Central Light Source */}
             <motion.div 
                className="absolute w-20 h-20 bg-white rounded-full blur-xl mix-blend-screen"
                animate={{ opacity: 0.6 + audioLevel * 0.4, scale: 0.8 + audioLevel * 0.4 }}
             />
             
             {/* Digital Noise / Glitch Overlay */}
             <motion.div 
                className="absolute inset-0 bg-accent/20 rounded-full mix-blend-overlay"
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
             />
          </motion.div>
      </div>
      
      {/* --- Floating Data Particles --- */}
      {[...Array(12)].map((_, i) => (
        <motion.div
            key={`particle-${i}`}
            className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
            animate={{
                y: [Math.random() * -100, Math.random() * 100],
                x: [Math.random() * -100, Math.random() * 100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
            }}
            transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
            }}
            style={{
                top: '50%',
                left: '50%'
            }}
        />
      ))}
    </div>
  );
};

interface HeroProps {
  onStartOnboarding?: () => void;
  onScrollToSection?: (href: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartOnboarding, onScrollToSection }) => {
  const { scrollY } = useScroll();
  
  // Refined Parallax Background Layers
  const yBlobPrimary = useTransform(scrollY, [0, 1000], [0, 300]); 
  const yBlobAccent = useTransform(scrollY, [0, 1000], [0, 200]);
  const yFlares = useTransform(scrollY, [0, 1000], [0, 150]);
  const yParticles = useTransform(scrollY, [0, 1000], [0, 400]);

  const [audioLevel, setAudioLevel] = useState(0.5);
  
  // Simulate intelligent voice modulation pattern
  useEffect(() => {
    const interval = setInterval(() => {
        const time = Date.now() / 1000;
        // Combine sine waves to create a more natural speech-like pattern
        const base = Math.sin(time * 4) * 0.3 + Math.sin(time * 8) * 0.1 + 0.5; 
        const jitter = Math.random() * 0.1;
        setAudioLevel(Math.min(1, Math.max(0.1, base + jitter)));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        const headerOffset = 80;
        const elementPosition = demoSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      
      {/* --- Advanced Background Layer --- */}
      <div className="absolute inset-0 bg-[#0E0E0E] -z-50" />
      
      {/* Animated Blobs with Slow Drift & Fast Audio Reactivity */}
      <div className="absolute inset-0 overflow-hidden -z-40 pointer-events-none">
         
         {/* Primary Blob */}
         <motion.div 
            style={{ y: yBlobPrimary }}
            className="absolute -top-[10%] -left-[10%] w-[700px] h-[700px] rounded-full blur-[120px]" 
         >
            <motion.div
               animate={{ x: [0, 30, -20, 0], rotate: [0, 5, -5, 0] }} 
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="w-full h-full"
            >
                <motion.div
                    animate={{ scale: 1 + audioLevel * 0.1, opacity: 0.2 + audioLevel * 0.1 }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                    className="w-full h-full rounded-full"
                    style={{ background: `radial-gradient(circle, rgba(26,115,232,${0.3 + audioLevel * 0.2}) 0%, rgba(26,115,232,0) 70%)` }}
                />
            </motion.div>
         </motion.div>

         {/* Accent Blob */}
         <motion.div 
            style={{ y: yBlobAccent }}
            className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full blur-[100px]" 
         >
            <motion.div
               animate={{ x: [0, -40, 20, 0], rotate: [0, -5, 5, 0] }} 
               transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
               className="w-full h-full"
            >
                <motion.div
                    animate={{ scale: 1 + audioLevel * 0.15, opacity: 0.15 + audioLevel * 0.1 }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                    className="w-full h-full rounded-full"
                    style={{ background: `radial-gradient(circle, rgba(0,224,255,${0.2 + audioLevel * 0.1}) 0%, rgba(0,224,255,0) 70%)` }}
                />
            </motion.div>
         </motion.div>
         
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/5 rounded-full blur-[120px]" />
      </div>

      {/* Drifting Background Particles */}
      <motion.div style={{ y: yParticles }} className="absolute inset-0 z-[-35] pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`bg-particle-${i}`}
            className="absolute bg-white rounded-full"
            initial={{ x: Math.random() * 100 - 50, y: Math.random() * 100 - 50, opacity: 0 }}
            animate={{ y: [0, -30 - Math.random() * 20, 0], opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 5 }}
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 2}px`, height: `${Math.random() * 3 + 2}px`, boxShadow: "0 0 8px rgba(255, 255, 255, 0.2)" }}
          />
        ))}
      </motion.div>

      {/* Light Flares */}
      <motion.div style={{ y: yFlares }} className="absolute inset-0 overflow-hidden -z-30 pointer-events-none">
          <motion.div
             animate={{ rotate: [35, 35], x: ['-50%', '150%'], opacity: [0, 0.12, 0] }}
             transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
             className="absolute top-[-50%] left-[-20%] w-[500px] h-[200%] bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-3xl mix-blend-screen"
          />
           <motion.div
             animate={{ rotate: [-35, -35], x: ['50%', '-150%'], opacity: [0, 0.1, 0] }}
             transition={{ duration: 45, repeat: Infinity, ease: "linear", delay: 5 }}
             className="absolute top-[-50%] right-[-20%] w-[500px] h-[200%] bg-gradient-to-r from-transparent via-accent/5 to-transparent blur-3xl mix-blend-screen"
          />
      </motion.div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] -z-20 pointer-events-none" />

      {/* --- Main Content --- */}
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.3)] mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium tracking-wider text-gray-300 uppercase">Jetzt live: Schweizerdeutsch v2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold font-display leading-tight tracking-tight drop-shadow-2xl mb-6">
            KI-Telefonanruf-Agent, <br />
            der Ihre Termine bucht.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary drop-shadow-[0_0_15px_rgba(0,224,255,0.3)]">24/7 in Schweizerdeutsch.</span>
          </h1>
          
          <div className="text-xl text-gray-300 max-w-lg leading-relaxed mb-8">
            <p>Automatisieren Sie 80% Ihrer eingehenden Anrufe. <br/>Kostenlose Demo in unter 2 Min.</p>
          </div>

          {/* Industry Quick Nav */}
          <div className="flex flex-wrap gap-2 mb-8">
             {['Friseur', 'Zahnarzt', 'Restaurant', 'Handwerk'].map((industry) => (
                <button 
                  key={industry}
                  onClick={() => {
                      const section = document.getElementById('industries');
                      section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/30 text-xs text-gray-300 transition-all flex items-center gap-1"
                >
                   {industry === 'Friseur' && '✂️'}
                   {industry === 'Zahnarzt' && '🦷'}
                   {industry === 'Restaurant' && '🍽️'}
                   {industry === 'Handwerk' && '🔧'}
                   {industry}
                </button>
             ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={scrollToDemo} variant="primary" className="bg-blue-600 hover:bg-blue-500 border-none text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]" icon={<Play size={20} className="fill-current" />}>
               Kostenlose Agent-Demo
            </Button>
            <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} variant="secondary">
              Pricing ansehen
            </Button>
          </div>
          
          {/* Trust Bar */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><span className="text-red-500">🇨🇭</span> Schweizer Server & DSG-konform</span>
                <span className="flex items-center gap-1.5">🔒 DSGVO certified</span>
                <span className="flex items-center gap-1.5">⚡ 99.9% Verfügbarkeit</span>
                <span className="flex items-center gap-1.5">💬 24/7 Support</span>
            </div>
          </div>
        </motion.div>

        {/* Visual Content - The Avatar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative flex justify-center items-center py-10 lg:py-0"
        >
           {/* Floating Card Backdrop */}
           <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />
           
           <AnimatedOrb audioLevel={audioLevel} />
           
           {/* Floating UI Elements */}
           <motion.div 
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-10 right-0 lg:right-10 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-30 ring-1 ring-white/5"
           >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Gerade eben</div>
                  <div className="text-sm font-semibold text-white">Anruf in Umsatz verwandelt</div>
                </div>
              </div>
           </motion.div>

           <motion.div 
             animate={{ y: [0, 10, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="absolute bottom-10 left-0 lg:left-10 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-30 ring-1 ring-white/5"
           >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_10px_rgba(0,224,255,0.2)]">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Kalender Sync</div>
                  <div className="text-sm font-semibold text-white">Termin eingetragen</div>
                </div>
              </div>
           </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Mic } from 'lucide-react';

interface DemoSectionProps {
  onStartOnboarding?: () => void;
}

export const DemoSection: React.FC<DemoSectionProps> = ({ onStartOnboarding }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/audio/demo_de.mp3');
    audioRef.current.onended = () => setIsPlaying(false);
    
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying]);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-surface relative overflow-hidden" id="demo">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Mock Phone UI */}
        <motion.div 
           initial={{ opacity: 0, x: -50 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="relative flex justify-center"
        >
          <div className="relative w-[320px] h-[640px] bg-black rounded-[3rem] border-4 border-gray-800 shadow-2xl p-4 overflow-hidden z-10 ring-1 ring-white/10">
            {/* Dynamic Island */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>
            
            <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-[2.5rem] flex flex-col items-center justify-between py-12 px-6 relative">
              
              {/* Caller Info */}
              <div className="text-center mt-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/20">
                    <Mic size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">AIDevelo Assistant</h3>
                <p className="text-accent animate-pulse">00:15 • KI-Anruf aktiv</p>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-1 h-24 w-full">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isPlaying ? { 
                      height: [10, Math.random() * 60 + 10, 10],
                      backgroundColor: ['#1A73E8', '#00E0FF', '#1A73E8']
                    } : { height: 4, backgroundColor: '#374151' }}
                    transition={isPlaying ? { duration: 0.5, repeat: Infinity, delay: i * 0.05 } : { duration: 0.5 }}
                    className="w-1.5 rounded-full"
                  />
                ))}
              </div>

              {/* Subtitles */}
              <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 min-h-[80px] border border-white/5">
                <AnimatePresence mode='wait'>
                    {isPlaying ? (
                        <motion.p 
                            key="text-playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-gray-200 text-center leading-relaxed"
                        >
                            "Guten Tag! Hier ist der digitale Assistent von Dr. Weber. Möchten Sie einen Termin für eine Untersuchung vereinbaren?"
                        </motion.p>
                    ) : (
                        <motion.p 
                            key="text-idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-gray-500 text-center italic"
                        >
                            Drücken Sie Play für eine Demo...
                        </motion.p>
                    )}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex gap-6 w-full justify-center pb-8">
                 <button className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <div className="w-6 h-6 bg-current rounded-full" /> {/* Decline symbol mock */}
                 </button>
                 <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                 >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                 </button>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Description */}
        <div className="space-y-8">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
           >
             <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                So klingt Ihr <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">persönlicher KI-Agent.</span>
             </h2>
             <p className="text-xl text-gray-400 leading-relaxed mb-8">
                Vergessen Sie robotische Computerstimmen. AIDevelo nutzt modernste Sprachsynthese mit Schweizer Dialekt-Verständnis, um natürliche, einfühlsame Gespräche zu führen.
             </p>
             
             <ul className="space-y-4 mb-8">
                {['Versteht Schweizerdeutsch & Hochdeutsch', 'Erkennt Emotionen und Dringlichkeit', 'Kann unterbrochen werden (Full Duplex)'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">✓</div>
                        {item}
                    </li>
                ))}
             </ul>

             <button onClick={onStartOnboarding} className="text-white border-b border-accent pb-1 hover:text-accent transition-colors flex items-center gap-2 group">
                Jetzt gratis testen <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
           </motion.div>
        </div>

      </div>
    </section>
  );
};

// Icon component needed here for the import above
const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
    </svg>
);
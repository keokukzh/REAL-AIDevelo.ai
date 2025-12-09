import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Mic } from 'lucide-react';
import { IndustryDemo } from '../data/industryDemos';

interface IndustryDemoPreviewProps {
  demo: IndustryDemo;
  onStartOnboarding?: () => void;
}

export const IndustryDemoPreview: React.FC<IndustryDemoPreviewProps> = ({ 
  demo, 
  onStartOnboarding 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);

    // Initialize audio with demo-specific file or fallback
    const audioFile = demo.audioFile || '/audio/demo_de.mp3';
    audioRef.current = new Audio(audioFile);
    audioRef.current.onended = () => setIsPlaying(false);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [demo.id, demo.audioFile]); // React to demo.id changes

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e: Error) => {
          setIsPlaying(false);
          if (import.meta.env.DEV) {
            console.warn("Audio playback failed (this is normal if autoplay is blocked):", e.message);
          }
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div key={demo.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* Mock Phone UI */}
      <motion.div 
        key={`phone-${demo.id}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex justify-center"
      >
        <div className="relative w-[280px] h-[560px] bg-black rounded-[2.5rem] border-4 border-gray-800 shadow-2xl p-3 overflow-hidden z-10 ring-1 ring-white/10">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20"></div>
          
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-[2rem] flex flex-col items-center justify-between py-10 px-5 relative">
            
            {/* Caller Info */}
            <div className="text-center mt-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-3 flex items-center justify-center shadow-lg shadow-accent/20">
                <Mic size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">AIDevelo Assistant</h3>
              <p className="text-accent text-xs animate-pulse">00:15 • KI-Anruf aktiv</p>
            </div>

            {/* Waveform Visualization */}
            <div className="flex items-center justify-center gap-1 h-20 w-full">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? { 
                    height: [8, Math.random() * 50 + 8, 8],
                    backgroundColor: ['#1A73E8', '#00E0FF', '#1A73E8']
                  } : { height: 3, backgroundColor: '#374151' }}
                  transition={isPlaying ? { duration: 0.5, repeat: Infinity, delay: i * 0.05 } : { duration: 0.5 }}
                  className="w-1 rounded-full"
                />
              ))}
            </div>

            {/* Subtitles */}
            <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 min-h-[70px] border border-white/5">
              <AnimatePresence mode='wait'>
                {isPlaying ? (
                  <motion.div
                    key={`text-playing-${demo.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {demo.callerQuestion && (
                      <p className="text-xs text-gray-400 text-center italic mb-2">
                        "{demo.callerQuestion}"
                      </p>
                    )}
                    <p className="text-xs text-gray-200 text-center leading-relaxed">
                      "{demo.transcript}"
                    </p>
                  </motion.div>
                ) : (
                  <motion.p 
                    key={`text-idle-${demo.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-gray-500 text-center italic"
                  >
                    Drücken Sie Play für eine Demo...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex gap-4 w-full justify-center pb-6">
              <button className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                <div className="w-5 h-5 bg-current rounded-full" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            {demo.icon && <span className="text-3xl">{demo.icon}</span>}
            <div>
              <h3 className="text-2xl font-bold text-white">{demo.title}</h3>
              <p className="text-sm text-gray-400">{demo.subtitle}</p>
            </div>
          </div>
        </div>

        <ul className="space-y-3">
          {demo.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs flex-shrink-0 mt-0.5">✓</div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {onStartOnboarding && (
          <button 
            onClick={onStartOnboarding} 
            className="text-accent border-b border-accent pb-1 hover:text-white transition-colors flex items-center gap-2 group text-sm font-medium"
          >
            Jetzt für {demo.title} testen
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width={16} 
              height={16} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};


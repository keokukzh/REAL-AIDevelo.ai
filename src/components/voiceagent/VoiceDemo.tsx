import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Mic, ArrowRight, Volume2 } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';

interface VoiceDemoProps {
  onStartOnboarding?: () => void;
}

type DemoScenario = {
  id: string;
  title: string;
  description: string;
  audioFile: string;
  transcript: string[];
};

const demoScenarios: DemoScenario[] = [
  {
    id: 'appointment',
    title: 'Terminbuchung',
    description: 'Automatische Terminbuchung in 30 Sekunden',
    audioFile: '/audio/demo_de.mp3',
    transcript: [
      'Agent: "Guten Tag! Hier ist der digitale Assistent von Dr. Weber. Möchten Sie einen Termin für eine Untersuchung vereinbaren?"',
      'Kunde: "Ja, gerne. Hätten Sie nächste Woche etwas frei?"',
      'Agent: "Gerne. Ich habe am Donnerstag um 14:30 Uhr einen freien Termin. Passt Ihnen das?"',
      'Kunde: "Perfekt, das passt mir gut."',
      'Agent: "Ausgezeichnet! Ich habe den Termin für Sie gebucht. Sie erhalten gleich eine Bestätigung per SMS."',
    ],
  },
  {
    id: 'lead-qualification',
    title: 'Lead-Qualifizierung',
    description: 'Automatische Qualifizierung von Interessenten',
    audioFile: '/audio/demo_de.mp3',
    transcript: [
      'Agent: "Guten Tag! Vielen Dank für Ihr Interesse. Können Sie mir kurz sagen, wofür Sie sich interessieren?"',
      'Kunde: "Ich suche eine Lösung für meine Praxis."',
      'Agent: "Verstehe. Wie viele Anrufe erhalten Sie pro Monat ungefähr?"',
      'Kunde: "So etwa 200-300 Anrufe."',
      'Agent: "Perfekt! Ich habe Ihre Anfrage notiert. Unser Team meldet sich heute noch bei Ihnen."',
    ],
  },
];

export const VoiceDemo: React.FC<VoiceDemoProps> = ({ onStartOnboarding }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(demoScenarios[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio with selected scenario
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    audioRef.current = new Audio(selectedScenario.audioFile);
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [selectedScenario]);

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch((e: Error) => {
              setIsPlaying(false);
              if (import.meta.env.DEV) {
                console.warn("Audio playback failed:", e.message);
              }
            });
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <RevealSection className="py-24 bg-gradient-to-b from-background to-surface relative overflow-hidden section-spacing" id="demo">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Mock Phone UI */}
        <div className="relative flex justify-center">
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

              {/* Subtitles with Timer */}
              <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 min-h-[120px] border border-white/5">
                <AnimatePresence mode='wait'>
                    {isPlaying ? (
                        <motion.div
                            key="text-playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs text-green-400 font-mono">{selectedScenario.title} läuft...</span>
                            </div>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {selectedScenario.transcript.slice(0, 2).map((line, idx) => (
                                <p key={idx} className="text-xs text-gray-200 leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p 
                            key="text-idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-gray-500 text-center italic"
                        >
                            Drücken Sie Play für eine Demo der {selectedScenario.title.toLowerCase()}...
                        </motion.p>
                    )}
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="w-full px-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 font-mono">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <span className="text-xs text-gray-400 font-mono">{formatTime(duration)}</span>
                </div>
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
        </div>

        {/* Description */}
        <div className="space-y-8">
           <div>
             <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
               {selectedScenario.title} in <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">30 Sekunden</span>
             </h2>
             <p className="text-xl text-gray-400 leading-relaxed mb-6">
               {selectedScenario.description}
             </p>

             {/* Scenario Selector */}
             <div className="flex gap-3 mb-8">
               {demoScenarios.map((scenario) => (
                 <button
                   key={scenario.id}
                   onClick={() => {
                     setSelectedScenario(scenario);
                     setIsPlaying(false);
                     if (audioRef.current) {
                       audioRef.current.pause();
                       setCurrentTime(0);
                     }
                   }}
                   className={`px-4 py-2 rounded-lg border-2 transition-all ${
                     selectedScenario.id === scenario.id
                       ? 'border-accent bg-accent/10 text-accent'
                       : 'border-slate-700 bg-slate-800/50 text-gray-400 hover:border-slate-600'
                   }`}
                 >
                   {scenario.title}
                 </button>
               ))}
             </div>
             
             <ul className="space-y-4 mb-8">
                {['Versteht Schweizerdeutsch & Hochdeutsch', 'Erkennt Emotionen und Dringlichkeit', 'Kann unterbrochen werden (Full Duplex)'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">✓</div>
                        {item}
                    </li>
                ))}
             </ul>

             {/* Full Transcript */}
             {selectedScenario.transcript.length > 0 && (
               <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-6">
                 <div className="flex items-center gap-2 mb-3">
                   <Volume2 size={16} className="text-accent" />
                   <h3 className="text-sm font-semibold text-white">Vollständiges Transkript</h3>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto">
                   {selectedScenario.transcript.map((line, idx) => (
                     <p key={idx} className="text-xs text-gray-400 leading-relaxed">
                       {line}
                     </p>
                   ))}
                 </div>
               </div>
             )}

             <div className="flex flex-wrap gap-4">
               <button onClick={onStartOnboarding} className="text-white border-b border-accent pb-1 hover:text-accent transition-colors flex items-center gap-2 group">
                  Jetzt gratis testen <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
               <a
                 href="https://calendly.com/aidevelo-enterprise"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-sm text-accent hover:text-white border border-accent/40 rounded-full px-4 py-2 transition-colors"
               >
                 Termin buchen
               </a>
             </div>
           </div>
        </div>

      </div>
    </RevealSection>
  );
};

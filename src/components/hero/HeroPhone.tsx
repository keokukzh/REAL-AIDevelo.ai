import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Phone, Play, Pause, ChevronDown } from 'lucide-react';

interface DemoScenario {
    id: string;
    title: string;
    subtitle: string;
    audioFile: string;
    transcript: string;
    icon: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
    {
        id: 'friseur',
        title: 'Friseursalon',
        subtitle: 'Terminvereinbarung',
        audioFile: '/audio/demo_friseur.mp3', // Branchenspezifische Audio-Datei
        transcript: 'Guten Tag! Hier ist der digitale Assistent von Salon Beauty. Möchten Sie einen Termin für einen Haarschnitt vereinbaren?',
        icon: '✂️'
    },
    {
        id: 'garage',
        title: 'Autowerkstatt',
        subtitle: 'Service-Anfrage',
        audioFile: '/audio/demo_garage.mp3', // Branchenspezifische Audio-Datei
        transcript: 'Grüezi! Hier ist die Garage Müller. Wie kann ich Ihnen helfen? Möchten Sie einen Service-Termin vereinbaren?',
        icon: '🔧'
    },
    {
        id: 'zahnarzt',
        title: 'Zahnarztpraxis',
        subtitle: 'Terminbuchung',
        audioFile: '/audio/demo_zahnarzt.mp3', // Branchenspezifische Audio-Datei
        transcript: 'Guten Tag! Hier ist der digitale Assistent von Dr. Weber. Möchten Sie einen Termin für eine Untersuchung vereinbaren?',
        icon: '🦷'
    },
    {
        id: 'restaurant',
        title: 'Restaurant',
        subtitle: 'Tischreservierung',
        audioFile: '/audio/demo_restaurant.mp3', // Branchenspezifische Audio-Datei
        transcript: 'Grüezi! Hier ist das Restaurant Alpenblick. Möchten Sie einen Tisch reservieren? Für wie viele Personen?',
        icon: '🍽️'
    },
    {
        id: 'immobilien',
        title: 'Immobilien',
        subtitle: 'Besichtigungstermin',
        audioFile: '/audio/demo_immobilien.mp3', // Branchenspezifische Audio-Datei
        transcript: 'Guten Tag! Hier ist Immobilien AG. Möchten Sie eine Besichtigung vereinbaren? Welche Art von Immobilie suchen Sie?',
        icon: '🏠'
    }
];

export const HeroPhone = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [selectedDemo, setSelectedDemo] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
    const [showDemoSelector, setShowDemoSelector] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio with fallback
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        
        const loadAudio = (audioPath: string, isFallback = false) => {
            const audio = new Audio(audioPath);
            
            audio.onended = () => {
                setIsPlaying(false);
                setDuration(0);
            };
            
            audio.onloadedmetadata = () => {
                if (audio) {
                    setDuration(Math.floor(audio.duration));
                }
            };
            
            audio.ontimeupdate = () => {
                if (audio) {
                    setDuration(Math.floor(audio.currentTime));
                }
            };
            
            // Fallback handling: Wenn die branchenspezifische Datei nicht existiert
            if (!isFallback) {
                audio.onerror = () => {
                    // Fallback zur Standard-Demo-Datei
                    loadAudio('/audio/demo_de.mp3', true);
                };
            }
            
            audioRef.current = audio;
        };
        
        // Versuche zuerst die branchenspezifische Datei zu laden
        loadAudio(selectedDemo.audioFile);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [selectedDemo]);

    // Handle play/pause
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch((e: Error) => {
                    // Silently handle audio play errors (user interaction required, autoplay blocked, etc.)
                    setIsPlaying(false);
                    // Only log in development for debugging
                    if (import.meta.env.DEV) {
                        console.warn("Audio playback failed (this is normal if autoplay is blocked):", e.message);
                    }
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showDemoSelector && !target.closest('.demo-selector-container')) {
                setShowDemoSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDemoSelector]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDemoSelect = (demo: DemoScenario) => {
        setSelectedDemo(demo);
        setShowDemoSelector(false);
        if (isPlaying) {
            setIsPlaying(false);
        }
    };

    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            {/* Notch */}
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
            
            {/* Side Buttons */}
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-950 relative flex flex-col justify-between pt-12 pb-8 px-6">
                
                {/* Header Info */}
                <div className="text-center space-y-2">
                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20"></div>
                        <Mic className="text-white w-8 h-8" />
                     </div>
                     <h3 className="text-white font-bold text-lg leading-tight">AIDevelo Assistant</h3>
                     <p className="text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {isPlaying ? formatTime(duration) : '00:00'} • KI-Anruf aktiv
                     </p>
                     
                     {/* Demo Selector */}
                     <div className="relative mt-3 demo-selector-container">
                        <button
                            onClick={() => setShowDemoSelector(!showDemoSelector)}
                            className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white flex items-center justify-between transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span>{selectedDemo.icon}</span>
                                <span className="truncate">{selectedDemo.title}</span>
                            </span>
                            <ChevronDown size={14} className={`transition-transform ${showDemoSelector ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {showDemoSelector && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl"
                                >
                                    {DEMO_SCENARIOS.map((demo) => (
                                        <button
                                            key={demo.id}
                                            onClick={() => handleDemoSelect(demo)}
                                            className={`w-full px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors flex items-center gap-2 ${
                                                selectedDemo.id === demo.id ? 'bg-slate-800 text-accent' : 'text-white'
                                            }`}
                                        >
                                            <span>{demo.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{demo.title}</div>
                                                <div className="text-gray-400 text-[10px] truncate">{demo.subtitle}</div>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>
                </div>

                {/* Animated Waveform Visualization */}
                <div className="flex items-center justify-center gap-1 h-16">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full"
                            animate={{
                                height: isPlaying ? [10, Math.random() * 40 + 10, 10] : 4,
                                opacity: isPlaying ? 1 : 0.3
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                ease: "easeInOut",
                                delay: i * 0.05
                            }}
                        />
                    ))}
                </div>

                {/* Transcript Display */}
                <div className="flex-1 flex items-center justify-center min-h-[80px]">
                    <AnimatePresence mode="wait">
                        {isPlaying ? (
                            <motion.p
                                key="transcript-playing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-xs text-gray-300 text-center px-4 leading-relaxed"
                            >
                                "{selectedDemo.transcript}"
                            </motion.p>
                        ) : (
                            <motion.p
                                key="transcript-idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-gray-500 text-center px-4 italic"
                            >
                                Wählen Sie eine Demo und drücken Sie Play
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Controls Area */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                        <p className="text-slate-400 text-xs text-center mb-3">
                            {isPlaying ? "Demo läuft..." : "Drücken Sie Play für eine Demo..."}
                        </p>
                        
                        <div className="flex items-center justify-center gap-6">
                            {/* Hang Up Button */}
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setIsPlaying(false);
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        audioRef.current.currentTime = 0;
                                    }
                                }}
                                className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Phone className="w-5 h-5 rotate-[135deg]" />
                            </motion.button>

                            {/* Play Button */}
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'}`}
                            >
                                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                            </motion.button>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Reflection/Glare */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none rounded-r-[2rem]"></div>
        </div>
    );
};

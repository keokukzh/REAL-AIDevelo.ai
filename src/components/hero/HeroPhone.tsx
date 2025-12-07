import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Phone, Play, Pause } from 'lucide-react';

export const HeroPhone = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

                {/* Controls Area */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                        <p className="text-slate-400 text-xs text-center mb-3">
                            {isPlaying ? "Demo läuft..." : "Drücken Sie Play für eine Demo..."}
                        </p>
                        
                        <div className="flex items-center justify-center gap-6">
                            {/* Hang Up Button (Visual only) */}
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
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

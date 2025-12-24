import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Mic } from 'lucide-react';

interface DemoAgentPlayerProps {
  name: string;
  industry: string;
  audioUrl?: string;
  demoText: string;
}

export const DemoAgentPlayer: React.FC<DemoAgentPlayerProps> = ({ name, industry, audioUrl, demoText }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:bg-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-swiss-red/20 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-swiss-red" />
          </div>
          <div>
            <h4 className="font-bold text-white group-hover:text-swiss-red transition-colors">{name}</h4>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{industry}</span>
          </div>
        </div>
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-swiss-red rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-lg shadow-swiss-red/30"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
        </button>
      </div>

      <p className="text-sm text-gray-400 italic mb-4 leading-relaxed">
        "{demoText}"
      </p>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleEnded}
          className="hidden"
        />
      )}

      {/* Visualizer effect when playing */}
      {isPlaying && (
        <div className="flex items-center gap-1 mt-2">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-3 bg-swiss-red/50 rounded-full"
              animate={{ height: [8, 16, 8] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypewriterTitleProps {
  words: string[];
  baseText: string;
  className?: string;
}

export const TypewriterTitle: React.FC<TypewriterTitleProps> = ({ 
  words, 
  baseText, 
  className = "" 
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <h1 className={`${className} flex flex-col items-start`}>
      <span className="text-white mb-2">{baseText}</span>
      <div className="relative h-[1.2em] w-full">
        <AnimatePresence mode="wait">
          <motion.span
            key={words[index]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute left-0 bg-gradient-to-r from-swiss-red via-red-500 to-swiss-red bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-mesh whitespace-nowrap"
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </h1>
  );
};

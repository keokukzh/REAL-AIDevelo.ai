import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const SCREENSHOT_ONE_API_KEY = import.meta.env.VITE_SCREENSHOT_ONE_API_KEY || 'demo';

interface Slide {
  id: number;
  title: string;
  category: string;
  image: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Lusion',
    category: 'Creative Agency',
    image: 'https://lusion.co',
    color: 'purple',
  },
  {
    id: 2,
    title: 'Amie',
    category: 'Productivity App',
    image: 'https://amie.so',
    color: 'blue',
  },
  {
    id: 3,
    title: 'Vercel Ship',
    category: 'Tech / SaaS',
    image: 'https://vercel.com/ship',
    color: 'emerald',
  },
  {
    id: 4,
    title: 'Metalab',
    category: 'Design Studio',
    image: 'https://metalab.com',
    color: 'amber',
  },
  {
    id: 5,
    title: 'Notion',
    category: 'Product',
    image: 'https://notion.so',
    color: 'blue',
  },
  {
    id: 6,
    title: 'SuperHi',
    category: 'Education',
    image: 'https://superhi.com',
    color: 'purple',
  },
];

export const WebdesignSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] group">
      {/* Glow Effect */}
      <div
        className={`absolute -inset-4 bg-${currentSlide.color}-500/10 rounded-[2rem] blur-3xl transition-colors duration-1000`}
      />

      {/* Main Container */}
      <div className="relative h-full w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
            }}
            className="absolute inset-0"
          >
            {/* Video Preview - Animated Website */}
            <div className="relative w-full h-full overflow-hidden bg-slate-900">
              <video
                src={`https://api.screenshotone.com/animate?access_key=${SCREENSHOT_ONE_API_KEY}&url=${encodeURIComponent(currentSlide.image)}&viewport_width=1920&viewport_height=1080&format=mp4`}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                crossOrigin="anonymous"
                title={`Video preview of ${currentSlide.title}`}
                onError={(e) => {
                  // Fallback to iframe if video fails
                  const video = e.target as HTMLVideoElement;
                  const container = video.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <iframe
                        src="${currentSlide.image}"
                        class="absolute inset-0 w-full h-full"
                        style="transform: scale(1.5); transform-origin: top left; width: 133.33%; height: 133.33%;"
                        title="Live preview of ${currentSlide.title}"
                        sandbox="allow-same-origin allow-scripts allow-popups"
                        loading="lazy"
                      ></iframe>
                      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none"></div>
                    `;
                  }
                }}
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

            {/* Slide Info */}
            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1 lg:space-y-2"
              >
                <span
                  className={`text-[10px] lg:text-xs font-mono font-bold text-${currentSlide.color}-400 uppercase tracking-widest`}
                >
                  {currentSlide.category}
                </span>
                <h3 className="text-xl lg:text-3xl font-bold text-white flex items-center gap-3">
                  {currentSlide.title}
                  <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-white/40" />
                </h3>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="p-2 lg:p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="p-2 lg:p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 flex gap-2 z-30">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? `w-8 bg-${currentSlide.color}-500 shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]`
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

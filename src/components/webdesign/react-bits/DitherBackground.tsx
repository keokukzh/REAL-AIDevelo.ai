import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface DitherBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Dither Background Component
 * Retro dithered noise shader background from React Bits
 */
export const DitherBackground: React.FC<DitherBackgroundProps> = ({ 
  className = '', 
  children 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const generateDither = () => {
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 50;
        const value = 10 + noise;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 20;    // A (low opacity for subtle effect)
      }
      ctx.putImageData(imageData, 0, 0);
    };

    generateDither();
    const interval = setInterval(generateDither, 100);

    window.addEventListener('resize', setupCanvas);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setupCanvas);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-slate-950" />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ mixBlendMode: 'overlay' }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
};

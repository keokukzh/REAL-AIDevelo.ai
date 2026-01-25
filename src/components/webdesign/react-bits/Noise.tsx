import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface NoiseProps {
  className?: string;
  intensity?: number;
  speed?: number;
}

/**
 * Noise Component from React Bits
 * Animated film grain / noise overlay adding subtle texture and motion
 */
export const Noise: React.FC<NoiseProps> = ({
  className = '',
  intensity = 0.1,
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 255;
        data[i] = 255 + noise;     // R
        data[i + 1] = 255 + noise; // G
        data[i + 2] = 255 + noise; // B
        data[i + 3] = intensity * 255; // A
      }

      ctx.putImageData(imageData, 0, 0);
    };

    updateCanvas();
    const interval = setInterval(updateCanvas, 100 / speed);

    window.addEventListener('resize', updateCanvas);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateCanvas);
    };
  }, [intensity, speed, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: 'overlay', opacity: intensity }}
      aria-hidden="true"
    />
  );
};

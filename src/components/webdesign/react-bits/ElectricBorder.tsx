import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface ElectricBorderProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

/**
 * ElectricBorder Component from React Bits
 * Jittery electric energy border with animated arcs, glow and adjustable intensity
 */
export const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  className = '',
  intensity = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = `rgba(218, 41, 28, ${intensity})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(218, 41, 28, 0.8)';

      // Draw animated electric border
      const time = Date.now() * 0.001;
      const segments = 20;
      const jitter = 3;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = t * canvas.width;
        const y = Math.sin(time * 2 + t * 10) * jitter;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    updateCanvas();
    const interval = setInterval(updateCanvas, 50);

    return () => clearInterval(interval);
  }, [intensity, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 border-2 border-swiss-red/30 rounded-lg" />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
};

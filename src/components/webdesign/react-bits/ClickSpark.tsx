import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface Spark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface ClickSparkProps {
  children: React.ReactNode;
  className?: string;
  particleCount?: number;
  color?: string;
}

/**
 * ClickSpark Component from React Bits
 * Creates particle spark bursts at click position
 */
export const ClickSpark: React.FC<ClickSparkProps> = ({
  children,
  className = '',
  particleCount = 8,
  color = '#DA291C',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const element = ref.current;
    let animationFrame: number;

    const handleClick = (e: MouseEvent) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newSparks: Spark[] = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
      }));

      setSparks((prev) => [...prev, ...newSparks]);
    };

    const animate = () => {
      setSparks((prev) =>
        prev
          .map((spark) => ({
            ...spark,
            x: spark.x + spark.vx,
            y: spark.y + spark.vy,
            life: spark.life - 0.02,
            vx: spark.vx * 0.95,
            vy: spark.vy * 0.95,
          }))
          .filter((spark) => spark.life > 0)
      );
      animationFrame = requestAnimationFrame(animate);
    };

    element.addEventListener('click', handleClick);
    animate();

    return () => {
      element.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrame);
    };
  }, [particleCount, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: spark.x,
            top: spark.y,
            width: '4px',
            height: '4px',
            backgroundColor: color,
            opacity: spark.life,
            transform: `translate(-50%, -50%) scale(${spark.life})`,
            boxShadow: `0 0 ${8 * spark.life}px ${color}`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

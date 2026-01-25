import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface Star {
  id: number;
  angle: number;
  distance: number;
  size: number;
  opacity: number;
}

interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
  starCount?: number;
  speed?: number;
}

/**
 * StarBorder Component from React Bits
 * Animated star / sparkle border orbiting content with twinkle pulses
 */
export const StarBorder: React.FC<StarBorderProps> = ({
  children,
  className = '',
  starCount = 12,
  speed = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const newStars: Star[] = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      angle: (i / starCount) * Math.PI * 2,
      distance: 50,
      size: 3 + Math.random() * 2,
      opacity: 0.5 + Math.random() * 0.5,
    }));

    setStars(newStars);

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.01 * speed;
      setStars((prev) =>
        prev.map((star) => ({
          ...star,
          opacity: 0.3 + Math.sin(time * 2 + star.id) * 0.3,
        }))
      );
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [starCount, speed, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {stars.map((star) => {
        const x = Math.cos(star.angle) * star.distance;
        const y = Math.sin(star.angle) * star.distance;
        return (
          <div
            key={star.id}
            className="absolute rounded-full bg-swiss-red pointer-events-none"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${star.size * 2}px rgba(218, 41, 28, ${star.opacity})`,
            }}
            aria-hidden="true"
          />
        );
      })}
      {children}
    </div>
  );
};

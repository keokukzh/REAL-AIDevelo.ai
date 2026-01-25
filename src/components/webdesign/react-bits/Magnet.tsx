import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface MagnetProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/**
 * Magnet Component from React Bits
 * Elements magnetically ease toward the cursor then settle back with spring physics
 */
export const Magnet: React.FC<MagnetProps> = ({
  children,
  strength = 0.3,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const element = ref.current;
    let animationFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      const updatePosition = () => {
        setPosition((prev) => {
          const newX = prev.x + (deltaX - prev.x) * 0.1;
          const newY = prev.y + (deltaY - prev.y) * 0.1;
          return { x: newX, y: newY };
        });
        animationFrame = requestAnimationFrame(updatePosition);
      };

      updatePosition();
    };

    const handleMouseLeave = () => {
      cancelAnimationFrame(animationFrame);
      setPosition({ x: 0, y: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, [strength, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: prefersReducedMotion
          ? 'none'
          : `translate(${position.x}px, ${position.y}px)`,
        transition: prefersReducedMotion ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};

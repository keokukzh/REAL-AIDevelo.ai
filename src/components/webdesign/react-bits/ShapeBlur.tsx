import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface ShapeBlurProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

/**
 * ShapeBlur Component from React Bits
 * Morphing blurred geometric shape. The effect occurs on hover.
 */
export const ShapeBlur: React.FC<ShapeBlurProps> = ({
  children,
  className = '',
  intensity = 0.3,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const element = ref.current;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-full blur-3xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle, rgba(218, 41, 28, ${intensity}) 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transform: 'scale(1.5)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

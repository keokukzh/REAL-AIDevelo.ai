import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import AntigravityComponent from '../Antigravity';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AntigravityBackgroundProps {
  count?: number;
  color?: string;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  autoAnimate?: boolean;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  particleShape?: 'capsule' | 'sphere' | 'box' | 'tetrahedron';
  fieldStrength?: number;
}

/**
 * AntigravityBackground Wrapper Component
 * 
 * Wraps the React Bits Antigravity component for use in WebdesignPage.
 * Provides 3D particle effects that form rings around cursor/magnet points.
 * Respects user's reduced motion preferences and optimizes performance
 * by only rendering when in view.
 */
export const AntigravityBackground: React.FC<AntigravityBackgroundProps> = ({
  count = 300,
  color = '#FF9FFC',
  magnetRadius = 10,
  ringRadius = 10,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 2,
  lerpSpeed = 0.1,
  autoAnimate = false,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = 'capsule',
  fieldStrength = 10,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  // Only render when in view to save GPU resources
  const isInView = useInView(containerRef, { amount: 0.1, margin: "100px" });

  // Disable Antigravity for users who prefer reduced motion
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    >
      {isInView && (
        <AntigravityComponent
          count={count}
          color={color}
          magnetRadius={magnetRadius}
          ringRadius={ringRadius}
          waveSpeed={waveSpeed}
          waveAmplitude={waveAmplitude}
          particleSize={particleSize}
          lerpSpeed={lerpSpeed}
          autoAnimate={autoAnimate}
          particleVariance={particleVariance}
          rotationSpeed={rotationSpeed}
          depthFactor={depthFactor}
          pulseSpeed={pulseSpeed}
          particleShape={particleShape}
          fieldStrength={fieldStrength}
        />
      )}
    </div>
  );
};

import React from 'react';
import SplashCursor from '../SplashCursor';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * SplashCursorBackground Component
 * 
 * This component integrates the SplashCursor fluid simulation effect from React Bits.
 * The SplashCursor component creates an interactive fluid simulation that follows cursor movement.
 * Respects user's reduced motion preferences.
 */

export const SplashCursorBackground: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  // Disable SplashCursor for users who prefer reduced motion
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <SplashCursor
      SIM_RESOLUTION={256}
      DYE_RESOLUTION={1536}
      DENSITY_DISSIPATION={3}
      VELOCITY_DISSIPATION={1}
      PRESSURE={0.3}
      CURL={30}
      SPLAT_RADIUS={0.5}
      SPLAT_FORCE={20000}
      COLOR_UPDATE_SPEED={50}
    />
  );
};

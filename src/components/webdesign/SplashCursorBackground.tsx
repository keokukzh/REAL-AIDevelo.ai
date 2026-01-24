import React from 'react';
import SplashCursor from '../SplashCursor';

/**
 * SplashCursorBackground Component
 * 
 * This component integrates the SplashCursor fluid simulation effect from React Bits.
 * The SplashCursor component creates an interactive fluid simulation that follows cursor movement.
 */

export const SplashCursorBackground: React.FC = () => {
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

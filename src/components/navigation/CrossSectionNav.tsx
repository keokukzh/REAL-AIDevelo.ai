import React from 'react';
import { useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { useNavigation } from '../../hooks/useNavigation';
import { NavLink } from './NavLink';

interface CrossSectionNavProps {
  variant?: 'header' | 'sidebar';
  className?: string;
  excludeCurrent?: boolean;
}

/**
 * Cross-section navigation component
 * Provides navigation between main sections (Voice Agents, Webdesign, Dashboard)
 * Used in Dashboard header and SideNav footer
 */
export const CrossSectionNav: React.FC<CrossSectionNavProps> = ({
  variant = 'header',
  className = '',
  excludeCurrent = true,
}) => {
  const location = useLocation();
  const nav = useNavigation();

  const items = Object.values(NAVIGATION_ITEMS).filter((item) => {
    if (excludeCurrent && item.path === location.pathname) {
      return false;
    }
    return true;
  });

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => nav.goTo(item.path)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            aria-label={item.ariaLabel}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          label={item.label}
          variant="button"
          ariaLabel={item.ariaLabel}
          className="flex-1"
        />
      ))}
    </div>
  );
};

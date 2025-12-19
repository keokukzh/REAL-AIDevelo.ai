import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';
import { ROUTES } from '../../config/navigation';
import { motion } from 'framer-motion';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items?: Array<BreadcrumbItem>;
  currentLabel?: string;
  showHome?: boolean;
  className?: string;
}

/**
 * Breadcrumb navigation component
 * Displays hierarchical navigation path with clickable links
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  currentLabel,
  showHome = true,
  className = '',
}) => {
  const location = useLocation();
  const nav = useNavigation();

  // Auto-generate breadcrumbs if not provided
  const breadcrumbs = React.useMemo(() => {
    if (items.length > 0) {
      return items;
    }

    const autoBreadcrumbs = nav.getBreadcrumbs(location.pathname);
    if (autoBreadcrumbs.length === 0 && showHome) {
      return [{ label: 'Home', path: ROUTES.HOME }];
    }
    return autoBreadcrumbs;
  }, [items, location.pathname, nav, showHome]);

  // Get current label
  const finalCurrentLabel = currentLabel || breadcrumbs[breadcrumbs.length - 1]?.label || '';

  if (breadcrumbs.length === 0 && !finalCurrentLabel) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm ${className}`}
    >
      <ol className="flex items-center gap-2" role="list">
        {showHome && breadcrumbs[0]?.path === ROUTES.HOME && (
          <li>
            <motion.a
              href={ROUTES.HOME}
              onClick={(e) => {
                e.preventDefault();
                nav.goToHome();
              }}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded px-1"
              aria-label="Zur Startseite"
              whileHover={{ scale: 1.05 }}
              whileFocus={{ scale: 1.05 }}
            >
              <Home size={16} aria-hidden="true" />
              <span className="sr-only">Home</span>
            </motion.a>
          </li>
        )}

        {breadcrumbs
          .filter((item) => showHome ? item.path !== ROUTES.HOME : true)
          .map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isCurrent = isLast && !finalCurrentLabel;

            return (
              <li key={item.path} className="flex items-center gap-2">
                <ChevronRight
                  size={16}
                  className="text-gray-600 flex-shrink-0"
                  aria-hidden="true"
                />
                {isCurrent ? (
                  <span className="text-white font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <motion.a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      nav.goTo(item.path, true);
                    }}
                    className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded px-1"
                    aria-label={`Zu ${item.label} navigieren`}
                    whileHover={{ scale: 1.05 }}
                    whileFocus={{ scale: 1.05 }}
                  >
                    {item.label}
                  </motion.a>
                )}
              </li>
            );
          })}

        {finalCurrentLabel && (
          <li className="flex items-center gap-2">
            <ChevronRight
              size={16}
              className="text-gray-600 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-white font-medium" aria-current="page">
              {finalCurrentLabel}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};

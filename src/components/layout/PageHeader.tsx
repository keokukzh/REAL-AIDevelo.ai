import React from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../navigation/Breadcrumb';
import { BackButton } from '../navigation/BackButton';

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Array<BreadcrumbItem>;
  currentBreadcrumbLabel?: string;
  description?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backButtonLabel?: string;
  backButtonTo?: string;
  onBackClick?: () => void;
  className?: string;
}

/**
 * Standardized page header component
 * Combines breadcrumbs, title, description, and action buttons
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbs,
  currentBreadcrumbLabel,
  description,
  actions,
  showBackButton = false,
  backButtonLabel,
  backButtonTo,
  onBackClick,
  className = '',
}) => {
  return (
    <header
      className={`space-y-4 mb-8 ${className}`}
      role="banner"
    >
      {/* Breadcrumbs and Back Button Row */}
      {(breadcrumbs || showBackButton) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <BackButton
                label={backButtonLabel}
                to={backButtonTo}
                onClick={onBackClick}
                variant="ghost"
              />
            )}
            {breadcrumbs && (
              <Breadcrumb
                items={breadcrumbs}
                currentLabel={currentBreadcrumbLabel}
                className="hidden sm:flex"
              />
            )}
          </div>
        </div>
      )}

      {/* Title and Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

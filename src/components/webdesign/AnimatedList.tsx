import React from 'react';
import AnimatedListComponent from '../AnimatedList';

interface AnimatedListProps {
  items: string[];
  onItemSelect?: (item: string, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
}

/**
 * AnimatedList Wrapper Component
 * 
 * Wraps the React Bits AnimatedList component for use in WebdesignPage.
 * Provides scrollable animated list with keyboard navigation.
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
}) => {
  return (
    <AnimatedListComponent
      items={items}
      onItemSelect={onItemSelect}
      showGradients={showGradients}
      enableArrowNavigation={enableArrowNavigation}
      className={className}
      itemClassName={itemClassName}
      displayScrollbar={displayScrollbar}
      initialSelectedIndex={initialSelectedIndex}
    />
  );
};

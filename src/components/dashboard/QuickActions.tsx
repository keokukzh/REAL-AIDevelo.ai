import React from 'react';

interface QuickAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action.disabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-accent text-black hover:bg-accent/80'
          }`}
          title={action.tooltip || action.label}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

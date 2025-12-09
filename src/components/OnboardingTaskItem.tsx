import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { OnboardingTask } from './OnboardingTaskList';

interface OnboardingTaskItemProps {
  task: OnboardingTask;
  onClick: () => void;
  disabled?: boolean;
}

export const OnboardingTaskItem: React.FC<OnboardingTaskItemProps> = ({
  task,
  onClick,
  disabled = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative p-6 rounded-xl border transition-all cursor-pointer ${
        task.completed
          ? 'bg-green-500/10 border-green-500/30'
          : disabled
          ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
          : 'bg-white/5 border-white/10 hover:border-accent/50 hover:bg-white/10'
      }`}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-1">
          {task.completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" fill="currentColor" />
          ) : (
            <Circle className="w-6 h-6 text-gray-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-bold ${task.completed ? 'text-green-400' : 'text-white'}`}>
              {task.title}
            </h3>
            {!task.completed && !disabled && (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-400">{task.description}</p>
        </div>
      </div>

      {/* Progress indicator for completed tasks */}
      {task.completed && (
        <div className="absolute top-0 right-0 w-2 h-full bg-green-500/30 rounded-r-xl" />
      )}
    </motion.div>
  );
};


import React from 'react';
import { motion } from 'framer-motion';
import { OnboardingTaskItem } from './OnboardingTaskItem';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon?: React.ReactNode;
}

interface OnboardingTaskListProps {
  tasks: OnboardingTask[];
  onTaskClick: (taskId: string) => void;
  getTaskStatus: (taskId: string) => 'completed' | 'available' | 'locked';
}

export const OnboardingTaskList: React.FC<OnboardingTaskListProps> = ({
  tasks,
  onTaskClick,
  getTaskStatus,
}) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Onboarding-Aufgaben</h2>
          <span className="text-sm text-gray-400">
            {completedCount} von {tasks.length} abgeschlossen
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((task, index) => {
          const status = getTaskStatus(task.id);
          return (
            <OnboardingTaskItem
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              disabled={status === 'locked'}
            />
          );
        })}
      </div>
    </div>
  );
};


import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface PreviewBannerProps {
  onExploreAgents?: () => void;
}

export const PreviewBanner: React.FC<PreviewBannerProps> = ({ onExploreAgents }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-2 border-primary/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold font-display mb-2">
              <span className="text-white">Voice Agents – </span>
              <span className="text-primary">Coming Soon</span>
            </h3>
            <p className="text-gray-300 mb-3">
              Unser Team arbeitet mit Hochleistung an den Agents. Diese werden bald erhältlich sein.
            </p>
            <p className="text-gray-400 text-sm">
              Im Preview-Modus können Sie bereits Test-Agents anhören und sich mit der Funktionalität vertraut machen.
            </p>
          </div>
          {onExploreAgents && (
            <div className="flex-shrink-0">
              <Button
                onClick={onExploreAgents}
                variant="primary"
                className="bg-primary hover:bg-primary/80 text-white border-none"
                icon={<ArrowRight size={18} />}
              >
                Test-Agents erkunden
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};


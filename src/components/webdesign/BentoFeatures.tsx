import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BentoFeaturesProps {
  features: Feature[];
}

export const BentoFeatures: React.FC<BentoFeaturesProps> = ({ features }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]">
      {features.map((feature, index) => {
        // Create a bento-like pattern
        let gridClasses = "md:col-span-3 lg:col-span-4"; // Default
        
        if (index === 0) {
          gridClasses = "md:col-span-6 lg:col-span-8 lg:row-span-2"; // Featured 1
        } else if (index === 1) {
          gridClasses = "md:col-span-3 lg:col-span-4 lg:row-span-1";
        } else if (index === 2) {
          gridClasses = "md:col-span-3 lg:col-span-4 lg:row-span-1";
        } else if (index === 3) {
          gridClasses = "md:col-span-6 lg:col-span-4 lg:row-span-2"; // Tall
        } else if (index === 4) {
          gridClasses = "md:col-span-6 lg:col-span-8 lg:row-span-1"; // Wide
        }

        return (
          <div key={feature.title} className={gridClasses}>
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          </div>
        );
      })}
    </div>
  );
};

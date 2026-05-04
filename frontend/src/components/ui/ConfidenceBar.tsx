import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ConfidenceBarProps {
  confidence: number;
  className?: string;
  showLabel?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  className,
  showLabel = true,
}) => {
  const percentage = Math.round(confidence * 100);
  const isHigh = confidence >= 0.6;
  const color = isHigh ? 'bg-accent' : 'bg-status-warning';
  const textColor = isHigh ? 'text-accent' : 'text-status-warning';

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(color, 'h-full')}
        />
      </div>

      {showLabel && (
        <div className="flex items-center justify-between mt-2">
          <p className={cn('text-xs font-mono', textColor)}>
            {percentage}%
          </p>
          {!isHigh && (
            <p className="text-xs text-status-warning font-sans">
              Try adjusting your hand position
            </p>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

type StatusType = 'detecting' | 'ready' | 'no-hand' | 'idle';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; bgColor: string; dotColor: string; pulse: boolean }
> = {
  detecting: {
    label: 'DETECTING',
    bgColor: 'bg-accent/10',
    dotColor: 'bg-accent',
    pulse: true,
  },
  ready: {
    label: 'READY',
    bgColor: 'bg-accent/10',
    dotColor: 'bg-accent',
    pulse: false,
  },
  'no-hand': {
    label: 'NO HAND',
    bgColor: 'bg-status-warning/10',
    dotColor: 'bg-status-warning',
    pulse: false,
  },
    idle: {
    label: 'IDLE',
    bgColor: 'bg-cream/5',
    dotColor: 'bg-cream-dim',
    pulse: false,
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  // Line 42 — guard against any future unknown values
const config = statusConfig[status] ?? statusConfig['idle'];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-pill',
        config.bgColor,
        'border border-border-subtle',
        'font-mono text-sm font-medium',
        'text-cream',
        className
      )}
      aria-live="polite"
      aria-label={`Status: ${config.label}`}
    >
      <motion.div
        className={cn('w-2 h-2 rounded-full', config.dotColor)}
        animate={
          config.pulse
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(74, 222, 128, 0.5)',
                  '0 0 0 8px rgba(74, 222, 128, 0)',
                ],
              }
            : {}
        }
        transition={config.pulse ? { duration: 1.5, repeat: Infinity } : {}}
      />
      <span>{config.label}</span>
    </div>
  );
};

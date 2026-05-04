import React from 'react';
import { motion } from 'framer-motion';
import { cameraStore } from '../../stores/cameraStore';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../utils/cn';

export const ModeToggle: React.FC = () => {
  const mode = cameraStore((state) => state.mode);
  const setMode = cameraStore((state) => state.setMode);

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed right-4 bottom-24 pointer-events-auto z-40"
    >
      <GlassCard className="p-1 flex flex-col gap-1 rounded-pill">
        <button
          onClick={() => setMode('letter')}
          className={cn(
            'flex items-center justify-center',
            'min-h-[48px] min-w-[48px]',
            'rounded-pill font-mono text-sm font-medium',
            'transition-all duration-200',
            mode === 'letter'
              ? 'bg-accent text-bg-primary'
              : 'bg-bg-elevated text-cream-muted hover:text-cream'
          )}
          aria-label="Letter mode"
        >
          A–Z
        </button>
        <button
          onClick={() => setMode('word')}
          className={cn(
            'flex items-center justify-center',
            'min-h-[48px] min-w-[48px]',
            'rounded-pill font-mono text-sm font-medium',
            'transition-all duration-200',
            mode === 'word'
              ? 'bg-accent text-bg-primary'
              : 'bg-bg-elevated text-cream-muted hover:text-cream'
          )}
          aria-label="Word mode"
        >
          Word
        </button>
      </GlassCard>
    </motion.div>
  );
};

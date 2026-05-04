import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import type { PredictionResponse } from '../../types/inference';

interface PredictionPanelProps {
  prediction: PredictionResponse | null;
  onSaveSession?: () => Promise<void>;
  onClear?: () => void;
  isLoading?: boolean;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  prediction,
  onClear,
}) => {
  // Auto-clear the prediction after 2 seconds so it acts like a flash
  useEffect(() => {
    if (prediction && onClear) {
      const timer = setTimeout(() => {
        onClear();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [prediction, onClear]);

  return (
    <AnimatePresence>
      {prediction && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          // ✅ Changed 'right-6' to 'left-6' here
          className="absolute bottom-6 left-6 z-50 pointer-events-auto"
        >
          <GlassCard className="flex items-center gap-4 px-4 py-3 rounded-2xl shadow-xl border border-white/10 bg-black/40 backdrop-blur-md">
            
            {/* The Predicted Letter */}
            <div className="flex items-center justify-center bg-accent text-bg-primary h-12 w-12 rounded-xl font-bold text-2xl shadow-inner">
              {prediction.prediction}
            </div>
            
            {/* The Confidence Score */}
            <div className="flex flex-col min-w-[4rem]">
              <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">
                Match
              </span>
              <span className="text-lg text-cream font-mono font-medium">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>

          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
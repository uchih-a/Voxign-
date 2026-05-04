import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authStore } from '../stores/authStore';
import { tokenManager } from '../utils/tokenManager';
import { inferenceApi } from '../api/inference';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authStore((state) => state.isAuthenticated());
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check authentication
        setStatus('Verifying session...');
        setProgress(30);

        const refreshToken = tokenManager.getRefresh();
        if (!refreshToken) {
          setStatus('Ready');
          setProgress(100);
          setTimeout(() => navigate('/login'), 1000);
          return;
        }

        // Check backend health
        setStatus('Checking backend...');
        setProgress(60);
        await inferenceApi.checkHealth();

        // Check if user is authenticated
        setStatus('Loading models...');
        setProgress(85);

        if (isAuthenticated) {
          setStatus('Ready');
          setProgress(100);
          setTimeout(() => navigate('/dashboard'), 500);
        } else {
          setStatus('Ready');
          setProgress(100);
          setTimeout(() => navigate('/login'), 500);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setStatus('Ready');
        setProgress(100);
        setTimeout(() => navigate('/login'), 500);
      }
    };

    initialize();
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      {/* Logo and Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        {/* Hand SVG Icon */}
        <svg
          className="w-24 h-24 mx-auto mb-6 text-accent"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simplified hand with landmarks */}
          <circle cx="50" cy="70" r="8" fill="currentColor" />
          <circle cx="35" cy="50" r="6" fill="currentColor" opacity="0.8" />
          <circle cx="50" cy="40" r="6" fill="currentColor" opacity="0.8" />
          <circle cx="65" cy="50" r="6" fill="currentColor" opacity="0.8" />
          <circle cx="30" cy="30" r="5" fill="currentColor" opacity="0.6" />
          <circle cx="70" cy="30" r="5" fill="currentColor" opacity="0.6" />

          {/* Connection lines */}
          <line x1="50" y1="70" x2="35" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="70" x2="50" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="70" x2="65" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="35" y1="50" x2="30" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="65" y1="50" x2="70" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-serif text-5xl font-bold text-cream mb-3"
        >
          SignSense
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-sans text-lg text-cream-muted"
        >
          Every hand has a voice.
        </motion.p>
      </motion.div>

      {/* Loading Spinner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <LoadingSpinner size="lg" />
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="relative h-1 bg-bg-elevated rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full bg-accent"
          />
        </div>
      </div>

      {/* Status Text */}
      <motion.p
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="font-mono text-sm text-cream-dim"
      >
        {status}
      </motion.p>
    </div>
  );
};

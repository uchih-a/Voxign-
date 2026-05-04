import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { authStore } from '../stores/authStore';
import { useInferenceHistory } from '../hooks/useInferenceHistory';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const firstName = user?.full_name.split(' ')[0] || 'User';

  const { data: historyData, isLoading } = useInferenceHistory({ pageSize: 3 });
  const recentSessions = historyData?.pages[0]?.items || [];

  const modeCards = [
    {
      title: 'Letters',
      subtitle: 'Recognize A to Z',
      badge: '26 signs',
      mode: 'letter' as const,
    },
    {
      title: 'Words',
      subtitle: 'Common phrases',
      badge: '13 signs',
      mode: 'word' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <TopBar title="Dashboard" />

      <div className="max-w-lg mx-auto p-4 space-y-6 pt-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="font-sans text-sm text-cream-muted">Good morning,</p>
          <h1 className="font-serif text-3xl font-bold text-cream">
            {firstName}
          </h1>
          <p className="font-sans text-sm text-cream-muted pt-2">
            What would you like to translate today?
          </p>
        </motion.div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-2 gap-4">
          {modeCards.map((card, idx) => (
            <motion.div
              key={card.mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => {
                // Store selected mode
                navigate('/recognition');
              }}
            >
              <GlassCard className="h-full p-6 cursor-pointer text-center hover:border-accent transition-colors">
                <h3 className="font-serif text-xl font-bold text-cream mb-1">
                  {card.title}
                </h3>
                <p className="font-sans text-xs text-cream-muted mb-3">
                  {card.subtitle}
                </p>
                <Badge variant={card.mode === 'letter' ? 'letter' : 'word'}>
                  {card.badge}
                </Badge>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <PrimaryButton
            fullWidth
            onClick={() => navigate('/recognition')}
            className="flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            Start Recognizing
          </PrimaryButton>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-sans text-sm font-medium text-cream-muted">
            Recent Activity
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <GlassCard key={session.id} className="p-4 flex items-center gap-4">
                  {/* Result Icon */}
                  <div className="w-12 h-12 rounded-btn bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <span className="font-serif text-lg font-bold text-accent">
                      {session.prediction[0]}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium text-cream">
                      {session.prediction}
                    </p>
                    <p className="font-mono text-xs text-cream-dim">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Confidence */}
                  <Badge variant="member">
                    {Math.round(session.confidence * 100)}%
                  </Badge>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-sans text-sm text-cream-muted mb-4">
                No sessions yet
              </p>
              <PrimaryButton
                onClick={() => navigate('/recognition')}
                className="mx-auto"
              >
                Start Now
              </PrimaryButton>
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { useInferenceHistory } from '../hooks/useInferenceHistory';

const filterOptions = [
  { label: 'All', value: undefined as undefined },
  { label: 'Letters', value: 'letter' as const },
  { label: 'Words', value: 'word' as const },
];

export const HistoryPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'letter' | 'word' | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage } = useInferenceHistory({
    modelType: selectedFilter,
    pageSize: 20,
  });

  const sessions = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <TopBar title="Your History" />

      <div className="max-w-lg mx-auto p-4 space-y-4 pt-6">
        {/* Session Count */}
        <p className="font-sans text-sm text-cream-muted">
          {data?.pages[0]?.total || 0} sessions
        </p>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-pill font-mono text-sm whitespace-nowrap transition-colors ${
                selectedFilter === filter.value
                  ? 'bg-accent text-bg-primary'
                  : 'bg-bg-elevated text-cream-muted hover:text-cream'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {isLoading && sessions.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === session.id ? null : session.id)
                  }
                >
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    {/* Result Square */}
                    <div className="w-12 h-12 rounded-btn bg-accent/15 flex items-center justify-center flex-shrink-0">
                      <span className="font-serif text-lg font-bold text-accent">
                        {session.prediction[0]}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-sans font-medium text-cream">
                          {session.prediction}
                        </p>
                        <Badge
                          variant={
                            session.model_type === 'letter' ? 'letter' : 'word'
                          }
                        >
                          {session.model_type === 'letter' ? 'Letter' : 'Word'}
                        </Badge>
                      </div>
                      <p className="font-mono text-xs text-cream-dim">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-sm font-medium text-accent">
                        {Math.round(session.confidence * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === session.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border-subtle space-y-3"
                    >
                      <ConfidenceBar
                        confidence={session.confidence}
                        showLabel={false}
                      />

                      {/* All Scores */}
                      <div className="space-y-2">
                        <p className="font-mono text-xs text-cream-muted">
                          All scores
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {Object.entries(session.raw_scores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([label, score]) => (
                              <div key={label} className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-cream-muted w-12">
                                  {label}
                                </span>
                                <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                  />
                                </div>
                                <span className="font-mono text-cream-dim w-10 text-right">
                                  {Math.round(score * 100)}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <p className="font-sans text-sm text-cream-muted">Nothing here yet</p>
            <PrimaryButton href="/recognition">Start Recognizing</PrimaryButton>
          </div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full py-3 rounded-btn border border-border-subtle text-cream hover:border-border-active transition-colors font-sans text-sm"
          >
            Load More
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
